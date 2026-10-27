package com.abertech.srportal.ui.results

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.abertech.srportal.core.DetectionStatus
import com.abertech.srportal.core.Rescue
import com.abertech.srportal.core.RescueStatus
import com.abertech.srportal.di.AppContainer
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

/**
 * Drives the results screen for one rescue: re-runs, detector triggers and completion.
 */
class ResultsViewModel(private val container: AppContainer, private val rescueId: String) : ViewModel() {
    private val busyState = MutableStateFlow(false)
    private val messageState = MutableStateFlow<String?>(null)

    val rescue: StateFlow<Rescue?> = container.repository.rescues
        .map { list -> list.firstOrNull { it.id == rescueId } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), container.repository.find(rescueId))

    val busy: StateFlow<Boolean> = busyState.asStateFlow()

    val message: StateFlow<String?> = messageState.asStateFlow()

    init {
        viewModelScope.launch { pollDetections() }
        ensurePlanned()
    }

    /**
     * Runs the model again with the current time, widening the window.
     */
    fun rerun() {
        val current = rescue.value ?: return
        launchBusy("Model re-run failed") { container.repository.runModel(current, container.clock()) }
    }

    /**
     * Sends the detector trigger for one observation to the backend.
     */
    fun triggerDetection(observationId: String) {
        val current = rescue.value ?: return
        launchBusy("Could not queue the detector") { container.repository.triggerDetection(current, observationId) }
    }

    /**
     * Flips the case between ongoing and completed.
     */
    fun toggleCompleted() {
        val current = rescue.value ?: return
        launchBusy("Could not update the case") {
            if (current.status == RescueStatus.COMPLETED) container.repository.reopen(current) else container.repository.complete(current)
        }
    }

    fun dismissMessage() {
        messageState.value = null
    }

    private fun ensurePlanned() {
        val current = rescue.value ?: return
        if (current.plan == null) {
            launchBusy("Model run failed") { container.repository.runModel(current, container.clock()) }
        }
    }

    private fun launchBusy(failureMessage: String, block: suspend () -> Unit) {
        if (busyState.value) return
        viewModelScope.launch {
            busyState.value = true
            try {
                block()
            } catch (e: Exception) {
                messageState.value = "$failureMessage: ${e.message}"
            } finally {
                busyState.value = false
            }
        }
    }

    private suspend fun pollDetections() {
        while (true) {
            delay(POLL_MS)
            val current = rescue.value ?: continue
            val plan = current.plan ?: continue
            val pending = plan.dataSources.any { source ->
                source.observations.any { it.detectionStatus == DetectionStatus.QUEUED || it.detectionStatus == DetectionStatus.RUNNING }
            }
            if (!pending) continue
            try {
                container.repository.refreshDetections(current)
            } catch (e: Exception) {
                messageState.value = "Detector status unavailable: ${e.message}"
            }
        }
    }

    private companion object {
        const val POLL_MS = 2_000L
    }
}
