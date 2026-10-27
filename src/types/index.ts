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
}
