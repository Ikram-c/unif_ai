package com.abertech.srportal.ui.rescue

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.abertech.srportal.core.GeoPosition
import com.abertech.srportal.core.Rescue
import com.abertech.srportal.core.RescueStatus
import com.abertech.srportal.core.SearchWindowCalculator
import com.abertech.srportal.core.SubjectProfile
import com.abertech.srportal.core.TimeFormat
import com.abertech.srportal.core.TravelMode
import com.abertech.srportal.di.AppContainer
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZonedDateTime
import java.util.UUID
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * Everything the New Rescue wizard collects before "Begin AI Model".
 */
data class WizardState(
    val pin: GeoPosition? = null,
    val locationLabel: String = "",
    val travelMode: TravelMode = TravelMode.ON_FOOT,
    val lastSeenDate: LocalDate,
    val lastSeenTime: LocalTime,
    val timeZone: String,
    val subject: SubjectProfile = SubjectProfile(),
    val running: Boolean = false,
    val progress: String = "",
    val error: String? = null,
) {
    /**
     * The last-seen moment as an instant in the chosen zone.
     */
    fun lastSeenInstant(): Instant =
        ZonedDateTime.of(lastSeenDate, lastSeenTime, TimeFormat.zoneOrUtc(timeZone)).toInstant()
}

/**
 * Wizard state shared by the location, travel-mode, date/time and begin screens.
 */
class NewRescueViewModel(private val container: AppContainer) : ViewModel() {
    private val state = MutableStateFlow(initialState())

    val wizard: StateFlow<WizardState> = state.asStateFlow()

    /**
     * Where the map opens before the operator has dropped a pin.
     */
    val defaultPin: GeoPosition
        get() = container.demo.defaultPin

    /**
     * Clears the wizard for a new case.
     */
    fun reset() {
        state.value = initialState()
    }

    fun setPin(position: GeoPosition, label: String = "") {
        state.update { it.copy(pin = position, locationLabel = label, error = null) }
    }

    fun setTravelMode(mode: TravelMode) {
        state.update { it.copy(travelMode = mode) }
    }

    /**
     * Steps through On Foot, Vehicle, Unknown in either direction.
     */
    fun cycleTravelMode(step: Int) {
        val modes = TravelMode.values()
        state.update {
            val index = (modes.indexOf(it.travelMode) + step + modes.size) % modes.size
            it.copy(travelMode = modes[index])
        }
    }

    fun setDate(date: LocalDate) {
        state.update { it.copy(lastSeenDate = date, error = null) }
    }

    fun setTime(time: LocalTime) {
        state.update { it.copy(lastSeenTime = time, error = null) }
    }

    /**
     * Cycles UTC, London and the device zone.
     */
    fun cycleTimeZone() {
        val zones = timeZoneChoices()
        state.update {
            val index = (zones.indexOf(it.timeZone) + 1) % zones.size
            it.copy(timeZone = zones[index])
        }
    }

    fun timeZoneChoices(): List<String> {
        val device = java.util.TimeZone.getDefault().id
        return listOf("UTC", "Europe/London", device).distinct()
    }

    fun updateSubject(transform: (SubjectProfile) -> SubjectProfile) {
        state.update { it.copy(subject = transform(it.subject)) }
    }

    /**
     * True when the chosen last-seen moment is in the future, which cannot be confirmed.
     */
    fun lastSeenIsInFuture(): Boolean = SearchWindowCalculator.isInFuture(state.value.lastSeenInstant(), container.clock())

    /**
     * Elapsed minutes for the confirmation label on the date/time step.
     */
    fun elapsedMinutes(): Long = SearchWindowCalculator.elapsedMinutes(state.value.lastSeenInstant(), container.clock())

    /**
     * Creates the rescue, runs the planner through the repository and hands back the case id.
     */
    fun beginModel(onDone: (String) -> Unit) {
        val snapshot = state.value
        val pin = snapshot.pin
        if (pin == null) {
            state.update { it.copy(error = "Drop the last known location first") }
            return
        }
        if (lastSeenIsInFuture()) {
            state.update { it.copy(error = "Last seen time is in the future") }
            return
        }
        if (snapshot.running) return
        viewModelScope.launch {
            state.update { it.copy(running = true, error = null, progress = "Computing search window") }
            try {
                val now = container.clock()
                val rescue = Rescue(
                    id = UUID.randomUUID().toString(),
                    status = RescueStatus.ONGOING,
                    createdAtUtc = TimeFormat.format(now),
                    lastKnownLocation = pin,
                    locationLabel = snapshot.locationLabel,
                    travelMode = snapshot.travelMode,
                    lastSeenUtc = TimeFormat.format(snapshot.lastSeenInstant()),
                    timeZone = snapshot.timeZone,
                    subject = snapshot.subject,
                )
                delay(STEP_DELAY_MS)
                state.update { it.copy(progress = "Querying satellite, UAV and dashcam metadata") }
                val planned = container.repository.runModel(rescue, now)
                state.update { it.copy(progress = "Scoring cells, equipment and team size") }
                delay(STEP_DELAY_MS)
                state.update { it.copy(running = false, progress = "") }
                onDone(planned.id)
            } catch (e: Exception) {
                state.update { it.copy(running = false, progress = "", error = e.message ?: "Model run failed") }
            }
        }
    }

    private fun initialState(): WizardState {
        val zone = container.settings.current.timeZone
        val lastSeen = container.clock().minusSeconds(DEFAULT_ELAPSED_SECONDS).atZone(TimeFormat.zoneOrUtc(zone))
        return WizardState(
            lastSeenDate = lastSeen.toLocalDate(),
            lastSeenTime = lastSeen.toLocalTime().withSecond(0).withNano(0),
            timeZone = zone,
        )
    }

    private companion object {
        const val STEP_DELAY_MS = 450L
        const val DEFAULT_ELAPSED_SECONDS = 3L * 3_600L
    }
}
