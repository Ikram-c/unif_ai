export interface GeoPosition {
  lat: number;
  lon: number;
}

export type TravelMode = 'ON_FOOT' | 'VEHICLE' | 'UNKNOWN';

export type RescueStatus = 'DRAFT' | 'ONGOING' | 'COMPLETED';

export type Fitness = 'LOW' | 'MEDIUM' | 'HIGH';

export type Experience = 'NOVICE' | 'INTERMEDIATE' | 'EXPERT';

export type Confidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface SubjectProfile {
  name: string;
  age?: number | null;
  fitness: Fitness;
  experience: Experience;
  clothing: string;
  notes: string;
}

export interface SearchWindow {
  last_seen_utc: string;
  now_utc: string;
  elapsed_minutes: number;
}

export interface RadiusRing {
  probability: number;
  radius_m: number;
}

export type Terrain = 'OPEN_MOORLAND' | 'FOREST' | 'MOUNTAIN' | 'FARMLAND' | 'URBAN' | 'WATER' | 'UNKNOWN';

export interface SearchCell {
  cell_id: string;
  centre: GeoPosition;
  boundary: GeoPosition[];
  terrain: Terrain;
  area_km2: number;
}

export interface SearchRegion {
  cell: SearchCell;
  rank: number;
  score: number;
  cumulative_probability: number;
  sector: string;
  distance_m: number;
}

export interface SectorSummary {
  sector: string;
  probability: number;
  area_km2: number;
  dominant_terrain: Terrain;
  cell_count: number;
}

export type DataSourceKind = 'SATELLITE' | 'UAV' | 'DASHCAM';

export type DetectionStatus = 'NOT_RUN' | 'QUEUED' | 'RUNNING' | 'DONE';

export interface Observation {
  id: string;
  source: DataSourceKind;
  platform_id: string;
  observed_at_utc: string;
  distance_from_pin_m: number;
  footprint: GeoPosition[];
  cloud_cover_pct?: number | null;
  zarr_uri?: string | null;
  frame_index?: number | null;
  detection_status: DetectionStatus;
  candidate_count: number;
  note: string;
}

export interface DataSourceAvailability {
  source: DataSourceKind;
  available: boolean;
  observations: Observation[];
}

export interface WeatherSnapshot {
  wind_ms: number;
  gust_ms: number;
  precipitation_mm_h: number;
  visibility_m: number;
  temperature_c: number;
  cloud_cover_pct: number;
  daylight: boolean;
  source: string;
}

export type EquipmentKind = 'UAV_VISUAL' | 'UAV_THERMAL' | 'GROUND_TEAM' | 'VEHICLE_PATROL' | 'DOG_TEAM' | 'HELICOPTER';

export interface EquipmentAssessment {
  kind: EquipmentKind;
  viable: boolean;
  reason: string;
  statusLabel?: 'Ready' | 'Conditional' | 'Blocked';
}

export interface TeamEstimate {
  searchers: number;
  teams: number;
  search_area_km2: number;
  target_hours: number;
  confidence: Confidence;
  rationale: string;
}

export interface SearchPlan {
  generated_at_utc: string;
  window: SearchWindow;
  rings: RadiusRing[];
  regions: SearchRegion[];
  sectors: SectorSummary[];
  data_sources: DataSourceAvailability[];
  weather: WeatherSnapshot;
  equipment: EquipmentAssessment[];
  team: TeamEstimate;
  confidence: Confidence;
  cell_source: string;
}

export interface TeamAllocation {
  id: string;
  name: string; // e.g. "Alpha", "Bravo"
  personnel: number;
  sector: string; // e.g. "Sector A · northern path", "Sector B · southern drainage"
  task: string; // e.g. "Northern path sweep", "Drainage search"
  status: 'Ready' | 'In progress' | 'Reconciled';
  radio_check: string; // e.g. "12:24 UTC (6m ago)"
}

export interface EvidenceCandidate {
  id: string; // e.g. "C-01"
  source: DataSourceKind; // "UAV"
  platform_id: string; // "UAV-01"
  frame_ref: string; // "F0184"
  captured_at_utc: string; // "2026-10-27T12:22:16Z"
  position: GeoPosition;
  distance_from_lkp_km: number;
  bearing_from_lkp: string;
  description: string;
  status: 'unverified' | 'marked_for_field_verification' | 'rejected';
  reviewer: string; // "C-01"
  assigned_team?: string;
  image_url?: string;
}

export interface AuditEvent {
  time_utc: string; // e.g. "09:30", "12:10"
  title: string;
  details: string;
  timestamp: string;
}

export interface MissionClosure {
  outcome: string; // e.g. "Search suspended · subject not located"
  notes: string;
  alpha_reconciled: boolean;
  bravo_reconciled: boolean;
  equipment_reconciled: boolean;
  closed_at_utc: string;
  closed_by: string; // "Commander C-01"
}

export interface Rescue {
  id: string;
  status: RescueStatus;
  created_at_utc: string;
  last_known_location: GeoPosition;
  location_label: string;
  travel_mode: TravelMode;
  last_seen_utc: string;
  time_zone: string;
  subject: SubjectProfile;
  plan?: SearchPlan | null;

  // AberTech Field Suite properties from untilted.pdf:
  mission_name: string; // e.g. "Bannau Brycheiniog"
  mission_reference: string; // e.g. "SAR-026"
  agency: string; // e.g. "Upland SAR · Example agency"
  commander_reference: string; // e.g. "C-01"
  subject_reference: string; // e.g. "Subject S-01"
  terrain_type: string; // e.g. "Moorland / upland paths"
  subject_context: string; // e.g. "S-01 · intended route unknown"
  reported_uncertainty_m: number; // e.g. 100
  assumptions_reviewed: boolean;
  radio_allocations_confirmed: boolean;
  allocated_teams: TeamAllocation[];
  evidence_candidates: EvidenceCandidate[];
  audit_events: AuditEvent[];
  closure: MissionClosure | null;
}

export interface SearchWindowRequest {
  rescue_id: string;
  pin: GeoPosition;
  last_seen_utc: string;
  now_utc: string;
  travel_mode: TravelMode;
  radius_m: number;
}

export interface SearchDataBundle {
  cells: SearchCell[];
  observations: Observation[];
  weather: WeatherSnapshot;
  cell_source: string;
}

export interface Place {
  name: string;
  position: GeoPosition;
  region: string;
}

export interface ServerHealth {
  status: string;
  version: string;
  db_rows: Record<string, number>;
}

export type ConnectionState = 'ONLINE' | 'DEMO' | 'CHECKING';

export interface ServerStatus {
  state: ConnectionState;
  detail: string;
}

export interface AppSettings {
  baseUrl: string;
  forceDemo: boolean;
  timeZone: string;
  retentionYears: number; // 3-year 2 CFR 200 default
  activeMapPack: string; // "Bannau map pack"
  deviceTag: string; // "ABER-04"
  darkMode: boolean; // Field appearance toggle
}

export type CausalityViabilityLevel = 'VIABLE' | 'DEGRADED' | 'RESTRICTED' | 'BLOCKED';
export type TerrainSlope = 'FLAT' | 'MODERATE' | 'STEEP' | 'CLIFF';
export type TerrainSubstrate = 'MOORLAND' | 'TRACK' | 'SCREE' | 'FOREST' | 'CRAG' | 'WATER';
export type TeamCallsign = 'Alpha' | 'Bravo' | 'UAV-01' | 'K9-Rex' | 'Tech-1' | 'Rescue-936';

export interface TeamTelematics {
  osGridRef: string;
  altitudeM: number;
  headingDeg: number;
  headingCardinal: string;
  radioRssiDb: number;
  heartRateBpm?: number;
  batteryVoltage?: number;
  gpsLockSats: number;
  driftDistanceM?: number;
  breachHazard?: string;
}

export interface TacticalTeam {
  id: string;
  name: string;
  callsign: TeamCallsign;
  type: 'FOOT_HASTY' | 'FOOT_GRID' | 'AIR_UAV' | 'K9_UNIT' | 'TECH_ROPE' | 'HELO';
  personnel: number;
  sector: string;
  assignedHexId?: string;
  status: 'Ready' | 'In progress' | 'Reconciled' | 'Holding' | 'Returning';
  radioChannel: string;
  endurancePct: number;
  batteryPct?: number;
  speedKmh: number;
  position: GeoPosition;
  breadcrumbs: GeoPosition[];
  carriedEquipment: string[];
  currentTask: string;
  lastCheckInUtc: string;
  isDrifted?: boolean;
  assignedSectorBoundaryLabel?: string;
  telematics?: TeamTelematics;
}

export interface CellTerrainInfo {
  elevation_m: number;
  slope_deg: number;
  slope_category: TerrainSlope;
  substrate: TerrainSubstrate;
  exposure_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  hazard_tags: string[];
}

export interface TeamViabilityAssessment {
  team_id: string;
  callsign: TeamCallsign;
  viable: boolean;
  status: CausalityViabilityLevel;
  speed_kmh: number;
  pod_pct: number; // Probability of detection 0-100
  reason: string;
}

export interface EquipmentViabilityAssessment {
  equipment: string;
  category: 'OPTICAL' | 'RIGGING' | 'RADIO' | 'EVACUATION' | 'SCENT';
  status: 'OPTIMAL' | 'USABLE' | 'DEGRADED' | 'PROHIBITED';
  reason: string;
}

export interface CellCausalityReport {
  cell_id: string;
  terrain: CellTerrainInfo;
  overall_score: number; // 0-100% viability
  viability: CausalityViabilityLevel;
  limiting_factors: string[];
  team_assessments: TeamViabilityAssessment[];
  equipment_assessments: EquipmentViabilityAssessment[];
  primary_recommendation: string;
}

export interface MapLayerToggles {
  hexGrid: boolean;
  viabilityHeatmap: boolean;
  sectors: boolean;
  wanderContours: boolean;
  teamPositions: boolean;
  teamTracks: boolean;
  uavFlightPath: boolean;
  terrainHazards: boolean;
}

export type WeatherScenarioKey = 'BASELINE' | 'SUMMIT_GALE' | 'CWM_FOG' | 'FREEZING_NIGHT';

export interface DetailedWeatherReport extends WeatherSnapshot {
  wind_gust_ms: number;
  wind_dir_deg: number;
  wind_dir_cardinal: string;
  cloud_ceiling_m: number;
  barometric_hpa: number;
  baro_trend: 'FALLING' | 'STEADY' | 'RISING';
  wind_chill_c: number;
  precipitation_type: 'NONE' | 'MIST' | 'DRIZZLE' | 'RAIN' | 'SLEET_SNOW';
  daylight_remaining_min: number;
  scenario: WeatherScenarioKey;
}

