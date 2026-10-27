import { Terrain } from '../types';

export interface FootModelParams {
  d50SaturationM: number;
  timeConstantHours: number;
  minRadiusM: number;
  maxRadiusM: number;
  p75Multiplier: number;
  p95Multiplier: number;
  fitnessLow: number;
  fitnessHigh: number;
  experienceNovice: number;
  experienceExpert: number;
  childAgeLimit: number;
  elderlyAgeLimit: number;
  ageFactor: number;
}

export interface VehicleModelParams {
  effectiveSpeedMPerH: number;
  minRadiusM: number;
  maxRadiusM: number;
  p50Fraction: number;
  p95Multiplier: number;
  unknownFootMultiplier: number;
  unknownVehicleMultiplier: number;
}

export interface ScoringParams {
  sigmaOverP50: number;
  maxRegions: number;
  terrainWeights: Record<Terrain, number>;
  vehicleTerrainWeights: Record<Terrain, number>;
}

export interface EquipmentLimits {
  uavMaxWindMs: number;
  uavMaxGustMs: number;
  uavMaxPrecipMmH: number;
  uavMinVisibilityM: number;
  uavMinTempC: number;
  dogMaxWindMs: number;
  dogMaxPrecipMmH: number;
  dogMaxElapsedHours: number;
  heliMaxWindMs: number;
  heliMinVisibilityM: number;
  heliMaxCloudPct: number;
  groundHazardWindMs: number;
  groundHazardVisibilityM: number;
}

export interface TeamParams {
  targetHours: number;
  priorityCells: number;
  coverageTargetProbability: number;
  teamSize: number;
  minSearchers: number;
  maxSearchers: number;
  uavAreaShare: number;
  coverageKm2PerSearcherHour: Record<Terrain, number>;
}

export interface HexGridParams {
  cellsAcrossRadius: number;
  minCellRadiusM: number;
  maxCells: number;
}

export interface SarConfig {
  onFoot: FootModelParams;
  vehicle: VehicleModelParams;
  scoring: ScoringParams;
  equipment: EquipmentLimits;
  team: TeamParams;
  hexGrid: HexGridParams;
}

export const defaultSarConfig: SarConfig = {
  onFoot: {
    d50SaturationM: 3000.0,
    timeConstantHours: 6.0,
    minRadiusM: 300.0,
    maxRadiusM: 25000.0,
    p75Multiplier: 1.8,
    p95Multiplier: 4.0,
    fitnessLow: 0.7,
    fitnessHigh: 1.3,
    experienceNovice: 0.9,
    experienceExpert: 1.15,
    childAgeLimit: 12,
    elderlyAgeLimit: 70,
    ageFactor: 0.6,
  },
  vehicle: {
    effectiveSpeedMPerH: 15000.0,
    minRadiusM: 1000.0,
    maxRadiusM: 40000.0,
    p50Fraction: 0.5,
    p95Multiplier: 1.25,
    unknownFootMultiplier: 1.5,
    unknownVehicleMultiplier: 0.5,
  },
  scoring: {
    sigmaOverP50: 0.85,
    maxRegions: 12,
    terrainWeights: {
      OPEN_MOORLAND: 1.0,
      FOREST: 1.1,
      MOUNTAIN: 0.9,
      FARMLAND: 0.8,
      URBAN: 0.5,
      WATER: 0.2,
      UNKNOWN: 1.0,
    },
    vehicleTerrainWeights: {
      OPEN_MOORLAND: 0.6,
      FOREST: 0.5,
      MOUNTAIN: 0.3,
      FARMLAND: 1.0,
      URBAN: 1.2,
      WATER: 0.05,
      UNKNOWN: 0.8,
    },
  },
  equipment: {
    uavMaxWindMs: 10.0,
    uavMaxGustMs: 14.0,
    uavMaxPrecipMmH: 2.5,
    uavMinVisibilityM: 1000.0,
    uavMinTempC: -10.0,
    dogMaxWindMs: 15.0,
    dogMaxPrecipMmH: 5.0,
    dogMaxElapsedHours: 36.0,
    heliMaxWindMs: 20.0,
    heliMinVisibilityM: 5000.0,
    heliMaxCloudPct: 85.0,
    groundHazardWindMs: 20.0,
    groundHazardVisibilityM: 200.0,
  },
  team: {
    targetHours: 4.0,
    priorityCells: 6,
    coverageTargetProbability: 0.75,
    teamSize: 6,
    minSearchers: 4,
    maxSearchers: 120,
    uavAreaShare: 0.35,
    coverageKm2PerSearcherHour: {
      OPEN_MOORLAND: 0.2,
      FOREST: 0.05,
      MOUNTAIN: 0.1,
      FARMLAND: 0.25,
      URBAN: 0.3,
      WATER: 0.02,
      UNKNOWN: 0.12,
    },
  },
  hexGrid: {
    cellsAcrossRadius: 10,
    minCellRadiusM: 150.0,
    maxCells: 400,
  },
};
