package com.abertech.srportal.core

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Tunable constants for the planning heuristics.
 *
 * Every value here is a placeholder chosen to be plausible for upland Wales. They are meant
 * to be replaced by figures agreed with rescue teams (ISRID-style lost-person statistics,
 * measured sweep widths, real UAV operating limits). The app loads overrides from
 * `assets/sar_config.json`, the server from `config.yaml`, so the numbers never live in code.
 */
@Serializable
data class SarConfig(
    @SerialName("on_foot") val onFoot: FootModelParams = FootModelParams(),
    val vehicle: VehicleModelParams = VehicleModelParams(),
    val scoring: ScoringParams = ScoringParams(),
    val equipment: EquipmentLimits = EquipmentLimits(),
    val team: TeamParams = TeamParams(),
    @SerialName("hex_grid") val hexGrid: HexGridParams = HexGridParams(),
)

/**
 * Displacement model for someone on foot.
 *
 * The median distance saturates: `d50 = saturation * (1 - exp(-hours / timeConstant))`, scaled
 * by the subject profile, because lost people slow down and stop rather than walk forever.
 * The saturation value and the ring multipliers are the knobs to fit to ISRID-style data.
 */
@Serializable
data class FootModelParams(
    @SerialName("d50_saturation_m") val d50SaturationM: Double = 3_000.0,
    @SerialName("time_constant_hours") val timeConstantHours: Double = 6.0,
    @SerialName("min_radius_m") val minRadiusM: Double = 300.0,
    @SerialName("max_radius_m") val maxRadiusM: Double = 25_000.0,
    @SerialName("p75_multiplier") val p75Multiplier: Double = 1.8,
    @SerialName("p95_multiplier") val p95Multiplier: Double = 4.0,
    @SerialName("fitness_low") val fitnessLow: Double = 0.7,
    @SerialName("fitness_high") val fitnessHigh: Double = 1.3,
    @SerialName("experience_novice") val experienceNovice: Double = 0.9,
    @SerialName("experience_expert") val experienceExpert: Double = 1.15,
    @SerialName("child_age_limit") val childAgeLimit: Int = 12,
    @SerialName("elderly_age_limit") val elderlyAgeLimit: Int = 70,
    @SerialName("age_factor") val ageFactor: Double = 0.6,
)

/**
 * Displacement model for a vehicle: linear travel that plateaus once the vehicle stops.
 */
@Serializable
data class VehicleModelParams(
    @SerialName("effective_speed_m_per_h") val effectiveSpeedMPerH: Double = 15_000.0,
    @SerialName("min_radius_m") val minRadiusM: Double = 1_000.0,
    @SerialName("max_radius_m") val maxRadiusM: Double = 40_000.0,
    @SerialName("p50_fraction") val p50Fraction: Double = 0.5,
    @SerialName("p95_multiplier") val p95Multiplier: Double = 1.25,
    @SerialName("unknown_foot_multiplier") val unknownFootMultiplier: Double = 1.5,
    @SerialName("unknown_vehicle_multiplier") val unknownVehicleMultiplier: Double = 0.5,
)

/**
 * Probability-of-area scoring: gaussian distance decay with terrain weights.
 *
 * With a 2-D gaussian the 50 percent contour sits at 1.177 sigma, so sigma is 0.85 times the
 * 50 percent ring radius; that keeps the cell scores consistent with the rings drawn on the map.
 */
@Serializable
data class ScoringParams(
    @SerialName("sigma_over_p50") val sigmaOverP50: Double = 0.85,
    @SerialName("max_regions") val maxRegions: Int = 12,
    @SerialName("terrain_weights") val terrainWeights: Map<Terrain, Double> = mapOf(
        Terrain.OPEN_MOORLAND to 1.0,
        Terrain.FOREST to 1.1,
        Terrain.MOUNTAIN to 0.9,
        Terrain.FARMLAND to 0.8,
        Terrain.URBAN to 0.5,
        Terrain.WATER to 0.2,
        Terrain.UNKNOWN to 1.0,
    ),
    @SerialName("vehicle_terrain_weights") val vehicleTerrainWeights: Map<Terrain, Double> = mapOf(
        Terrain.OPEN_MOORLAND to 0.6,
        Terrain.FOREST to 0.5,
        Terrain.MOUNTAIN to 0.3,
        Terrain.FARMLAND to 1.0,
        Terrain.URBAN to 1.2,
        Terrain.WATER to 0.05,
        Terrain.UNKNOWN to 0.8,
    ),
)

/**
 * Operating limits used to decide whether equipment is viable in the current weather.
 */
@Serializable
data class EquipmentLimits(
    @SerialName("uav_max_wind_ms") val uavMaxWindMs: Double = 10.0,
    @SerialName("uav_max_gust_ms") val uavMaxGustMs: Double = 14.0,
    @SerialName("uav_max_precip_mm_h") val uavMaxPrecipMmH: Double = 2.5,
    @SerialName("uav_min_visibility_m") val uavMinVisibilityM: Double = 1_000.0,
    @SerialName("uav_min_temp_c") val uavMinTempC: Double = -10.0,
    @SerialName("dog_max_wind_ms") val dogMaxWindMs: Double = 15.0,
    @SerialName("dog_max_precip_mm_h") val dogMaxPrecipMmH: Double = 5.0,
    @SerialName("dog_max_elapsed_hours") val dogMaxElapsedHours: Double = 36.0,
    @SerialName("heli_max_wind_ms") val heliMaxWindMs: Double = 20.0,
    @SerialName("heli_min_visibility_m") val heliMinVisibilityM: Double = 5_000.0,
    @SerialName("heli_max_cloud_pct") val heliMaxCloudPct: Double = 85.0,
    @SerialName("ground_hazard_wind_ms") val groundHazardWindMs: Double = 20.0,
    @SerialName("ground_hazard_visibility_m") val groundHazardVisibilityM: Double = 200.0,
)

/**
 * Sweep-rate heuristics that turn the priority cells into a first-period party size.
 *
 * Sweep rates are hasty-search figures (searchers spaced for a visible person, not a
 * fingertip grid); the first period covers the top [priorityCells] cells or the cells holding
 * [coverageTargetProbability], whichever comes first.
 */
@Serializable
data class TeamParams(
    @SerialName("target_hours") val targetHours: Double = 4.0,
    @SerialName("priority_cells") val priorityCells: Int = 6,
    @SerialName("coverage_target_probability") val coverageTargetProbability: Double = 0.75,
    @SerialName("team_size") val teamSize: Int = 6,
    @SerialName("min_searchers") val minSearchers: Int = 4,
    @SerialName("max_searchers") val maxSearchers: Int = 120,
    @SerialName("uav_area_share") val uavAreaShare: Double = 0.35,
    @SerialName("coverage_km2_per_searcher_hour") val coverageKm2PerSearcherHour: Map<Terrain, Double> = mapOf(
        Terrain.OPEN_MOORLAND to 0.20,
        Terrain.FOREST to 0.05,
        Terrain.MOUNTAIN to 0.10,
        Terrain.FARMLAND to 0.25,
        Terrain.URBAN to 0.30,
        Terrain.WATER to 0.02,
        Terrain.UNKNOWN to 0.12,
    ),
)

/**
 * Offline hex tiling used when the server (and therefore real H3 cells) is unreachable.
 *
 * The cell radius is the search radius divided by [cellsAcrossRadius], raised when needed so
 * the tiling never exceeds [maxCells] cells.
 */
@Serializable
data class HexGridParams(
    @SerialName("cells_across_radius") val cellsAcrossRadius: Int = 10,
    @SerialName("min_cell_radius_m") val minCellRadiusM: Double = 150.0,
    @SerialName("max_cells") val maxCells: Int = 400,
)
