package com.abertech.srportal.core

import java.time.Instant

/**
 * Orchestrates the planning heuristics into a [SearchPlan].
 *
 * The flow mirrors the pitch: pin plus confirmed last-seen time gives the time window; the
 * window bounds a database search of satellite, UAV and dashcam metadata; the wander radius
 * bounds the cells to score; weather decides equipment; the ranked cells size the team.
 */
class RescuePlanner(private val config: SarConfig = SarConfig()) {
    private val radiusModel = WanderRadiusModel(config)
    private val scorer = RegionScorer(config)
    private val assessor = EquipmentAssessor(config)
    private val sizer = TeamSizer(config)

    /**
     * The query the server needs, bounded by the 95 percent radius at [now].
     */
    fun request(rescue: Rescue, now: Instant): SearchWindowRequest {
        val lastSeen = TimeFormat.parse(rescue.lastSeenUtc)
        val elapsed = SearchWindowCalculator.elapsedMinutes(lastSeen, now)
        return SearchWindowRequest(
            rescueId = rescue.id,
            pin = rescue.lastKnownLocation,
            lastSeenUtc = TimeFormat.format(lastSeen),
            nowUtc = TimeFormat.format(now),
            travelMode = rescue.travelMode,
            radiusM = radiusModel.outerRadiusM(rescue.travelMode, elapsed, rescue.subject),
        )
    }

    /**
     * Scores [bundle] for [rescue] at [now].
     */
    fun plan(rescue: Rescue, bundle: SearchDataBundle, now: Instant): SearchPlan {
        val lastSeen = TimeFormat.parse(rescue.lastSeenUtc)
        val window = SearchWindowCalculator.compute(lastSeen, now)
        val rings = radiusModel.rings(rescue.travelMode, window.elapsedMinutes, rescue.subject)
        val scored = scorer.score(rescue.lastKnownLocation, rings, bundle.cells, rescue.travelMode)
        val regions = scorer.rank(scored)
        val sectors = scorer.sectors(scored)
        val sources = groupSources(bundle.observations, lastSeen, now)
        val equipment = assessor.assess(bundle.weather, window.elapsedMinutes, rescue.travelMode)
        val availableCount = sources.count { it.available }
        val team = sizer.estimate(regions, equipment, availableCount, bundle.weather.source)
        return SearchPlan(
            generatedAtUtc = TimeFormat.format(now),
            window = window,
            rings = rings,
            regions = regions,
            sectors = sectors,
            dataSources = sources,
            weather = bundle.weather,
            equipment = equipment,
            team = team,
            confidence = overallConfidence(availableCount, regions.size, bundle.cellSource),
            cellSource = bundle.cellSource,
        )
    }

    /**
     * One entry per source kind, keeping only observations inside the window, newest first.
     */
    fun groupSources(observations: List<Observation>, lastSeen: Instant, now: Instant): List<DataSourceAvailability> =
        DataSourceKind.values().map { kind ->
            val inWindow = observations
                .filter { it.source == kind && isInWindow(it.observedAtUtc, lastSeen, now) }
                .sortedByDescending { it.observedAtUtc }
            DataSourceAvailability(source = kind, available = inWindow.isNotEmpty(), observations = inWindow)
        }

    private fun isInWindow(observedAtUtc: String, lastSeen: Instant, now: Instant): Boolean {
        val observed = TimeFormat.parseOrNull(observedAtUtc) ?: return false
        return !observed.isBefore(lastSeen) && !observed.isAfter(now)
    }

    private fun overallConfidence(sourcesAvailable: Int, regionCount: Int, cellSource: String): Confidence = when {
        regionCount == 0 -> Confidence.LOW
        sourcesAvailable >= 2 && cellSource == "h3" -> Confidence.HIGH
        sourcesAvailable >= 1 -> Confidence.MEDIUM
        else -> Confidence.LOW
    }
}
