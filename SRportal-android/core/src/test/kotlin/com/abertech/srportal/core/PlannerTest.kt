package com.abertech.srportal.core

import java.time.Instant
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class PlannerTest {
    private val now: Instant = Instant.parse("2026-09-25T12:00:00Z")
    private val planner = RescuePlanner()
    private val demo = DemoDataset()

    private fun rescue(mode: TravelMode = TravelMode.ON_FOOT, hoursAgo: Long = 6): Rescue = Rescue(
        id = "test-rescue",
        status = RescueStatus.ONGOING,
        createdAtUtc = TimeFormat.format(now),
        lastKnownLocation = demo.defaultPin,
        travelMode = mode,
        lastSeenUtc = TimeFormat.format(now.minusSeconds(hoursAgo * 3_600)),
    )

    @Test
    fun requestUsesOuterRing() {
        val request = planner.request(rescue(), now)
        val rings = WanderRadiusModel().rings(TravelMode.ON_FOOT, 360)
        assertEquals(rings[2].radiusM, request.radiusM, 0.001)
        assertEquals("2026-09-25T06:00:00Z", request.lastSeenUtc)
    }

    @Test
    fun planIsCompleteAndInternallyConsistent() {
        val r = rescue()
        val plan = planner.plan(r, demo.bundle(planner.request(r, now)), now)
        assertEquals(360L, plan.window.elapsedMinutes)
        assertEquals(3, plan.rings.size)
        assertTrue(plan.regions.isNotEmpty())
        assertEquals((1..plan.regions.size).toList(), plan.regions.map { it.rank })
        assertTrue(plan.regions.zipWithNext().all { (a, b) -> a.score >= b.score })
        assertTrue(plan.regions.last().cumulativeProbability <= 1.0)
        assertTrue(plan.sectors.isNotEmpty())
        assertEquals(1.0, plan.sectors.sumOf { it.probability }, 0.001)
        assertTrue(plan.sectors.zipWithNext().all { (a, b) -> a.probability >= b.probability })
        assertEquals(DataSourceKind.values().toList(), plan.dataSources.map { it.source })
        assertEquals(EquipmentKind.values().toList(), plan.equipment.map { it.kind })
        assertTrue(plan.team.searchers >= 4)
        assertTrue(plan.team.teams >= 1)
        assertEquals("hexgrid-offline", plan.cellSource)
    }

    @Test
    fun observationsOutsideTheWindowAreDropped() {
        val lastSeen = now.minusSeconds(3_600)
        val inside = Observation("a", DataSourceKind.UAV, "x", TimeFormat.format(now.minusSeconds(600)), 0.0)
        val before = inside.copy(id = "b", observedAtUtc = TimeFormat.format(lastSeen.minusSeconds(60)))
        val after = inside.copy(id = "c", observedAtUtc = TimeFormat.format(now.plusSeconds(60)))
        val grouped = planner.groupSources(listOf(inside, before, after), lastSeen, now)
        val uav = grouped.first { it.source == DataSourceKind.UAV }
        assertEquals(listOf("a"), uav.observations.map { it.id })
        assertTrue(grouped.first { it.source == DataSourceKind.SATELLITE }.observations.isEmpty())
    }

    @Test
    fun demoBundleIsDeterministic() {
        val request = planner.request(rescue(hoursAgo = 30), now)
        val a = demo.bundle(request)
        val b = demo.bundle(request)
        assertEquals(a, b)
        assertTrue(a.observations.any { it.source == DataSourceKind.DASHCAM })
        assertTrue(a.observations.any { it.source == DataSourceKind.SATELLITE })
        assertTrue(a.observations.all { TimeFormat.parseOrNull(it.observedAtUtc) != null })
        assertTrue(a.cells.size <= 400)
    }

    @Test
    fun equipmentRulesRespectWeatherLimits() {
        val calm = WeatherSnapshot(5.0, 8.0, 0.2, 6_000.0, 10.0, 50.0, true, "demo")
        val storm = calm.copy(windMs = 16.0, gustMs = 22.0, precipitationMmH = 6.0, visibilityM = 300.0)
        val assessor = EquipmentAssessor()
        val calmResult = assessor.assess(calm, 120, TravelMode.ON_FOOT)
        val stormResult = assessor.assess(storm, 120, TravelMode.ON_FOOT)
        assertTrue(calmResult.first { it.kind == EquipmentKind.UAV_VISUAL }.viable)
        assertTrue(!stormResult.first { it.kind == EquipmentKind.UAV_VISUAL }.viable)
        assertTrue(!stormResult.first { it.kind == EquipmentKind.DOG_TEAM }.viable)
        assertTrue(stormResult.first { it.kind == EquipmentKind.GROUND_TEAM }.viable)
        val night = assessor.assess(calm.copy(daylight = false), 120, TravelMode.ON_FOOT)
        assertTrue(!night.first { it.kind == EquipmentKind.UAV_VISUAL }.viable)
        assertTrue(night.first { it.kind == EquipmentKind.UAV_THERMAL }.viable)
    }

    @Test
    fun teamGrowsWithSearchArea() {
        val short = rescue(hoursAgo = 1)
        val long = rescue(hoursAgo = 20)
        val shortPlan = planner.plan(short, demo.bundle(planner.request(short, now)), now)
        val longPlan = planner.plan(long, demo.bundle(planner.request(long, now)), now)
        assertTrue(longPlan.team.searchAreaKm2 > shortPlan.team.searchAreaKm2)
        assertTrue(longPlan.team.searchers >= shortPlan.team.searchers)
        assertTrue(shortPlan.team.searchers < 120, "short case should not hit the cap: ${shortPlan.team}")
    }

    @Test
    fun hexGridStaysWithinTheCellBudget() {
        val grid = HexGrid()
        for (radius in listOf(500.0, 3_000.0, 12_000.0, 60_000.0)) {
            val cells = grid.cover(demo.defaultPin, radius)
            assertTrue(cells.size in 7..400, "radius $radius gave ${cells.size} cells")
            assertTrue(cells.all { it.boundary.size == 6 })
            assertEquals(cells.size, cells.map { it.cellId }.toSet().size)
        }
    }

    @Test
    fun solarCalculatorKnowsNoonFromMidnight() {
        val pin = demo.defaultPin
        assertTrue(SolarCalculator.isDaylight(pin, Instant.parse("2026-06-21T12:00:00Z")))
        assertTrue(!SolarCalculator.isDaylight(pin, Instant.parse("2026-06-21T00:30:00Z")))
        assertTrue(SolarCalculator.elevationDeg(pin, Instant.parse("2026-06-21T12:00:00Z")) > 55.0)
    }

    @Test
    fun gazetteerSearchIsCaseInsensitive() {
        assertEquals("Aberystwyth", demo.search("aberyst").single().name)
        assertTrue(demo.search("").isEmpty())
    }
}
