package com.abertech.srportal.core

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class WanderRadiusModelTest {
    private val model = WanderRadiusModel()

    @Test
    fun ringsAreOrderedAndGrowWithTime() {
        val early = model.rings(TravelMode.ON_FOOT, 60)
        val late = model.rings(TravelMode.ON_FOOT, 8 * 60)
        assertEquals(listOf(0.5, 0.75, 0.95), early.map { it.probability })
        assertTrue(early[0].radiusM < early[1].radiusM && early[1].radiusM < early[2].radiusM)
        assertTrue(late[0].radiusM > early[0].radiusM)
    }

    @Test
    fun onFootHasFloorAndSaturates() {
        val zero = model.rings(TravelMode.ON_FOOT, 0)
        assertEquals(300.0, zero[0].radiusM, 0.001)
        val day = model.rings(TravelMode.ON_FOOT, 24 * 60)
        val week = model.rings(TravelMode.ON_FOOT, 7 * 24 * 60)
        assertEquals(3_000.0, week[0].radiusM, 1.0)
        assertEquals(12_000.0, week[2].radiusM, 1.0)
        assertTrue(week[0].radiusM - day[0].radiusM < 100.0)
    }

    @Test
    fun vehicleReachesFurtherThanWalking() {
        val foot = model.outerRadiusM(TravelMode.ON_FOOT, 120)
        val vehicle = model.outerRadiusM(TravelMode.VEHICLE, 120)
        assertTrue(vehicle > foot)
        assertEquals(40_000.0, model.rings(TravelMode.VEHICLE, 48 * 60)[1].radiusM, 0.001)
    }

    @Test
    fun unknownSitsBetweenWalkingAndDriving() {
        val unknown = model.rings(TravelMode.UNKNOWN, 180)
        val foot = model.rings(TravelMode.ON_FOOT, 180)
        val vehicle = model.rings(TravelMode.VEHICLE, 180)
        for (i in unknown.indices) {
            assertTrue(unknown[i].radiusM >= foot[i].radiusM)
            assertTrue(unknown[i].radiusM <= vehicle[i].radiusM)
            assertEquals(maxOf(foot[i].radiusM * 1.5, vehicle[i].radiusM * 0.5), unknown[i].radiusM, 0.001)
        }
    }

    @Test
    fun profileScalesDisplacement() {
        val fit = SubjectProfile(fitness = Fitness.HIGH, experience = Experience.EXPERT)
        val child = SubjectProfile(age = 8)
        assertTrue(model.profileFactor(fit) > 1.0)
        assertTrue(model.profileFactor(child) < 1.0)
        assertTrue(model.outerRadiusM(TravelMode.ON_FOOT, 240, fit) > model.outerRadiusM(TravelMode.ON_FOOT, 240, child))
    }
}
