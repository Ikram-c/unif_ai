package com.abertech.srportal.core

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * A WGS-84 position in decimal degrees.
 */
@Serializable
data class GeoPosition(val lat: Double, val lon: Double)

/**
 * How the missing person was believed to be moving when last seen.
 */
@Serializable
enum class TravelMode { ON_FOOT, VEHICLE, UNKNOWN }

/**
 * Lifecycle state of a rescue case.
 */
@Serializable
enum class RescueStatus { DRAFT, ONGOING, COMPLETED }

/**
 * Coarse physical fitness of the missing person, used as a speed weight.
 */
@Serializable
enum class Fitness { LOW, MEDIUM, HIGH }

/**
 * Outdoor experience of the missing person, used as a displacement weight.
 */
@Serializable
enum class Experience { NOVICE, INTERMEDIATE, EXPERT }

/**
 * Qualitative confidence attached to a model output.
 */
@Serializable
enum class Confidence { LOW, MEDIUM, HIGH }

/**
 * Characteristics of the missing person captured through "Add Additional User info".
 *
 * These are the weights the future causal / A* model will consume; today they scale
 * the wander-radius model only.
 */
@Serializable
data class SubjectProfile(
    val name: String = "",
    val age: Int? = null,
    val fitness: Fitness = Fitness.MEDIUM,
    val experience: Experience = Experience.INTERMEDIATE,
    val clothing: String = "",
    val notes: String = "",
)

/**
 * A rescue case as stored on the device and on the cloud server.
 *
 * Timestamps are ISO-8601 instants in UTC (for example `2026-09-25T10:15:00Z`).
 */
@Serializable
data class Rescue(
    val id: String,
    val status: RescueStatus,
    @SerialName("created_at_utc") val createdAtUtc: String,
    @SerialName("last_known_location") val lastKnownLocation: GeoPosition,
    @SerialName("location_label") val locationLabel: String = "",
    @SerialName("travel_mode") val travelMode: TravelMode,
    @SerialName("last_seen_utc") val lastSeenUtc: String,
    @SerialName("time_zone") val timeZone: String = "UTC",
    val subject: SubjectProfile = SubjectProfile(),
    val plan: SearchPlan? = null,
)

/**
 * The time window between the last confirmed sighting and the moment the model ran.
 */
@Serializable
data class SearchWindow(
    @SerialName("last_seen_utc") val lastSeenUtc: String,
    @SerialName("now_utc") val nowUtc: String,
    @SerialName("elapsed_minutes") val elapsedMinutes: Long,
)

/**
 * A probability contour around the pin: the person is inside [radiusM] with [probability].
 */
@Serializable
data class RadiusRing(val probability: Double, @SerialName("radius_m") val radiusM: Double)

/**
 * Dominant land cover of a search cell.
 */
@Serializable
enum class Terrain { OPEN_MOORLAND, FOREST, MOUNTAIN, FARMLAND, URBAN, WATER, UNKNOWN }

/**
 * One hexagonal search cell; an H3 cell when produced by the server, a local hex tile offline.
 */
@Serializable
data class SearchCell(
    @SerialName("cell_id") val cellId: String,
    val centre: GeoPosition,
    val boundary: List<GeoPosition>,
    val terrain: Terrain = Terrain.UNKNOWN,
    @SerialName("area_km2") val areaKm2: Double,
)

/**
 * A search cell ranked by probability of area.
 */
@Serializable
data class SearchRegion(
    val cell: SearchCell,
    val rank: Int,
    val score: Double,
    @SerialName("cumulative_probability") val cumulativeProbability: Double,
    val sector: String,
    @SerialName("distance_m") val distanceM: Double,
)

/**
 * Probability mass and area of one compass sector around the pin, for tasking teams.
 */
@Serializable
data class SectorSummary(
    val sector: String,
    val probability: Double,
    @SerialName("area_km2") val areaKm2: Double,
    @SerialName("dominant_terrain") val dominantTerrain: Terrain,
    @SerialName("cell_count") val cellCount: Int,
)

/**
 * The remote-sensing sources whose metadata is indexed in the cloud database.
 */
@Serializable
enum class DataSourceKind { SATELLITE, UAV, DASHCAM }

/**
 * Progress of the small-object detector job for one observation.
 */
@Serializable
enum class DetectionStatus { NOT_RUN, QUEUED, RUNNING, DONE }

/**
 * One piece of imagery whose footprint and timestamp fall inside the search window.
 *
 * For video sources [zarrUri] plus [frameIndex] address the exact chunk of the OME-Zarr
 * store that the detector needs to open, which is what keeps the lookup cheap.
 */
@Serializable
data class Observation(
    val id: String,
    val source: DataSourceKind,
    @SerialName("platform_id") val platformId: String,
    @SerialName("observed_at_utc") val observedAtUtc: String,
    @SerialName("distance_from_pin_m") val distanceFromPinM: Double,
    val footprint: List<GeoPosition> = emptyList(),
    @SerialName("cloud_cover_pct") val cloudCoverPct: Double? = null,
    @SerialName("zarr_uri") val zarrUri: String? = null,
    @SerialName("frame_index") val frameIndex: Long? = null,
    @SerialName("detection_status") val detectionStatus: DetectionStatus = DetectionStatus.NOT_RUN,
    @SerialName("candidate_count") val candidateCount: Int = 0,
    val note: String = "",
)

/**
 * Whether a source has any usable observation in the window, and which ones.
 */
@Serializable
data class DataSourceAvailability(
    val source: DataSourceKind,
    val available: Boolean,
    val observations: List<Observation>,
)

/**
 * Weather at the pin, used to decide equipment viability.
 */
@Serializable
data class WeatherSnapshot(
    @SerialName("wind_ms") val windMs: Double,
    @SerialName("gust_ms") val gustMs: Double,
    @SerialName("precipitation_mm_h") val precipitationMmH: Double,
    @SerialName("visibility_m") val visibilityM: Double,
    @SerialName("temperature_c") val temperatureC: Double,
    @SerialName("cloud_cover_pct") val cloudCoverPct: Double,
    val daylight: Boolean,
    val source: String,
)

/**
 * Search assets a team could deploy.
 */
@Serializable
enum class EquipmentKind { UAV_VISUAL, UAV_THERMAL, GROUND_TEAM, VEHICLE_PATROL, DOG_TEAM, HELICOPTER }

/**
 * Go / no-go verdict for one kind of equipment with a one-line justification.
 */
@Serializable
data class EquipmentAssessment(val kind: EquipmentKind, val viable: Boolean, val reason: String)

/**
 * Recommended search-party size for the first operational period.
 */
@Serializable
data class TeamEstimate(
    val searchers: Int,
    val teams: Int,
    @SerialName("search_area_km2") val searchAreaKm2: Double,
    @SerialName("target_hours") val targetHours: Double,
    val confidence: Confidence,
    val rationale: String,
)

/**
 * Everything the "Begin AI Model" step produces for a rescue.
 */
@Serializable
data class SearchPlan(
    @SerialName("generated_at_utc") val generatedAtUtc: String,
    val window: SearchWindow,
    val rings: List<RadiusRing>,
    val regions: List<SearchRegion>,
    val sectors: List<SectorSummary>,
    @SerialName("data_sources") val dataSources: List<DataSourceAvailability>,
    val weather: WeatherSnapshot,
    val equipment: List<EquipmentAssessment>,
    val team: TeamEstimate,
    val confidence: Confidence,
    @SerialName("cell_source") val cellSource: String,
)

/**
 * Request body for the server's search-window query.
 */
@Serializable
data class SearchWindowRequest(
    @SerialName("rescue_id") val rescueId: String,
    val pin: GeoPosition,
    @SerialName("last_seen_utc") val lastSeenUtc: String,
    @SerialName("now_utc") val nowUtc: String,
    @SerialName("travel_mode") val travelMode: TravelMode,
    @SerialName("radius_m") val radiusM: Double,
)

/**
 * The raw inputs the planner needs: cells to score, observations in the window, weather.
 */
@Serializable
data class SearchDataBundle(
    val cells: List<SearchCell>,
    val observations: List<Observation>,
    val weather: WeatherSnapshot,
    @SerialName("cell_source") val cellSource: String,
)

/**
 * A named place returned by the map search.
 */
@Serializable
data class Place(val name: String, val position: GeoPosition, val region: String = "")

/**
 * Response of the server's health endpoint.
 */
@Serializable
data class ServerHealth(
    val status: String,
    val version: String = "",
    @SerialName("db_rows") val dbRows: Map<String, Int> = emptyMap(),
)
