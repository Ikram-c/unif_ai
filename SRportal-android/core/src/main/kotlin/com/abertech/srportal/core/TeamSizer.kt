package com.abertech.srportal.core

import kotlin.math.ceil

/**
 * Converts the priority cells into a first-period search-party size using sweep rates.
 *
 * The autoencoder over historical incidents that the roadmap describes would replace this
 * function; the inputs (regions, equipment, weather, elapsed time) are already what it needs.
 */
class TeamSizer(private val config: SarConfig = SarConfig()) {
    /**
     * Searchers and teams needed to sweep the priority cells inside the target hours.
     */
    fun estimate(
        regions: List<SearchRegion>,
        equipment: List<EquipmentAssessment>,
        sourcesAvailable: Int,
        weatherSource: String,
    ): TeamEstimate {
        val params = config.team
        val selected = selectRegions(regions, params.coverageTargetProbability, params.priorityCells)
        val areaKm2 = selected.sumOf { it.cell.areaKm2 }
        val covered = selected.lastOrNull()?.cumulativeProbability ?: 0.0
        val uavViable = equipment.any { it.viable && (it.kind == EquipmentKind.UAV_VISUAL || it.kind == EquipmentKind.UAV_THERMAL) }
        val groundShare = if (uavViable) 1.0 - params.uavAreaShare else 1.0
        val searcherHours = selected.sumOf { region ->
            val rate = params.coverageKm2PerSearcherHour[region.cell.terrain]
                ?: params.coverageKm2PerSearcherHour[Terrain.UNKNOWN]
                ?: 0.1
            region.cell.areaKm2 * groundShare / rate.coerceAtLeast(0.001)
        }
        val raw = ceil(searcherHours / params.targetHours.coerceAtLeast(0.5)).toInt()
        val searchers = raw.coerceIn(params.minSearchers, params.maxSearchers)
        val teams = ceil(searchers.toDouble() / params.teamSize.coerceAtLeast(1)).toInt().coerceAtLeast(1)
        val confidence = when {
            sourcesAvailable >= 2 && weatherSource != "demo" -> Confidence.HIGH
            sourcesAvailable >= 1 || weatherSource != "demo" -> Confidence.MEDIUM
            else -> Confidence.LOW
        }
        val rationale = buildString {
            append("Priority: %d cells, %.1f km2, holding %.0f%% of the probability mass. ".format(selected.size, areaKm2, covered * 100))
            if (uavViable) append("A UAV takes %.0f%% of that area. ".format(params.uavAreaShare * 100))
            append("Hasty sweep at terrain rates needs %.0f searcher-hours; %.0f h target period.".format(searcherHours, params.targetHours))
            if (raw > params.maxSearchers) append(" Capped at %d: phase the remaining cells into the next period.".format(params.maxSearchers))
        }
        return TeamEstimate(
            searchers = searchers,
            teams = teams,
            searchAreaKm2 = areaKm2,
            targetHours = params.targetHours,
            confidence = confidence,
            rationale = rationale,
        )
    }

    private fun selectRegions(regions: List<SearchRegion>, target: Double, maxCells: Int): List<SearchRegion> {
        val selected = ArrayList<SearchRegion>(regions.size)
        for (region in regions) {
            if (selected.size >= maxCells.coerceAtLeast(1)) break
            selected.add(region)
            if (region.cumulativeProbability >= target) break
        }
        return selected
    }
}
