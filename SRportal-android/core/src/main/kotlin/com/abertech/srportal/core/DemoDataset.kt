package com.abertech.srportal.core

import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneOffset
import kotlin.math.abs
import kotlin.random.Random

/**
 * Deterministic stand-in for the cloud database, used when the server is unreachable.
 *
 * Everything is derived from the request so the same rescue always produces the same
 * observations, which keeps a rehearsed demo repeatable. The shapes match what the server
 * returns after ingesting hexcover cells, dashcam frame manifests and OME-Zarr video indexes.
 */
class DemoDataset(private val config: SarConfig = SarConfig()) {
    private val hexGrid = HexGrid(config.hexGrid)

    /**
     * The default pin for a fresh rescue: the Elenydd uplands in the Cambrian Mountains.
     */
    val defaultPin: GeoPosition = GeoPosition(52.2950, -3.7600)

    /**
     * Places the map search bar can resolve without a network.
     */
    val gazetteer: List<Place> = listOf(
        Place("Elenydd, Cambrian Mountains", GeoPosition(52.2950, -3.7600), "Ceredigion / Powys"),
        Place("Aberystwyth", GeoPosition(52.4153, -4.0829), "Ceredigion"),
        Place("Pumlumon Fawr", GeoPosition(52.4675, -3.7823), "Ceredigion"),
        Place("Elan Valley", GeoPosition(52.2710, -3.5820), "Powys"),
        Place("Claerwen Reservoir", GeoPosition(52.2430, -3.7100), "Powys"),
        Place("Devil's Bridge", GeoPosition(52.3772, -3.8517), "Ceredigion"),
        Place("Tregaron", GeoPosition(52.2214, -3.9349), "Ceredigion"),
        Place("Rhayader", GeoPosition(52.3021, -3.5079), "Powys"),
        Place("Llanidloes", GeoPosition(52.4488, -3.5390), "Powys"),
        Place("Machynlleth", GeoPosition(52.5910, -3.8510), "Powys"),
        Place("Cadair Idris", GeoPosition(52.6994, -3.9086), "Eryri"),
        Place("Yr Wyddfa (Snowdon)", GeoPosition(53.0685, -4.0763), "Eryri"),
        Place("Llanberis", GeoPosition(53.1190, -4.1290), "Eryri"),
        Place("Betws-y-Coed", GeoPosition(53.0921, -3.8025), "Eryri"),
        Place("Pen y Fan", GeoPosition(51.8839, -3.4367), "Bannau Brycheiniog"),
        Place("Brecon", GeoPosition(51.9475, -3.3910), "Powys"),
        Place("Carmarthen", GeoPosition(51.8557, -4.3096), "Carmarthenshire"),
    )

    /**
     * Case-insensitive substring search over the gazetteer, at most [limit] hits.
     */
    fun search(query: String, limit: Int = 6): List<Place> {
        val needle = query.trim().lowercase()
        if (needle.isEmpty()) return emptyList()
        return gazetteer.filter { it.name.lowercase().contains(needle) || it.region.lowercase().contains(needle) }.take(limit)
    }

    /**
     * Cells, observations and weather for [request], as the server would return them.
     */
    fun bundle(request: SearchWindowRequest): SearchDataBundle {
        val lastSeen = TimeFormat.parse(request.lastSeenUtc)
        val now = TimeFormat.parse(request.nowUtc)
        val random = Random(seedOf(request.rescueId))
        val observations = ArrayList<Observation>()
        observations.addAll(satelliteScenes(request, lastSeen, now, random))
        observations.addAll(uavFlights(request, lastSeen, now, random))
        observations.addAll(dashcamPasses(request, lastSeen, now, random))
        return SearchDataBundle(
            cells = hexGrid.cover(request.pin, request.radiusM),
            observations = observations,
            weather = weather(request.pin, now, random),
            cellSource = "hexgrid-offline",
        )
    }

    /**
     * Number of detector candidates the demo reports once a job "finishes".
     */
    fun detectionOutcome(observationId: String): Int = abs(observationId.hashCode()) % 4

    /**
     * Example cases so the Ongoing / Completed lists are populated on first launch.
     */
    fun sampleRescues(now: Instant): List<Rescue> = listOf(
        Rescue(
            id = "demo-pumlumon",
            status = RescueStatus.ONGOING,
            createdAtUtc = TimeFormat.format(now.minus(Duration.ofHours(5))),
            lastKnownLocation = GeoPosition(52.4675, -3.7823),
            locationLabel = "Pumlumon Fawr summit path",
            travelMode = TravelMode.ON_FOOT,
            lastSeenUtc = TimeFormat.format(now.minus(Duration.ofHours(7))),
            timeZone = "UTC",
            subject = SubjectProfile(name = "Overdue walker", age = 34, fitness = Fitness.HIGH, experience = Experience.INTERMEDIATE, clothing = "Red shell jacket"),
        ),
        Rescue(
            id = "demo-elan",
            status = RescueStatus.ONGOING,
            createdAtUtc = TimeFormat.format(now.minus(Duration.ofHours(20))),
            lastKnownLocation = GeoPosition(52.2710, -3.5820),
            locationLabel = "Elan Valley visitor centre car park",
            travelMode = TravelMode.VEHICLE,
            lastSeenUtc = TimeFormat.format(now.minus(Duration.ofHours(26))),
            timeZone = "UTC",
            subject = SubjectProfile(name = "Vehicle not returned", age = 68, fitness = Fitness.LOW, experience = Experience.NOVICE, clothing = "Silver estate car"),
        ),
        Rescue(
            id = "demo-cadair",
            status = RescueStatus.COMPLETED,
            createdAtUtc = TimeFormat.format(now.minus(Duration.ofDays(3))),
            lastKnownLocation = GeoPosition(52.6994, -3.9086),
            locationLabel = "Cadair Idris, Minffordd path",
            travelMode = TravelMode.ON_FOOT,
            lastSeenUtc = TimeFormat.format(now.minus(Duration.ofDays(3).plusHours(4))),
            timeZone = "UTC",
            subject = SubjectProfile(name = "Fell runner", age = 29, fitness = Fitness.HIGH, experience = Experience.EXPERT, notes = "Located by UAV thermal sweep"),
        ),
    )

    private fun satelliteScenes(request: SearchWindowRequest, lastSeen: Instant, now: Instant, random: Random): List<Observation> {
        val scenes = ArrayList<Observation>()
        val phase = random.nextInt(3)
        val days = daysBetween(lastSeen, now)
        for (day in days) {
            if (scenes.size >= MAX_OBSERVATIONS_PER_SOURCE) break
            val ordinal = day.toEpochDay()
            if ((ordinal + phase) % 3 == 0L) {
                val at = day.atTime(LocalTime.of(11, 11)).toInstant(ZoneOffset.UTC)
                if (inWindow(at, lastSeen, now)) scenes.add(sentinel2(request, at, random))
            }
            if ((ordinal + phase) % 6 == 1L) {
                val at = day.atTime(LocalTime.of(6, 24)).toInstant(ZoneOffset.UTC)
                if (inWindow(at, lastSeen, now)) scenes.add(sentinel1(request, at))
            }
            val planetAt = day.atTime(LocalTime.of(10, 32)).toInstant(ZoneOffset.UTC)
            if (inWindow(planetAt, lastSeen, now)) scenes.add(planetScope(request, planetAt, random))
        }
        return scenes
    }

    private fun sentinel2(request: SearchWindowRequest, at: Instant, random: Random): Observation {
        val cloud = 10.0 + random.nextInt(86)
        val usable = cloud < 60.0
        return Observation(
            id = "s2-" + at.epochSecond,
            source = DataSourceKind.SATELLITE,
            platformId = if (random.nextBoolean()) "Sentinel-2A" else "Sentinel-2B",
            observedAtUtc = TimeFormat.format(at),
            distanceFromPinM = 0.0,
            footprint = Geo.circle(request.pin, 50_000.0, 4),
            cloudCoverPct = cloud,
            zarrUri = "s3://cdse-demo/sentinel-2/T30UVD/" + at.epochSecond + ".zarr",
            frameIndex = null,
            note = if (usable) "10 m optical; vehicle-scale change detection" else "Cloud cover too high for optical use",
        )
    }

    private fun sentinel1(request: SearchWindowRequest, at: Instant): Observation = Observation(
        id = "s1-" + at.epochSecond,
        source = DataSourceKind.SATELLITE,
        platformId = "Sentinel-1A",
        observedAtUtc = TimeFormat.format(at),
        distanceFromPinM = 0.0,
        footprint = Geo.circle(request.pin, 90_000.0, 4),
        cloudCoverPct = null,
        zarrUri = "s3://cdse-demo/sentinel-1/IW_GRDH/" + at.epochSecond + ".zarr",
        note = "C-band SAR, all-weather; bright targets such as vehicles only",
    )

    private fun planetScope(request: SearchWindowRequest, at: Instant, random: Random): Observation {
        val cloud = 5.0 + random.nextInt(90)
        return Observation(
            id = "ps-" + at.epochSecond,
            source = DataSourceKind.SATELLITE,
            platformId = "PlanetScope",
            observedAtUtc = TimeFormat.format(at),
            distanceFromPinM = 0.0,
            footprint = Geo.circle(request.pin, 12_000.0, 4),
            cloudCoverPct = cloud,
            zarrUri = "s3://planet-demo/psscene/" + at.epochSecond + ".zarr",
            note = if (cloud < 50.0) "3 m optical; tasking of higher resolution possible" else "Mostly cloud; request re-task",
        )
    }

    private fun uavFlights(request: SearchWindowRequest, lastSeen: Instant, now: Instant, random: Random): List<Observation> {
        val flights = ArrayList<Observation>()
        val days = daysBetween(lastSeen, now)
        val phase = random.nextInt(2)
        for (day in days) {
            if (flights.size >= MAX_OBSERVATIONS_PER_SOURCE) break
            if ((day.toEpochDay() + phase) % 2 != 0L) continue
            val at = day.atTime(LocalTime.of(13, 0)).toInstant(ZoneOffset.UTC)
            if (!inWindow(at, lastSeen, now)) continue
            val bearing = random.nextDouble(0.0, 360.0)
            val offset = random.nextDouble(0.2, 0.7) * request.radiusM
            val strip = Geo.destination(request.pin, bearing, offset)
            val heading = random.nextDouble(0.0, 180.0)
            val secondsIntoFlight = random.nextInt(60, 1_100)
            flights.add(
                Observation(
                    id = "uav-" + at.epochSecond,
                    source = DataSourceKind.UAV,
                    platformId = "UAV-LITTER-SURVEY-03",
                    observedAtUtc = TimeFormat.format(at.plusSeconds(secondsIntoFlight.toLong())),
                    distanceFromPinM = offset,
                    footprint = stripFootprint(strip, heading, 800.0, 200.0),
                    zarrUri = "gs://srportal-demo/uav/UAV-LITTER-SURVEY-03_" + day + "T1300.zarr",
                    frameIndex = secondsIntoFlight * 30L,
                    note = "Routine 120 m AGL survey strip; 2 cm GSD",
                )
            )
        }
        return flights
    }

    private fun dashcamPasses(request: SearchWindowRequest, lastSeen: Instant, now: Instant, random: Random): List<Observation> {
        val passes = ArrayList<Observation>()
        val roadBearing = random.nextDouble(0.0, 360.0)
        val roadOffset = random.nextDouble(0.3, 0.9) * request.radiusM
        val roadPoint = Geo.destination(request.pin, roadBearing, roadOffset)
        val days = daysBetween(lastSeen, now)
        for (day in days) {
            for ((vehicle, time) in DASHCAM_SCHEDULE) {
                if (passes.size >= MAX_OBSERVATIONS_PER_SOURCE) return passes
                val at = day.atTime(time).toInstant(ZoneOffset.UTC)
                if (!inWindow(at, lastSeen, now)) continue
                val alongRoad = random.nextDouble(-600.0, 600.0)
                val passPoint = Geo.destination(roadPoint, roadBearing + 90.0, alongRoad)
                val secondsIntoClip = random.nextInt(5, 290)
                val stamp = day.toString().replace("-", "") + "_" + "%02d%02d00".format(time.hour, time.minute)
                passes.add(
                    Observation(
                        id = "dash-" + vehicle + "-" + at.epochSecond,
                        source = DataSourceKind.DASHCAM,
                        platformId = vehicle,
                        observedAtUtc = TimeFormat.format(at.plusSeconds(secondsIntoClip.toLong())),
                        distanceFromPinM = Geo.distanceM(request.pin, passPoint),
                        footprint = wedgeFootprint(passPoint, roadBearing + 90.0, 120.0, 70.0),
                        zarrUri = "gs://srportal-demo/dashcam/" + vehicle + "_" + stamp + "_CAM01.zarr",
                        frameIndex = secondsIntoClip * 30L,
                        note = "Forward camera; GPX-tagged frame manifest",
                    )
                )
            }
        }
        return passes
    }

    private fun weather(pin: GeoPosition, now: Instant, random: Random): WeatherSnapshot {
        val wind = random.nextDouble(4.0, 13.0)
        return WeatherSnapshot(
            windMs = round1(wind),
            gustMs = round1(wind + random.nextDouble(2.0, 6.0)),
            precipitationMmH = round1(random.nextDouble(0.0, 3.2)),
            visibilityM = (800 + random.nextInt(8_200)).toDouble(),
            temperatureC = round1(random.nextDouble(3.0, 14.0)),
            cloudCoverPct = (35 + random.nextInt(61)).toDouble(),
            daylight = SolarCalculator.isDaylight(pin, now),
            source = "demo",
        )
    }

    private fun stripFootprint(centre: GeoPosition, headingDeg: Double, lengthM: Double, widthM: Double): List<GeoPosition> {
        val half = lengthM / 2.0
        val a = Geo.destination(centre, headingDeg, half)
        val b = Geo.destination(centre, headingDeg + 180.0, half)
        return listOf(
            Geo.destination(a, headingDeg + 90.0, widthM / 2.0),
            Geo.destination(b, headingDeg + 90.0, widthM / 2.0),
            Geo.destination(b, headingDeg - 90.0, widthM / 2.0),
            Geo.destination(a, headingDeg - 90.0, widthM / 2.0),
        )
    }

    private fun wedgeFootprint(apex: GeoPosition, headingDeg: Double, rangeM: Double, fovDeg: Double): List<GeoPosition> = listOf(
        apex,
        Geo.destination(apex, headingDeg - fovDeg / 2.0, rangeM),
        Geo.destination(apex, headingDeg, rangeM * 1.1),
        Geo.destination(apex, headingDeg + fovDeg / 2.0, rangeM),
    )

    private fun daysBetween(lastSeen: Instant, now: Instant): List<LocalDate> {
        val first = lastSeen.atOffset(ZoneOffset.UTC).toLocalDate()
        val last = now.atOffset(ZoneOffset.UTC).toLocalDate()
        val days = ArrayList<LocalDate>()
        var day = first
        var guard = 0
        while (!day.isAfter(last) && guard < MAX_DAYS) {
            days.add(day)
            day = day.plusDays(1)
            guard += 1
        }
        return days
    }

    private fun inWindow(at: Instant, lastSeen: Instant, now: Instant): Boolean = !at.isBefore(lastSeen) && !at.isAfter(now)

    private fun seedOf(text: String): Int = text.hashCode()

    private fun round1(value: Double): Double = Math.round(value * 10.0) / 10.0

    private companion object {
        const val MAX_DAYS: Int = 60
        const val MAX_OBSERVATIONS_PER_SOURCE: Int = 40
        val DASHCAM_SCHEDULE: List<Pair<String, LocalTime>> = listOf(
            "CAR01" to LocalTime.of(8, 30),
            "CAR02" to LocalTime.of(12, 0),
            "CAR01" to LocalTime.of(17, 15),
            "CAR03" to LocalTime.of(19, 40),
        )
    }
}
