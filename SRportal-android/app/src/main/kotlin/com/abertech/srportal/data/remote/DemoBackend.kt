package com.abertech.srportal.data.remote

import com.abertech.srportal.core.DataSourceKind
import com.abertech.srportal.core.DemoDataset
import com.abertech.srportal.core.DetectionStatus
import com.abertech.srportal.core.Observation
import com.abertech.srportal.core.Place
import com.abertech.srportal.core.Rescue
import com.abertech.srportal.core.SearchDataBundle
import com.abertech.srportal.core.SearchWindowRequest
import com.abertech.srportal.core.ServerHealth
import java.util.concurrent.ConcurrentHashMap
import kotlinx.coroutines.delay

/**
 * Offline stand-in for the server so the demo never stalls on connectivity.
 *
 * Detector jobs are simulated as a clock: a triggered observation reports QUEUED, then
 * RUNNING, then DONE with a deterministic candidate count.
 */
class DemoBackend(private val demo: DemoDataset) : SarBackend {
    private val observations = ConcurrentHashMap<String, Observation>()
    private val triggeredAtMillis = ConcurrentHashMap<String, Long>()

    override suspend fun health(): ServerHealth = ServerHealth(status = "demo", version = "offline")

    /**
     * Lets the simulation address observations that came from the real server.
     */
    fun register(items: List<Observation>) {
        for (observation in items) {
            observations.putIfAbsent(observation.id, observation)
        }
    }

    override suspend fun listRescues(): List<Rescue> = emptyList()

    override suspend fun saveRescue(rescue: Rescue): Rescue = rescue

    override suspend fun searchWindow(request: SearchWindowRequest): SearchDataBundle {
        delay(SIMULATED_LATENCY_MS)
        val bundle = demo.bundle(request)
        register(bundle.observations)
        return bundle
    }

    override suspend fun triggerDetection(rescueId: String, observationId: String): Observation {
        delay(SIMULATED_LATENCY_MS / 2)
        triggeredAtMillis.putIfAbsent(observationId, System.currentTimeMillis())
        return observation(rescueId, observationId)
    }

    override suspend fun observation(rescueId: String, observationId: String): Observation {
        val base = observations[observationId] ?: Observation(
            id = observationId,
            source = DataSourceKind.DASHCAM,
            platformId = "unknown",
            observedAtUtc = "",
            distanceFromPinM = 0.0,
        )
        val started = triggeredAtMillis[observationId] ?: return base
        val elapsedSeconds = (System.currentTimeMillis() - started) / 1000
        val updated = when {
            elapsedSeconds < QUEUED_SECONDS -> base.copy(detectionStatus = DetectionStatus.QUEUED)
            elapsedSeconds < QUEUED_SECONDS + RUNNING_SECONDS -> base.copy(detectionStatus = DetectionStatus.RUNNING)
            else -> base.copy(detectionStatus = DetectionStatus.DONE, candidateCount = demo.detectionOutcome(observationId))
        }
        observations[observationId] = updated
        return updated
    }

    override suspend fun geocode(query: String): List<Place> = demo.search(query)

    private companion object {
        const val SIMULATED_LATENCY_MS = 600L
        const val QUEUED_SECONDS = 3L
        const val RUNNING_SECONDS = 6L
    }
}
