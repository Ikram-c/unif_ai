package com.abertech.srportal.core

import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

/**
 * Flat-top hexagonal tiling of a disc, used offline in place of H3 cells.
 *
 * Cell ids are stable for a given centre and radius so a plan can be re-rendered later. The
 * terrain of each cell is a deterministic pseudo-classification purely for the demo; the
 * server replaces it with real land-cover lookups per H3 cell.
 */
class HexGrid(private val params: HexGridParams = HexGridParams()) {
    /**
     * Cells whose centres lie within [radiusM] (plus one cell) of [centre].
     */
    fun cover(centre: GeoPosition, radiusM: Double): List<SearchCell> {
        val cellRadius = cellRadiusFor(radiusM)
        val rings = ceil(radiusM / (1.5 * cellRadius)).toInt() + 1
        val cells = ArrayList<SearchCell>()
        val areaKm2 = 3.0 * sqrt(3.0) / 2.0 * cellRadius * cellRadius / 1_000_000.0
        for (q in -rings..rings) {
            for (r in -rings..rings) {
                if (cells.size >= params.maxCells) return cells
                if (abs(q + r) > rings) continue
                val east = 1.5 * cellRadius * q
                val north = sqrt(3.0) * cellRadius * (r + q / 2.0)
                val distance = sqrt(east * east + north * north)
                if (distance > radiusM + cellRadius) continue
                val cellCentre = Geo.offset(centre, east, north)
                cells.add(
                    SearchCell(
                        cellId = "hex:%d:%d".format(q, r),
                        centre = cellCentre,
                        boundary = boundary(cellCentre, cellRadius),
                        terrain = pseudoTerrain(q, r),
                        areaKm2 = areaKm2,
                    )
                )
            }
        }
        return cells
    }

    /**
     * Cell circumradius: the nominal fraction of the search radius, raised so that the disc
     * needs at most `maxCells` cells (disc area over hexagon area) and never below the minimum.
     */
    fun cellRadiusFor(radiusM: Double): Double {
        val nominal = radiusM / params.cellsAcrossRadius.coerceAtLeast(1)
        val hexAreaFactor = 3.0 * sqrt(3.0) / 2.0
        val boundedByCount = radiusM * sqrt(Math.PI / (hexAreaFactor * params.maxCells.coerceAtLeast(7) * 0.8))
        return maxOf(nominal, boundedByCount, params.minCellRadiusM)
    }

    private fun boundary(centre: GeoPosition, cellRadius: Double): List<GeoPosition> {
        val points = ArrayList<GeoPosition>(6)
        for (i in 0 until 6) {
            val angle = Math.toRadians(60.0 * i)
            points.add(Geo.offset(centre, cellRadius * cos(angle), cellRadius * sin(angle)))
        }
        return points
    }

    private fun pseudoTerrain(q: Int, r: Int): Terrain {
        val hash = abs(q * 73_856_093 xor r * 19_349_663) % 10
        return when (hash) {
            0, 1, 2, 3 -> Terrain.OPEN_MOORLAND
            4, 5 -> Terrain.FOREST
            6, 7 -> Terrain.MOUNTAIN
            8 -> Terrain.FARMLAND
            else -> Terrain.WATER
        }
    }
}
