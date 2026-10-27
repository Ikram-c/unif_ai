import {
  CausalityViabilityLevel,
  CellCausalityReport,
  CellTerrainInfo,
  DetailedWeatherReport,
  EquipmentViabilityAssessment,
  SearchCell,
  TacticalTeam,
  TeamViabilityAssessment,
  WeatherScenarioKey,
} from '../types';

/**
 * Weather Presets for instant simulation in the command workflow
 */
export const WEATHER_PRESETS: Record<WeatherScenarioKey, DetailedWeatherReport> = {
  BASELINE: {
    wind_ms: 11.2,
    gust_ms: 15.4,
    wind_gust_ms: 15.4,
    wind_dir_deg: 245,
    wind_dir_cardinal: 'WSW',
    precipitation_mm_h: 0.8,
    precipitation_type: 'DRIZZLE',
    visibility_m: 3200,
    temperature_c: 8.5,
    wind_chill_c: 5.2,
    cloud_cover_pct: 65,
    cloud_ceiling_m: 780, // ASL
    barometric_hpa: 1012,
    baro_trend: 'STEADY',
    daylight: true,
    daylight_remaining_min: 195,
    source: 'Storey Arms telemetry station (12:25 UTC)',
    scenario: 'BASELINE',
  },
  SUMMIT_GALE: {
    wind_ms: 19.5,
    gust_ms: 27.8, // ~54 kts
    wind_gust_ms: 27.8,
    wind_dir_deg: 280,
    wind_dir_cardinal: 'WNW',
    precipitation_mm_h: 3.5,
    precipitation_type: 'RAIN',
    visibility_m: 1400,
    temperature_c: 4.2,
    wind_chill_c: -1.8,
    cloud_cover_pct: 95,
    cloud_ceiling_m: 540,
    barometric_hpa: 998,
    baro_trend: 'FALLING',
    daylight: true,
    daylight_remaining_min: 160,
    source: 'Summit AWS Pen y Fan (Warning Active)',
    scenario: 'SUMMIT_GALE',
  },
  CWM_FOG: {
    wind_ms: 4.1,
    gust_ms: 6.8,
    wind_gust_ms: 6.8,
    wind_dir_deg: 190,
    wind_dir_cardinal: 'S',
    precipitation_mm_h: 1.2,
    precipitation_type: 'MIST',
    visibility_m: 180, // Dense fog
    temperature_c: 6.0,
    wind_chill_c: 5.1,
    cloud_cover_pct: 100,
    cloud_ceiling_m: 380, // Inversion/low ceiling
    barometric_hpa: 1018,
    baro_trend: 'RISING',
    daylight: true,
    daylight_remaining_min: 140,
    source: 'Cwm Llwch Valley Sensor',
    scenario: 'CWM_FOG',
  },
  FREEZING_NIGHT: {
    wind_ms: 13.4,
    gust_ms: 18.2,
    wind_gust_ms: 18.2,
    wind_dir_deg: 350,
    wind_dir_cardinal: 'N',
    precipitation_mm_h: 2.0,
    precipitation_type: 'SLEET_SNOW',
    visibility_m: 800,
    temperature_c: -2.5,
    wind_chill_c: -11.4,
    cloud_cover_pct: 85,
    cloud_ceiling_m: 620,
    barometric_hpa: 1004,
    baro_trend: 'FALLING',
    daylight: false, // Night search
    daylight_remaining_min: 0,
    source: 'Night ops dispatch estimate',
    scenario: 'FREEZING_NIGHT',
  },
};

/**
 * Standard tactical teams deployed or on standby
 */
export const DEFAULT_TACTICAL_TEAMS: TacticalTeam[] = [
  {
    id: 'team-alpha',
    name: 'Alpha',
    callsign: 'Alpha',
    type: 'FOOT_HASTY',
    personnel: 8,
    sector: 'Sector A · Northern Path',
    assignedSectorBoundaryLabel: 'Sector A (North Spine)',
    assignedHexId: 'hex:0:0',
    status: 'In progress',
    radioChannel: 'VHF Ch 1 (156.800 MHz)',
    endurancePct: 92,
    speedKmh: 1.4,
    position: { lat: 51.8745, lon: -3.468 },
    breadcrumbs: [
      { lat: 51.8685, lon: -3.48 },
      { lat: 51.871, lon: -3.475 },
      { lat: 51.8745, lon: -3.468 },
    ],
    carriedEquipment: ['GPS Trackers', 'Trauma Kit', 'VHF Handhelds', 'Thermal Monocular'],
    currentTask: 'Hasty path sweep towards Corn Du saddle',
    lastCheckInUtc: '12:24 UTC (6m ago)',
    isDrifted: false,
    telematics: {
      osGridRef: 'SN 9864 2138',
      altitudeM: 685,
      headingDeg: 38,
      headingCardinal: 'NE',
      radioRssiDb: -74,
      heartRateBpm: 114,
      gpsLockSats: 16,
    },
  },
  {
    id: 'team-bravo',
    name: 'Bravo',
    callsign: 'Bravo',
    type: 'FOOT_GRID',
    personnel: 6,
    sector: 'Sector B · Southern Drainage',
    assignedSectorBoundaryLabel: 'Sector B (South Drainage)',
    assignedHexId: 'hex:0:-1',
    status: 'In progress',
    radioChannel: 'VHF Ch 2 (156.850 MHz)',
    endurancePct: 86,
    speedKmh: 0.9,
    position: { lat: 51.862, lon: -3.47 },
    breadcrumbs: [
      { lat: 51.8685, lon: -3.48 },
      { lat: 51.865, lon: -3.476 },
      { lat: 51.862, lon: -3.47 },
    ],
    carriedEquipment: ['Collapsible Titanium Stretcher', 'Fleece Warmth Wrap', 'VHF Repeater Unit'],
    currentTask: 'Drainage contour grid line search',
    lastCheckInUtc: '12:24 UTC (6m ago)',
    isDrifted: false,
    telematics: {
      osGridRef: 'SN 9841 2012',
      altitudeM: 540,
      headingDeg: 182,
      headingCardinal: 'S',
      radioRssiDb: -88,
      heartRateBpm: 128,
      gpsLockSats: 14,
    },
  },
  {
    id: 'uav-01',
    name: 'SkyRanger UAV-01',
    callsign: 'UAV-01',
    type: 'AIR_UAV',
    personnel: 2,
    sector: 'Sector A / B Aerial Corridor',
    assignedSectorBoundaryLabel: 'Sector A/B Flight Box',
    assignedHexId: 'hex:1:0',
    status: 'In progress',
    radioChannel: 'Data Link 2.4/5.8 GHz (AES-256)',
    endurancePct: 22,
    batteryPct: 22,
    speedKmh: 35.0,
    position: { lat: 51.878, lon: -3.455 },
    breadcrumbs: [
      { lat: 51.8685, lon: -3.48 },
      { lat: 51.872, lon: -3.465 },
      { lat: 51.878, lon: -3.455 },
    ],
    carriedEquipment: ['FLIR Boson 640 Thermal Sensor', '4K 30x Optical Zoom Gimbal', 'ADS-B Out'],
    currentTask: 'Thermal corridor sweep · ⚠️ Low battery (22%) RTL advisory',
    lastCheckInUtc: '12:29 UTC (1m ago)',
    isDrifted: false,
    telematics: {
      osGridRef: 'SN 9912 2175',
      altitudeM: 820,
      headingDeg: 270,
      headingCardinal: 'W',
      radioRssiDb: -62,
      batteryVoltage: 20.8,
      gpsLockSats: 22,
    },
  },
  {
    id: 'k9-rex',
    name: 'K9-Rex & Dylan',
    callsign: 'K9-Rex',
    type: 'K9_UNIT',
    personnel: 2,
    sector: 'Sector A Saddle Scent Cone',
    assignedSectorBoundaryLabel: 'Sector A Scent Corridor',
    assignedHexId: 'hex:0:1',
    status: 'In progress',
    radioChannel: 'VHF Ch 3 (156.900 MHz)',
    endurancePct: 82,
    speedKmh: 2.1,
    position: { lat: 51.871, lon: -3.478 },
    breadcrumbs: [
      { lat: 51.8685, lon: -3.48 },
      { lat: 51.871, lon: -3.478 },
    ],
    carriedEquipment: ['Trailing Scent Harness', 'GPS K9 Collar', 'Booties', 'K9 First Aid'],
    currentTask: 'Air-scent sampling along downwind gully',
    lastCheckInUtc: '12:20 UTC (10m ago)',
    isDrifted: false,
    telematics: {
      osGridRef: 'SN 9815 2120',
      altitudeM: 620,
      headingDeg: 25,
      headingCardinal: 'NNE',
      radioRssiDb: -79,
      heartRateBpm: 108,
      gpsLockSats: 15,
    },
  },
  {
    id: 'tech-1',
    name: 'Mountain Tech-1',
    callsign: 'Tech-1',
    type: 'TECH_ROPE',
    personnel: 4,
    sector: 'Base Standby / Crag Escarpment',
    assignedSectorBoundaryLabel: 'Storey Arms RV',
    assignedHexId: 'hex:1:1',
    status: 'Ready',
    radioChannel: 'VHF Ch 4 (156.950 MHz)',
    endurancePct: 100,
    speedKmh: 0.0,
    position: { lat: 51.8685, lon: -3.48 },
    breadcrumbs: [{ lat: 51.8685, lon: -3.48 }],
    carriedEquipment: ['200m Static Ropes', 'Rigging Plates & Winch', 'High-Angle Litter', 'Climbing Hardware'],
    currentTask: 'Stationary standby at Storey Arms rendezvous for crag callout',
    lastCheckInUtc: '12:28 UTC (2m ago)',
    isDrifted: false,
    telematics: {
      osGridRef: 'SN 9825 2045',
      altitudeM: 440,
      headingDeg: 0,
      headingCardinal: 'N',
      radioRssiDb: -58,
      heartRateBpm: 76,
      gpsLockSats: 18,
    },
  },
  {
    id: 'rescue-936',
    name: 'Coastguard Helo R-936',
    callsign: 'Rescue-936',
    type: 'HELO',
    personnel: 4,
    sector: 'St. Athan SAR Base / Bannau airspace',
    assignedSectorBoundaryLabel: 'Tactical Airspace',
    assignedHexId: undefined,
    status: 'Ready',
    radioChannel: 'Air VHF 123.100 MHz',
    endurancePct: 100,
    speedKmh: 0.0,
    position: { lat: 51.85, lon: -3.49 },
    breadcrumbs: [],
    carriedEquipment: ['Star SAFIRE 380-HD FLIR', 'Dual Rescue Winch', 'Paramedic Suite', 'Searchlight'],
    currentTask: 'Stationary helipad standby: Weather flight ceiling monitoring',
    lastCheckInUtc: '12:15 UTC (15m ago)',
    isDrifted: false,
    telematics: {
      osGridRef: 'SS 9974 6825',
      altitudeM: 1200,
      headingDeg: 340,
      headingCardinal: 'NNW',
      radioRssiDb: -52,
      gpsLockSats: 24,
    },
  },
];

/**
 * Deterministic terrain extraction based on coordinates & grid offset
 */
export function extractCellTerrain(cell: SearchCell): CellTerrainInfo {
  // Storey Arms reference point
  const baseLat = 51.8685;
  const baseLon = -3.48;

  const dLat = (cell.centre.lat - baseLat) * 111000; // meters north
  const dLon = (cell.centre.lon - baseLon) * 68000; // meters east
  const dist = Math.sqrt(dLat * dLat + dLon * dLon);

  // Elevation profile: Storey arms is ~440m; Corn Du / Pen y Fan peaks northeast ~886m
  let elevation_m = 440 + (dLat > 0 ? (dLat / 1800) * 440 : -(Math.abs(dLat) / 2000) * 80);
  elevation_m = Math.max(380, Math.min(886, elevation_m + Math.sin(cell.centre.lat * 200) * 40));

  // Slope calculation: steeper to the northeast towards crags
  let slope_deg = 8.0;
  if (dLat > 400 && dLon > 200) {
    // Heading towards Corn Du / Pen y Fan ridge
    slope_deg = 18.0 + (dist / 2500) * 24.0;
  } else if (dLat < -200) {
    // Southern drainage / valley
    slope_deg = 12.0 + Math.abs(dLat) / 300;
  }
  slope_deg = Math.min(58, Math.max(4, slope_deg));

  // Categorize slope
  let slope_category: 'FLAT' | 'MODERATE' | 'STEEP' | 'CLIFF' = 'FLAT';
  if (slope_deg > 35) {
    slope_category = 'CLIFF';
  } else if (slope_deg > 22) {
    slope_category = 'STEEP';
  } else if (slope_deg > 12) {
    slope_category = 'MODERATE';
  }

  // Substrate & Hazards
  let substrate: 'MOORLAND' | 'TRACK' | 'SCREE' | 'FOREST' | 'CRAG' | 'WATER' = 'MOORLAND';
  const hazard_tags: string[] = [];

  if (slope_category === 'CLIFF') {
    substrate = 'CRAG';
    hazard_tags.push('Vertical drop / sheer scarp', 'Falling rock hazard', 'Ropes required');
  } else if (slope_deg > 24) {
    substrate = 'SCREE';
    hazard_tags.push('Loose scree / unstable footings', 'Paw laceration risk for K9');
  } else if (cell.terrain === 'FOREST') {
    substrate = 'FOREST';
    hazard_tags.push('Dense canopy obscures aerial sensors');
  } else if (cell.terrain === 'WATER') {
    substrate = 'WATER';
    hazard_tags.push('Gully torrent / saturated peat bog');
  } else if (dist < 400 || (dLat > 0 && Math.abs(dLon - dLat * 0.4) < 150)) {
    substrate = 'TRACK'; // Main tourist track
  }

  // Exposure level
  let exposure_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' = 'LOW';
  if (elevation_m > 750 || slope_category === 'CLIFF') {
    exposure_level = 'EXTREME';
    hazard_tags.push('Severe wind acceleration zone');
  } else if (elevation_m > 600 || slope_category === 'STEEP') {
    exposure_level = 'HIGH';
  } else if (elevation_m > 500) {
    exposure_level = 'MEDIUM';
  }

  return {
    elevation_m: Math.round(elevation_m),
    slope_deg: Math.round(slope_deg * 10) / 10,
    slope_category,
    substrate,
    exposure_level,
    hazard_tags,
  };
}

/**
 * Main Causality Engine: Deterministically evaluates how environmental causes
 * restrict or empower each team and piece of equipment for a given cell.
 */
export function evaluateCellViability(
  cell: SearchCell,
  weather: DetailedWeatherReport,
  teams: TacticalTeam[] = DEFAULT_TACTICAL_TEAMS
): CellCausalityReport {
  const terrain = extractCellTerrain(cell);
  const limiting_factors: string[] = [];
  const team_assessments: TeamViabilityAssessment[] = [];
  const equipment_assessments: EquipmentViabilityAssessment[] = [];

  // Wind adjusted for elevation & exposure
  const windExposureMultiplier =
    terrain.exposure_level === 'EXTREME' ? 1.4 : terrain.exposure_level === 'HIGH' ? 1.25 : 1.0;
  const localWindGustMs = weather.gust_ms * windExposureMultiplier;

  // 1. Evaluate UAV-01
  const uavAssessment: TeamViabilityAssessment = {
    team_id: 'uav-01',
    callsign: 'UAV-01',
    viable: true,
    status: 'VIABLE',
    speed_kmh: 35.0,
    pod_pct: 88,
    reason: 'Clear aerial survey lane',
  };

  if (localWindGustMs > 16.5) {
    // > 32 knots
    uavAssessment.viable = false;
    uavAssessment.status = 'BLOCKED';
    uavAssessment.pod_pct = 0;
    uavAssessment.reason = `Grounded: Local gusts ${localWindGustMs.toFixed(1)} m/s (${(localWindGustMs * 1.944).toFixed(0)} kts) exceed airframe 16.5 m/s envelope`;
    limiting_factors.push(`UAV grounded by summit gusts (${localWindGustMs.toFixed(0)} m/s)`);
  } else if (weather.cloud_ceiling_m < terrain.elevation_m + 60) {
    uavAssessment.viable = false;
    uavAssessment.status = 'BLOCKED';
    uavAssessment.pod_pct = 0;
    uavAssessment.reason = `Flight into terrain risk: Cloud ceiling ${weather.cloud_ceiling_m}m ASL envelops cell elevation (${terrain.elevation_m}m)`;
    limiting_factors.push(`Cloud ceiling (${weather.cloud_ceiling_m}m) sits on terrain (${terrain.elevation_m}m)`);
  } else if (terrain.substrate === 'FOREST') {
    uavAssessment.status = 'DEGRADED';
    uavAssessment.pod_pct = 35;
    uavAssessment.reason = 'Dense coniferous canopy blocks 65% of ground visibility';
  } else if (weather.visibility_m < 500) {
    uavAssessment.status = 'RESTRICTED';
    uavAssessment.pod_pct = 20;
    uavAssessment.reason = 'Low fog severely limits optical camera swath';
  } else if (localWindGustMs > 12.0) {
    uavAssessment.status = 'DEGRADED';
    uavAssessment.pod_pct = 65;
    uavAssessment.reason = 'Turbulence degrades gimbal tracking stability';
  }
  team_assessments.push(uavAssessment);

  // 2. Evaluate K9-Rex (Trailing Scent Dog)
  const k9Assessment: TeamViabilityAssessment = {
    team_id: 'k9-rex',
    callsign: 'K9-Rex',
    viable: true,
    status: 'VIABLE',
    speed_kmh: 2.2,
    pod_pct: 85,
    reason: 'Optimal damp scent-pooling conditions',
  };

  if (terrain.substrate === 'SCREE' && terrain.slope_deg > 22) {
    k9Assessment.viable = false;
    k9Assessment.status = 'BLOCKED';
    k9Assessment.pod_pct = 0;
    k9Assessment.reason = 'Blocked: Razor scree & steep grade risk debilitating paw laceration and stonefall';
    limiting_factors.push('K9 blocked by hazardous razor scree');
  } else if (terrain.slope_category === 'CLIFF') {
    k9Assessment.viable = false;
    k9Assessment.status = 'BLOCKED';
    k9Assessment.pod_pct = 0;
    k9Assessment.reason = 'Blocked: Vertical crag impossible for dog team without technical hoisting';
  } else if (weather.wind_ms > 13.0) {
    k9Assessment.status = 'RESTRICTED';
    k9Assessment.pod_pct = 25;
    k9Assessment.reason = `High wind (${weather.wind_ms.toFixed(0)} m/s) scatters and shears scent plume`;
    limiting_factors.push(`Scent tracking dispersed by ${weather.wind_ms.toFixed(0)} m/s wind`);
  } else if (weather.precipitation_mm_h > 4.0) {
    k9Assessment.status = 'DEGRADED';
    k9Assessment.pod_pct = 40;
    k9Assessment.reason = 'Heavy rain leaching scent molecules into drainage runoff';
  } else if (weather.temperature_c > 22 || weather.temperature_c < -4) {
    k9Assessment.status = 'DEGRADED';
    k9Assessment.pod_pct = 50;
    k9Assessment.reason = 'Sub-zero frozen ground reduces canine olfaction reception';
  }
  team_assessments.push(k9Assessment);

  // 3. Evaluate Team Alpha (Hasty Foot Team)
  const alphaAssessment: TeamViabilityAssessment = {
    team_id: 'team-alpha',
    callsign: 'Alpha',
    viable: true,
    status: 'VIABLE',
    speed_kmh: 1.5,
    pod_pct: 75,
    reason: 'High foot sweep mobility',
  };

  if (terrain.slope_category === 'CLIFF') {
    alphaAssessment.viable = false;
    alphaAssessment.status = 'BLOCKED';
    alphaAssessment.pod_pct = 5;
    alphaAssessment.speed_kmh = 0.1;
    alphaAssessment.reason = 'Blocked: Crag slope >35° impassable without technical rope rigging (Tech-1 required)';
    limiting_factors.push('Ground searchers blocked by technical crag');
  } else if (terrain.slope_category === 'STEEP') {
    alphaAssessment.status = 'DEGRADED';
    alphaAssessment.pod_pct = 55;
    alphaAssessment.speed_kmh = 0.6;
    alphaAssessment.reason = 'Steep ascent slows advance rate to 0.6 km/h; micro-route detours required';
  }

  if (weather.wind_chill_c < 0 && weather.precipitation_mm_h > 1.5) {
    alphaAssessment.status = alphaAssessment.status === 'BLOCKED' ? 'BLOCKED' : 'DEGRADED';
    alphaAssessment.reason += '; Exposure warning: hypothermia window reduced to 2.5 hours';
    limiting_factors.push('Rapid hypothermia exposure hazard for searchers');
  }
  team_assessments.push(alphaAssessment);

  // 4. Evaluate Team Bravo (Grid Line Ground Team)
  const bravoAssessment: TeamViabilityAssessment = {
    team_id: 'team-bravo',
    callsign: 'Bravo',
    viable: true,
    status: 'VIABLE',
    speed_kmh: 1.0,
    pod_pct: 82,
    reason: 'Tight spacing sweep optimal for thorough detection',
  };

  if (terrain.slope_category === 'CLIFF' || terrain.slope_deg > 28) {
    bravoAssessment.viable = false;
    bravoAssessment.status = 'BLOCKED';
    bravoAssessment.pod_pct = 0;
    bravoAssessment.speed_kmh = 0.1;
    bravoAssessment.reason = 'Blocked: Formation grid line impossible on slope >28°; falling rock hazard';
  } else if (terrain.substrate === 'WATER' || terrain.substrate === 'FOREST') {
    bravoAssessment.status = 'DEGRADED';
    bravoAssessment.pod_pct = 60;
    bravoAssessment.speed_kmh = 0.5;
    bravoAssessment.reason = 'Broken ground slows line cohesion';
  }
  team_assessments.push(bravoAssessment);

  // 5. Evaluate Mountain Tech-1 (Technical Rope)
  const techAssessment: TeamViabilityAssessment = {
    team_id: 'tech-1',
    callsign: 'Tech-1',
    viable: true,
    status: 'VIABLE',
    speed_kmh: 0.5,
    pod_pct: 90,
    reason: 'Equipped with 200m static lines and rigging anchor kits',
  };

  if (terrain.slope_category === 'CLIFF') {
    techAssessment.status = 'VIABLE';
    techAssessment.pod_pct = 95;
    techAssessment.reason = 'Primary asset: Specialised cliff face search & extraction ready';
  } else if (terrain.slope_category === 'FLAT') {
    techAssessment.status = 'RESTRICTED';
    techAssessment.pod_pct = 40;
    techAssessment.reason = 'Inefficient asset allocation: Hold Tech-1 in reserve for high-angle sectors';
  }
  team_assessments.push(techAssessment);

  // 6. Evaluate Rescue-936 Helo
  const heloAssessment: TeamViabilityAssessment = {
    team_id: 'rescue-936',
    callsign: 'Rescue-936',
    viable: true,
    status: 'VIABLE',
    speed_kmh: 210.0,
    pod_pct: 92,
    reason: 'Airborne FLIR coverage available',
  };

  if (localWindGustMs > 24.0 || weather.cloud_ceiling_m < 350 || weather.visibility_m < 800) {
    heloAssessment.viable = false;
    heloAssessment.status = 'BLOCKED';
    heloAssessment.pod_pct = 0;
    heloAssessment.reason = 'Helo SAR weather minimums breached: ceiling < 350m or gusts > 47 kts';
    limiting_factors.push('Helo SAR restricted by severe mountain weather');
  } else if (terrain.substrate === 'FOREST') {
    heloAssessment.status = 'DEGRADED';
    heloAssessment.pod_pct = 45;
    heloAssessment.reason = 'Canopy cover limits winch hoist and FLIR line-of-sight';
  }
  team_assessments.push(heloAssessment);

  // ================= Equipment Causality =================
  // 1. FLIR Boson Thermal Gimbal
  if (!weather.daylight) {
    equipment_assessments.push({
      equipment: 'FLIR Boson 640 Thermal Gimbal',
      category: 'OPTICAL',
      status: 'OPTIMAL',
      reason: 'Optimal night delta-T contrast (cool peat vs 37°C body signature)',
    });
  } else if (weather.precipitation_mm_h > 4.0 || weather.visibility_m < 200) {
    equipment_assessments.push({
      equipment: 'FLIR Boson 640 Thermal Gimbal',
      category: 'OPTICAL',
      status: 'DEGRADED',
      reason: 'Atmospheric moisture & droplet scattering attenuate 8-14μm IR wavelength',
    });
  } else {
    equipment_assessments.push({
      equipment: 'FLIR Boson 640 Thermal Gimbal',
      category: 'OPTICAL',
      status: 'USABLE',
      reason: 'Usable; daylight solar reflection requires secondary visual verification',
    });
  }

  // 2. High-Angle Winch & Rope Rigging
  if (terrain.slope_category === 'CLIFF' || terrain.slope_deg > 30) {
    equipment_assessments.push({
      equipment: 'High-Angle Winch & Static Lines',
      category: 'RIGGING',
      status: 'OPTIMAL',
      reason: 'Mandatory safety system for searching and extracting on rock scarp',
    });
  } else {
    equipment_assessments.push({
      equipment: 'High-Angle Winch & Static Lines',
      category: 'RIGGING',
      status: 'DEGRADED',
      reason: 'Excess weight on low-angle terrain; leave in base cache',
    });
  }

  // 3. VHF Mountain Repeater Relay
  if (terrain.elevation_m < 500 && (cell.centre.lat < 51.865 || cell.centre.lon > -3.45)) {
    equipment_assessments.push({
      equipment: 'VHF Mountain Repeater Unit',
      category: 'RADIO',
      status: 'OPTIMAL',
      reason: 'Ridge topography causes severe RF shadow to Storey Arms base',
    });
  } else {
    equipment_assessments.push({
      equipment: 'VHF Mountain Repeater Unit',
      category: 'RADIO',
      status: 'USABLE',
      reason: 'Line-of-sight to mobile command is established',
    });
  }

  // 4. Titanium Evacuation Stretcher
  if (terrain.slope_category === 'CLIFF') {
    equipment_assessments.push({
      equipment: 'Titanium Evacuation Stretcher',
      category: 'EVACUATION',
      status: 'DEGRADED',
      reason: 'Requires twin-tension rope bridle for vertical lowering',
    });
  } else {
    equipment_assessments.push({
      equipment: 'Titanium Evacuation Stretcher',
      category: 'EVACUATION',
      status: 'OPTIMAL',
      reason: 'Ready for ground extraction along bridal trail',
    });
  }

  // 5. Trailing Scent Harness
  if (k9Assessment.status === 'BLOCKED') {
    equipment_assessments.push({
      equipment: 'Trailing Scent Rig',
      category: 'SCENT',
      status: 'PROHIBITED',
      reason: 'Terrain hazard forbids canine deployment in this cell',
    });
  } else {
    equipment_assessments.push({
      equipment: 'Trailing Scent Rig',
      category: 'SCENT',
      status: 'OPTIMAL',
      reason: 'Active air-scent sampling feasible',
    });
  }

  // Overall viability scoring
  const viableTeamCount = team_assessments.filter((t) => t.viable && t.status !== 'RESTRICTED').length;
  let overall_score = Math.round((viableTeamCount / team_assessments.length) * 100);

  if (limiting_factors.length > 2) overall_score = Math.min(overall_score, 40);
  if (terrain.slope_category === 'CLIFF' && uavAssessment.status === 'BLOCKED') {
    overall_score = Math.min(overall_score, 35);
  }

  let viability: CausalityViabilityLevel = 'VIABLE';
  if (overall_score < 25) viability = 'BLOCKED';
  else if (overall_score < 50) viability = 'RESTRICTED';
  else if (overall_score < 75) viability = 'DEGRADED';

  // Primary recommendation synthesis
  let primary_recommendation = 'Deploy Team Alpha for hasty sweep; supplement with UAV aerial scan.';
  if (terrain.slope_category === 'CLIFF') {
    primary_recommendation = 'Assign Mountain Tech-1 with 200m static ropes. Keep foot searchers on rim.';
  } else if (uavAssessment.status === 'BLOCKED' && k9Assessment.viable) {
    primary_recommendation = 'Air support grounded by weather. Rely on K9-Rex with Team Alpha flank support.';
  } else if (k9Assessment.status === 'BLOCKED' && uavAssessment.viable) {
    primary_recommendation = 'Scree hazard prohibits K9. Fly UAV-01 FLIR grid pattern across contours.';
  } else if (overall_score < 30) {
    primary_recommendation = 'Extreme hazard cell. Hold ground teams; wait for weather clearance or use winch helo.';
  }

  return {
    cell_id: cell.cell_id,
    terrain,
    overall_score,
    viability,
    limiting_factors: Array.from(new Set(limiting_factors)),
    team_assessments,
    equipment_assessments,
    primary_recommendation,
  };
}
