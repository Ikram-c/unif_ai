package com.abertech.srportal.core

import kotlin.math.PI
import kotlin.math.asin
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.pow
import kotlin.math.sin
import kotlin.math.sqrt

/**
 * Small spherical-earth helpers; precise enough for search-area work at the kilometre scale.
 */
object Geo {
    const val EARTH_RADIUS_M: Double = 6_371_008.8
    private const val METRES_PER_DEGREE_LAT: Double = 111_320.0
    private val SECTORS: List<String> = listOf("N", "NE", "E", "SE", "S", "SW", "W", "NW")

    /**
     * Great-circle distance between two positions in metres.
     */
    fun distanceM(a: GeoPosition, b: GeoPosition): Double {
        val dLat = Math.toRadians(b.lat - a.lat)
        val dLon = Math.toRadians(b.lon - a.lon)
        val h = sin(dLat / 2).pow(2) + cos(Math.toRadians(a.lat)) * cos(Math.toRadians(b.lat)) * sin(dLon / 2).pow(2)
        return 2 * EARTH_RADIUS_M * asin(sqrt(h.coerceIn(0.0, 1.0)))
    }

    /**
     * Initial bearing from [from] to [to] in degrees clockwise from north, in [0, 360).
     */
    fun bearingDeg(from: GeoPosition, to: GeoPosition): Double {
        val lat1 = Math.toRadians(from.lat)
        val lat2 = Math.toRadians(to.lat)
        val dLon = Math.toRadians(to.lon - from.lon)
        val y = sin(dLon) * cos(lat2)
        val x = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(dLon)
        val deg = Math.toDegrees(atan2(y, x))
        return (deg + 360.0) % 360.0
    }

    /**
     * Eight-point compass label for a bearing in degrees.
     */
    fun sector(bearingDeg: Double): String {
        val index = ((bearingDeg + 22.5) / 45.0).toInt() % SECTORS.size
        return SECTORS[index]
    }

    /**
     * Position reached by travelling [distanceM] along [bearingDeg] from [origin].
     */
    fun destination(origin: GeoPosition, bearingDeg: Double, distanceM: Double): GeoPosition {
        val angular = distanceM / EARTH_RADIUS_M
        val brng = Math.toRadians(bearingDeg)
        val lat1 = Math.toRadians(origin.lat)
        val lon1 = Math.toRadians(origin.lon)
        val lat2 = asin(sin(lat1) * cos(angular) + cos(lat1) * sin(angular) * cos(brng))
        val lon2 = lon1 + atan2(sin(brng) * sin(angular) * cos(lat1), cos(angular) - sin(lat1) * sin(lat2))
        return GeoPosition(Math.toDegrees(lat2), normaliseLon(Math.toDegrees(lon2)))
    }

    /**
     * Converts a local east/north offset in metres around [origin] into a position.
     */
    fun offset(origin: GeoPosition, eastM: Double, northM: Double): GeoPosition {
        val metresPerDegreeLon = METRES_PER_DEGREE_LAT * cos(Math.toRadians(origin.lat))
        return GeoPosition(origin.lat + northM / METRES_PER_DEGREE_LAT, normaliseLon(origin.lon + eastM / metresPerDegreeLon))
    }

    /**
     * Approximate polygon area in square kilometres using a local equirectangular projection.
     */
    fun areaKm2(ring: List<GeoPosition>): Double {
        if (ring.size < 3) return 0.0
        val lat0 = Math.toRadians(ring.first().lat)
        val scaleX = METRES_PER_DEGREE_LAT * cos(lat0)
        var twiceArea = 0.0
        val n = ring.size
        for (i in 0 until n) {
            val p = ring[i]
            val q = ring[(i + 1) % n]
            val x1 = p.lon * scaleX
            val y1 = p.lat * METRES_PER_DEGREE_LAT
            val x2 = q.lon * scaleX
            val y2 = q.lat * METRES_PER_DEGREE_LAT
            twiceArea += x1 * y2 - x2 * y1
        }
        return kotlin.math.abs(twiceArea) / 2.0 / 1_000_000.0
    }

    /**
     * Regular polygon approximating a circle, [segments] vertices, for map overlays.
     */
    fun circle(centre: GeoPosition, radiusM: Double, segments: Int = 48): List<GeoPosition> {
        val count = segments.coerceIn(6, 360)
        val points = ArrayList<GeoPosition>(count)
        for (i in 0 until count) {
            points.add(destination(centre, 360.0 * i / count, radiusM))
        }
        return points
    }

    private fun normaliseLon(lon: Double): Double {
        var value = lon
        var guard = 0
        while (value > 180.0 && guard < 4) {
            value -= 360.0
            guard += 1
        }
        while (value < -180.0 && guard < 8) {
            value += 360.0
            guard += 1
        }
        return value
    }

    internal fun degToRad(deg: Double): Double = deg * PI / 180.0
}
