package com.abertech.srportal.data

import android.util.Log
import com.abertech.srportal.core.DemoDataset
import com.abertech.srportal.core.DetectionStatus
import com.abertech.srportal.core.Observation
import com.abertech.srportal.core.Place
import com.abertech.srportal.core.Rescue
import com.abertech.srportal.core.RescuePlanner
import com.abertech.srportal.core.RescueStatus
import com.abertech.srportal.core.SearchDataBundle
import com.abertech.srportal.core.SearchWindowRequest
import com.abertech.srportal.data.local.RescueStore
import com.abertech.srportal.data.remote.DemoBackend
import com.abertech.srportal.data.remote.RemoteBackend
import com.abertech.srportal.data.remote.SarBackend
import com.abertech.srportal.data.remote.ServerHealthMonitor
import java.time.Instant
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/**
 * Single source of truth for rescues: local JSON store first, cloud server when reachable.
 *
 * Every mutating call goes to the server when it is online and falls back to the demo backend
 * otherwise, so a button press always "does something" in a demo.
 */
class RescueRepository(
    private val remote: RemoteBackend,
    private val demoBackend: DemoBackend,
    private val health: ServerHealthMonitor,
    private val store: RescueStore,
    private val planner: RescuePlanner,
    private val demo: DemoDataset,
) {
    private val state = MutableStateFlow<List<Rescue>>(emptyList())
    private val mutex = Mutex()
    private var loaded = false

    val rescues: StateFlow<List<Rescue>> = state.asStateFlow()

    /**
     * Loads the local store (seeding the sample cases on first launch) and merges server cases.
     */
    suspend fun load(now: Instant) {
        mutex.withLock {
            if (loaded) return
            var local = store.readAll()
            if (local.isEmpty()) {
                local = demo.sampleRescues(now)
                store.writeAll(local)
            }
            state.value = local
            loaded = true
        }
        mergeFromServer()
    }

    /**
     * Pulls cases the server knows about that this device does not.
     */
    suspend fun mergeFromServer() {
        if (!health.isOnline) return
        val serverRescues = try {
            remote.listRescues()
        } catch (e: Exception) {
            e.rethrowIfCancelled()
            Log.w(TAG, "Server list unavailable: ${e.message}")
            return
        }
        mutex.withLock {
            val known = state.value.associateBy { it.id }.toMutableMap()
            for (rescue in serverRescues) {
                if (!known.containsKey(rescue.id)) known[rescue.id] = rescue
            }
            persist(known.values.sortedByDescending { it.createdAtUtc })
        }
    }

    /**
     * The rescue with [id], if known.
     */
    fun find(id: String): Rescue? = state.value.firstOrNull { it.id == id }

    /**
     * Saves locally and pushes to the server when online.
     */
    suspend fun save(rescue: Rescue): Rescue {
        mutex.withLock {
            val others = state.value.filterNot { it.id == rescue.id }
            persist((others + rescue).sortedByDescending { it.createdAtUtc })
        }
        if (health.isOnline) {
            try {
                remote.saveRescue(rescue)
            } catch (e: Exception) {
                e.rethrowIfCancelled()
                Log.w(TAG, "Server save failed, kept locally: ${e.message}")
            }
        }
        return rescue
    }

    /**
     * "Begin AI Model": query the window on the backend, plan it locally, store the result.
     */
    suspend fun runModel(rescue: Rescue, now: Instant): Rescue {
        val request = planner.request(rescue, now)
        val bundle = fetchBundle(request)
        val plan = planner.plan(rescue, bundle, now)
        return save(rescue.copy(plan = plan, status = RescueStatus.ONGOING))
    }

    /**
     * Asks the backend to run the small-object detector on one observation.
     */
    suspend fun triggerDetection(rescue: Rescue, observationId: String): Rescue {
        val updated = try {
            backend().triggerDetection(rescue.id, observationId)
        } catch (e: Exception) {
            e.rethrowIfCancelled()
            demoBackend.triggerDetection(rescue.id, observationId)
        }
        return save(replaceObservation(rescue, updated))
    }

    /**
     * Refreshes every observation whose detector job is still in flight.
     */
    suspend fun refreshDetections(rescue: Rescue): Rescue {
        val plan = rescue.plan ?: return rescue
        var current = rescue
        val pending = plan.dataSources.flatMap { it.observations }.filter {
            it.detectionStatus == DetectionStatus.QUEUED || it.detectionStatus == DetectionStatus.RUNNING
        }
        for (observation in pending.take(MAX_REFRESH_PER_TICK)) {
            val updated = try {
                backend().observation(rescue.id, observation.id)
            } catch (e: Exception) {
                e.rethrowIfCancelled()
                demoBackend.observation(rescue.id, observation.id)
            }
            current = replaceObservation(current, updated)
        }
        return if (current != rescue) save(current) else rescue
    }

    /**
     * Marks a case complete.
     */
    suspend fun complete(rescue: Rescue): Rescue = save(rescue.copy(status = RescueStatus.COMPLETED))

    /**
     * Reopens a completed case.
     */
    suspend fun reopen(rescue: Rescue): Rescue = save(rescue.copy(status = RescueStatus.ONGOING))

    /**
     * Place search for the map bar: server geocoder online, bundled gazetteer offline.
     */
    suspend fun geocode(query: String): List<Place> = try {
        backend().geocode(query)
    } catch (e: Exception) {
        e.rethrowIfCancelled()
        demo.search(query)
    }

    private suspend fun fetchBundle(request: SearchWindowRequest): SearchDataBundle {
        val bundle = try {
            backend().searchWindow(request)
        } catch (e: Exception) {
            e.rethrowIfCancelled()
            Log.w(TAG, "Server search-window failed, using demo bundle: ${e.message}")
            demoBackend.searchWindow(request)
        }
        demoBackend.register(bundle.observations)
        return bundle
    }

    private fun backend(): SarBackend = if (health.isOnline) remote else demoBackend

    /**
     * Copies only the detector fields so a fallback backend can never replace the imagery record.
     */
    private fun replaceObservation(rescue: Rescue, updated: Observation): Rescue {
        val plan = rescue.plan ?: return rescue
        val sources = plan.dataSources.map { source ->
            source.copy(
                observations = source.observations.map {
                    if (it.id == updated.id) it.copy(detectionStatus = updated.detectionStatus, candidateCount = updated.candidateCount) else it
                },
            )
        }
        return rescue.copy(plan = plan.copy(dataSources = sources))
    }

    private suspend fun persist(rescues: List<Rescue>) {
        state.value = rescues
        store.writeAll(rescues)
    }

    private companion object {
        const val TAG = "RescueRepository"
        const val MAX_REFRESH_PER_TICK = 20
    }
}

/**
 * Coroutine cancellation must propagate; only real failures may fall back to demo data.
 */
fun Exception.rethrowIfCancelled() {
    if (this is CancellationException && this !is TimeoutCancellationException) throw this
}
