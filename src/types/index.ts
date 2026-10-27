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
