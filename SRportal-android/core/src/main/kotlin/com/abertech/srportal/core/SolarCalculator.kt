package com.abertech.srportal.core

import java.time.Instant
import kotlin.math.asin
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin

/**
 * Low-precision solar position (about 0.5 degrees), enough to decide whether it is light
 * enough for visual drone operations.
 */
object SolarCalculator {
    private const val J2000_EPOCH_JD: Double = 2451545.0
    private const val UNIX_EPOCH_JD: Double = 2440587.5
    private const val SECONDS_PER_DAY: Double = 86_400.0

    /**
     * Sun elevation above the horizon in degrees at [position] and [instant].
     */
    fun elevationDeg(position: GeoPosition, instant: Instant): Double {
        val jd = instant.epochSecond / SECONDS_PER_DAY + UNIX_EPOCH_JD
        val n = jd - J2000_EPOCH_JD
        val meanLongitude = wrap360(280.460 + 0.9856474 * n)
        val meanAnomaly = Math.toRadians(wrap360(357.528 + 0.9856003 * n))
        val eclipticLongitude = Math.toRadians(
            meanLongitude + 1.915 * sin(meanAnomaly) + 0.020 * sin(2 * meanAnomaly)
        )
        val obliquity = Math.toRadians(23.439 - 0.0000004 * n)
        val rightAscension = atan2(cos(obliquity) * sin(eclipticLongitude), cos(eclipticLongitude))
        val declination = asin(sin(obliquity) * sin(eclipticLongitude))
        val gmstHours = wrap24(18.697374558 + 24.06570982441908 * n)
        val localSiderealDeg = wrap360(gmstHours * 15.0 + position.lon)
        val hourAngle = Math.toRadians(localSiderealDeg) - rightAscension
        val lat = Math.toRadians(position.lat)
        val sinElevation = sin(lat) * sin(declination) + cos(lat) * cos(declination) * cos(hourAngle)
        return Math.toDegrees(asin(sinElevation.coerceIn(-1.0, 1.0)))
    }

    /**
     * True when the sun is above the horizon.
     */
    fun isDaylight(position: GeoPosition, instant: Instant): Boolean = elevationDeg(position, instant) > 0.0

    private fun wrap360(value: Double): Double {
        val wrapped = value % 360.0
        return if (wrapped < 0) wrapped + 360.0 else wrapped
    }

    private fun wrap24(value: Double): Double {
        val wrapped = value % 24.0
        return if (wrapped < 0) wrapped + 24.0 else wrapped
    }
}
