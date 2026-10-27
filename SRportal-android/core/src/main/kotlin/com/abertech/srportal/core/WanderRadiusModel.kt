package com.abertech.srportal.core

import kotlin.math.exp
import kotlin.math.max
import kotlin.math.min

/**
 * Estimates how far the person may have travelled from the pin in the elapsed time.
 *
 * The output is three probability contours (50 / 75 / 95 percent). This is the seat that the
 * causal / A* model will take over: same inputs (travel mode, elapsed time, subject profile),
 * same output (rings), so the UI and the planner do not change when it lands.
 */
class WanderRadiusModel(private val config: SarConfig = SarConfig()) {
    /**
     * Probability rings for [mode] after [elapsedMinutes], scaled by [subject].
     */
    fun rings(mode: TravelMode, elapsedMinutes: Long, subject: SubjectProfile = SubjectProfile()): List<RadiusRing> {
        val hours = elapsedMinutes.coerceAtLeast(0L) / 60.0
        return when (mode) {
            TravelMode.ON_FOOT -> footRings(hours, subject)
            TravelMode.VEHICLE -> vehicleRings(hours)
            TravelMode.UNKNOWN -> merge(
                scale(footRings(hours, subject), config.vehicle.unknownFootMultiplier),
                scale(vehicleRings(hours), config.vehicle.unknownVehicleMultiplier),
            )
        }
    }

    /**
     * The 95 percent radius, which bounds the data query and the hex grid.
     */
    fun outerRadiusM(mode: TravelMode, elapsedMinutes: Long, subject: SubjectProfile = SubjectProfile()): Double =
        rings(mode, elapsedMinutes, subject).maxOf { it.radiusM }

    /**
     * Multiplier applied to walking displacement for this person.
     */
    fun profileFactor(subject: SubjectProfile): Double {
        val p = config.onFoot
        val fitness = when (subject.fitness) {
            Fitness.LOW -> p.fitnessLow
            Fitness.MEDIUM -> 1.0
            Fitness.HIGH -> p.fitnessHigh
        }
        val experience = when (subject.experience) {
            Experience.NOVICE -> p.experienceNovice
            Experience.INTERMEDIATE -> 1.0
            Experience.EXPERT -> p.experienceExpert
        }
        val age = subject.age
        val ageFactor = if (age != null && (age < p.childAgeLimit || age > p.elderlyAgeLimit)) p.ageFactor else 1.0
        return fitness * experience * ageFactor
    }

    private fun footRings(hours: Double, subject: SubjectProfile): List<RadiusRing> {
        val p = config.onFoot
        val saturation = 1.0 - exp(-hours / p.timeConstantHours.coerceAtLeast(0.01))
        val raw = p.d50SaturationM * saturation * profileFactor(subject)
        val p50 = clamp(raw, p.minRadiusM, p.maxRadiusM)
        val p75 = clamp(p50 * p.p75Multiplier, p.minRadiusM, p.maxRadiusM)
        val p95 = clamp(p50 * p.p95Multiplier, p.minRadiusM, p.maxRadiusM)
        return listOf(RadiusRing(0.50, p50), RadiusRing(0.75, p75), RadiusRing(0.95, p95))
    }

    private fun vehicleRings(hours: Double): List<RadiusRing> {
        val p = config.vehicle
        val reach = clamp(p.effectiveSpeedMPerH * hours, p.minRadiusM, p.maxRadiusM)
        val p50 = clamp(reach * p.p50Fraction, p.minRadiusM, p.maxRadiusM)
        val p95 = clamp(reach * p.p95Multiplier, p.minRadiusM, p.maxRadiusM)
        return listOf(RadiusRing(0.50, p50), RadiusRing(0.75, reach), RadiusRing(0.95, p95))
    }

    private fun scale(rings: List<RadiusRing>, factor: Double): List<RadiusRing> =
        rings.map { RadiusRing(it.probability, it.radiusM * factor) }

    private fun merge(a: List<RadiusRing>, b: List<RadiusRing>): List<RadiusRing> {
        val count = min(a.size, b.size)
        val merged = ArrayList<RadiusRing>(count)
        for (i in 0 until count) {
            merged.add(RadiusRing(a[i].probability, max(a[i].radiusM, b[i].radiusM)))
        }
        return merged
    }

    private fun clamp(value: Double, lo: Double, hi: Double): Double = value.coerceIn(lo, max(lo, hi))
}
