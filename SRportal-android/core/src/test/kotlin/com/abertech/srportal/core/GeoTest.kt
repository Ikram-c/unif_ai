package com.abertech.srportal.core

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class GeoTest {
    private val aberystwyth = GeoPosition(52.4153, -4.0829)
    private val rhayader = GeoPosition(52.3021, -3.5079)

    @Test
    fun distanceBetweenTownsIsAboutFortyKilometres() {
        val d = Geo.distanceM(aberystwyth, rhayader)
        assertTrue(d in 40_000.0..42_500.0, "distance was $d")
    }

    @Test
    fun destinationRoundTripsThroughDistance() {
        val target = Geo.destination(aberystwyth, 135.0, 5_000.0)
        assertEquals(5_000.0, Geo.distanceM(aberystwyth, target), 1.0)
        assertEquals(135.0, Geo.bearingDeg(aberystwyth, target), 0.5)
    }

    @Test
    fun sectorsCoverTheCompass() {
        assertEquals("N", Geo.sector(0.0))
        assertEquals("N", Geo.sector(359.0))
        assertEquals("NE", Geo.sector(45.0))
        assertEquals("S", Geo.sector(180.0))
        assertEquals("W", Geo.sector(270.0))
    }

    @Test
    fun circleAreaMatchesAnalyticValue() {
        val ring = Geo.circle(aberystwyth, 1_000.0, 120)
        val expectedKm2 = Math.PI * 1.0 * 1.0
        assertEquals(expectedKm2, Geo.areaKm2(ring), 0.02)
    }

    @Test
    fun offsetMovesEastAndNorth() {
        val moved = Geo.offset(aberystwyth, 1_000.0, 1_000.0)
        assertTrue(moved.lat > aberystwyth.lat)
        assertTrue(moved.lon > aberystwyth.lon)
        assertEquals(1_414.0, Geo.distanceM(aberystwyth, moved), 5.0)
    }
}
