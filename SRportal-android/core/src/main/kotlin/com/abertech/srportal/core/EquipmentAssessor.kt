package com.abertech.srportal.core

/**
 * Rule-based go / no-go for each equipment kind given the weather at the pin.
 */
class EquipmentAssessor(private val config: SarConfig = SarConfig()) {
    /**
     * One assessment per [EquipmentKind], in deployment-priority order.
     */
    fun assess(weather: WeatherSnapshot, elapsedMinutes: Long, mode: TravelMode): List<EquipmentAssessment> = listOf(
        uavVisual(weather),
        uavThermal(weather),
        groundTeam(weather),
        vehiclePatrol(weather, mode),
        dogTeam(weather, elapsedMinutes),
        helicopter(weather),
    )

    private fun uavVisual(w: WeatherSnapshot): EquipmentAssessment {
        val flight = uavFlightBlockers(w)
        if (flight.isNotEmpty()) return EquipmentAssessment(EquipmentKind.UAV_VISUAL, false, flight.joinToString("; "))
        if (!w.daylight) return EquipmentAssessment(EquipmentKind.UAV_VISUAL, false, "No daylight: use the thermal payload instead")
        return EquipmentAssessment(EquipmentKind.UAV_VISUAL, true, flyable(w))
    }

    private fun uavThermal(w: WeatherSnapshot): EquipmentAssessment {
        val flight = uavFlightBlockers(w)
        if (flight.isNotEmpty()) return EquipmentAssessment(EquipmentKind.UAV_THERMAL, false, flight.joinToString("; "))
        val note = if (w.daylight) "Flyable; thermal contrast is weaker in daylight" else "Flyable; best contrast after dark"
        return EquipmentAssessment(EquipmentKind.UAV_THERMAL, true, note)
    }

    private fun groundTeam(w: WeatherSnapshot): EquipmentAssessment {
        val limits = config.equipment
        val hazards = ArrayList<String>(2)
        if (w.windMs > limits.groundHazardWindMs) hazards.add("wind %.0f m/s".format(w.windMs))
        if (w.visibilityM < limits.groundHazardVisibilityM) hazards.add("visibility %.0f m".format(w.visibilityM))
        val reason = if (hazards.isEmpty()) "Deployable; %.0f m/s wind, %.1f km visibility".format(w.windMs, w.visibilityM / 1000.0)
        else "Deployable with exposure caution: " + hazards.joinToString(", ")
        return EquipmentAssessment(EquipmentKind.GROUND_TEAM, true, reason)
    }

    private fun vehiclePatrol(w: WeatherSnapshot, mode: TravelMode): EquipmentAssessment {
        val reason = when (mode) {
            TravelMode.VEHICLE -> "Priority: subject was in a vehicle, sweep road network and lay-bys"
            TravelMode.ON_FOOT -> "Useful for road-edge sweeps and moving teams to sector drop-offs"
            TravelMode.UNKNOWN -> "Sweep roads first to rule out a vehicle scenario"
        }
        val visibilityNote = if (w.visibilityM < config.equipment.groundHazardVisibilityM) "; drive with caution, visibility %.0f m".format(w.visibilityM) else ""
        return EquipmentAssessment(EquipmentKind.VEHICLE_PATROL, true, reason + visibilityNote)
    }

    private fun dogTeam(w: WeatherSnapshot, elapsedMinutes: Long): EquipmentAssessment {
        val limits = config.equipment
        val hours = elapsedMinutes / 60.0
        val blockers = ArrayList<String>(3)
        if (w.windMs > limits.dogMaxWindMs) blockers.add("wind %.0f m/s scatters scent".format(w.windMs))
        if (w.precipitationMmH > limits.dogMaxPrecipMmH) blockers.add("heavy rain %.1f mm/h".format(w.precipitationMmH))
        if (hours > limits.dogMaxElapsedHours) blockers.add("scent trail older than %.0f h".format(limits.dogMaxElapsedHours))
        if (blockers.isNotEmpty()) return EquipmentAssessment(EquipmentKind.DOG_TEAM, false, blockers.joinToString("; "))
        return EquipmentAssessment(EquipmentKind.DOG_TEAM, true, "Scent conditions acceptable; start from the pin")
    }

    private fun helicopter(w: WeatherSnapshot): EquipmentAssessment {
        val limits = config.equipment
        val blockers = ArrayList<String>(3)
        if (w.windMs > limits.heliMaxWindMs) blockers.add("wind %.0f m/s".format(w.windMs))
        if (w.visibilityM < limits.heliMinVisibilityM) blockers.add("visibility %.1f km".format(w.visibilityM / 1000.0))
        if (w.cloudCoverPct > limits.heliMaxCloudPct) blockers.add("cloud cover %.0f%%".format(w.cloudCoverPct))
        if (blockers.isNotEmpty()) return EquipmentAssessment(EquipmentKind.HELICOPTER, false, "Request only if conditions improve: " + blockers.joinToString(", "))
        return EquipmentAssessment(EquipmentKind.HELICOPTER, true, "Conditions allow a tasking request")
    }

    private fun uavFlightBlockers(w: WeatherSnapshot): List<String> {
        val limits = config.equipment
        val blockers = ArrayList<String>(5)
        if (w.windMs > limits.uavMaxWindMs) blockers.add("wind %.0f m/s over %.0f m/s limit".format(w.windMs, limits.uavMaxWindMs))
        if (w.gustMs > limits.uavMaxGustMs) blockers.add("gusts %.0f m/s over %.0f m/s limit".format(w.gustMs, limits.uavMaxGustMs))
        if (w.precipitationMmH > limits.uavMaxPrecipMmH) blockers.add("rain %.1f mm/h too wet".format(w.precipitationMmH))
        if (w.visibilityM < limits.uavMinVisibilityM) blockers.add("visibility %.0f m under %.0f m".format(w.visibilityM, limits.uavMinVisibilityM))
        if (w.temperatureC < limits.uavMinTempC) blockers.add("%.0f C below battery limit".format(w.temperatureC))
        return blockers
    }

    private fun flyable(w: WeatherSnapshot): String =
        "Flyable: wind %.0f m/s, rain %.1f mm/h, visibility %.1f km".format(w.windMs, w.precipitationMmH, w.visibilityM / 1000.0)
}
