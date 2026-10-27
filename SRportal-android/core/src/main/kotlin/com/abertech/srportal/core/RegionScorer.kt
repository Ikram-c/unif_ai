package com.abertech.srportal.core

import kotlin.math.exp

/**
 * Ranks search cells by probability of area: a gaussian in distance from the pin whose width
 * follows the 50 percent ring, multiplied by a terrain prior that depends on travel mode.
 */
class RegionScorer(private val config: SarConfig = SarConfig()) {
    /**
     * A cell with its normalised probability mass and distance from the pin.
     */
    data class ScoredCell(val cell: SearchCell, val probability: Double, val distanceM: Double, val sector: String)

    /**
     * Every cell scored and normalised so the probabilities sum to one.
     */
    fun score(pin: GeoPosition, rings: List<RadiusRing>, cells: List<SearchCell>, mode: TravelMode): List<ScoredCell> {
        if (cells.isEmpty()) return emptyList()
        val p50 = rings.firstOrNull { it.probability == 0.5 }?.radiusM ?: rings.minOf { it.radiusM }
        val sigma = (p50 * config.scoring.sigmaOverP50).coerceAtLeast(1.0)
        val weights = if (mode == TravelMode.VEHICLE) config.scoring.vehicleTerrainWeights else config.scoring.terrainWeights
        val raw = cells.map { cell ->
            val distance = Geo.distanceM(pin, cell.centre)
            val decay = exp(-0.5 * (distance / sigma) * (distance / sigma))
            val terrain = weights[cell.terrain] ?: 1.0
            Triple(cell, decay * terrain * cell.areaKm2, distance)
        }
        val total = raw.sumOf { it.second }
        if (total <= 0.0) return emptyList()
        return raw.map { (cell, weight, distance) ->
            ScoredCell(cell, weight / total, distance, Geo.sector(Geo.bearingDeg(pin, cell.centre)))
        }
    }

    /**
     * The top-ranked regions with cumulative probability, at most `maxRegions` of them.
     */
    fun rank(scored: List<ScoredCell>): List<SearchRegion> {
        val sorted = scored.sortedByDescending { it.probability }
        val limit = minOf(config.scoring.maxRegions, sorted.size)
        val regions = ArrayList<SearchRegion>(limit)
        var cumulative = 0.0
        for (i in 0 until limit) {
            val entry = sorted[i]
            cumulative += entry.probability
            regions.add(
                SearchRegion(
                    cell = entry.cell,
                    rank = i + 1,
                    score = entry.probability,
                    cumulativeProbability = cumulative.coerceAtMost(1.0),
                    sector = entry.sector,
                    distanceM = entry.distanceM,
                )
            )
        }
        return regions
    }

    /**
     * Probability mass per compass sector, highest first; the cell at the pin joins "N".
     */
    fun sectors(scored: List<ScoredCell>): List<SectorSummary> {
        val grouped = scored.groupBy { it.sector }
        return grouped.map { (sector, entries) ->
            val terrainCounts = entries.groupingBy { it.cell.terrain }.eachCount()
            val dominant = terrainCounts.maxByOrNull { it.value }?.key ?: Terrain.UNKNOWN
            SectorSummary(
                sector = sector,
                probability = entries.sumOf { it.probability },
                areaKm2 = entries.sumOf { it.cell.areaKm2 },
                dominantTerrain = dominant,
                cellCount = entries.size,
            )
        }.sortedByDescending { it.probability }
    }
}
