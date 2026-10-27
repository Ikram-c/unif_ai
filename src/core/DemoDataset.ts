import {
  DataSourceKind,
  GeoPosition,
  Observation,
  Place,
  Rescue,
  SearchDataBundle,
  SearchWindowRequest,
  WeatherSnapshot,
} from '../types';
import { Geo } from './Geo';
import { HexGrid } from './HexGrid';
import { defaultSarConfig, SarConfig } from './SarConfig';
import { SolarCalculator } from './SolarCalculator';
import { TimeFormat } from './TimeFormat';

class SimpleRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(min + this.next() * (max - min));
  }

  nextDouble(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  nextBoolean(): boolean {
    return this.next() > 0.5;
  }
}

export class DemoDataset {
  private hexGrid: HexGrid;

  readonly defaultPin: GeoPosition = { lat: 52.295, lon: -3.76 };

  readonly gazetteer: Place[] = [
    { name: 'Elenydd, Cambrian Mountains', position: { lat: 52.295, lon: -3.76 }, region: 'Ceredigion / Powys' },
    { name: 'Aberystwyth', position: { lat: 52.4153, lon: -4.0829 }, region: 'Ceredigion' },
    { name: 'Pumlumon Fawr', position: { lat: 52.4675, lon: -3.7823 }, region: 'Ceredigion' },
    { name: 'Elan Valley', position: { lat: 52.271, lon: -3.582 }, region: 'Powys' },
    { name: 'Claerwen Reservoir', position: { lat: 52.243, lon: -3.71 }, region: 'Powys' },
    { name: "Devil's Bridge", position: { lat: 52.3772, lon: -3.8517 }, region: 'Ceredigion' },
    { name: 'Tregaron', position: { lat: 52.2214, lon: -3.9349 }, region: 'Ceredigion' },
    { name: 'Rhayader', position: { lat: 52.3021, lon: -3.5079 }, region: 'Powys' },
    { name: 'Llanidloes', position: { lat: 52.4488, lon: -3.539 }, region: 'Powys' },
    { name: 'Machynlleth', position: { lat: 52.591, lon: -3.851 }, region: 'Powys' },
    { name: 'Cadair Idris', position: { lat: 52.6994, lon: -3.9086 }, region: 'Eryri' },
    { name: 'Yr Wyddfa (Snowdon)', position: { lat: 53.0685, lon: -4.0763 }, region: 'Eryri' },
    { name: 'Llanberis', position: { lat: 53.119, lon: -4.129 }, region: 'Eryri' },
    { name: 'Betws-y-Coed', position: { lat: 53.0921, lon: -3.8025 }, region: 'Eryri' },
    { name: 'Pen y Fan', position: { lat: 51.8839, lon: -3.4367 }, region: 'Bannau Brycheiniog' },
    { name: 'Brecon', position: { lat: 51.9475, lon: -3.391 }, region: 'Powys' },
    { name: 'Carmarthen', position: { lat: 51.8557, lon: -4.3096 }, region: 'Carmarthenshire' },
  ];

  constructor(private config: SarConfig = defaultSarConfig) {
    this.hexGrid = new HexGrid(config.hexGrid);
  }

  search(query: string, limit: number = 6): Place[] {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return this.gazetteer
      .filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.region.toLowerCase().includes(needle)
      )
      .slice(0, limit);
  }

  bundle(request: SearchWindowRequest): SearchDataBundle {
    const lastSeen = TimeFormat.parse(request.last_seen_utc);
    const now = TimeFormat.parse(request.now_utc);
    const random = new SimpleRandom(this.seedOf(request.rescue_id));

    const observations: Observation[] = [
      ...this.satelliteScenes(request, lastSeen, now, random),
      ...this.uavFlights(request, lastSeen, now, random),
      ...this.dashcamPasses(request, lastSeen, now, random),
    ];

    return {
      cells: this.hexGrid.cover(request.pin, request.radius_m),
      observations,
      weather: this.weather(request.pin, now, random),
      cell_source: 'hexgrid-offline',
    };
  }

  detectionOutcome(observationId: string): number {
    let hash = 0;
    for (let i = 0; i < observationId.length; i++) {
      hash = (Math.imul(31, hash) + observationId.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % 4;
  }

  sampleRescues(now: Date): Rescue[] {
    const h = 3600 * 1000;
    const d = 24 * h;

    return [
      {
        id: 'demo-pumlumon',
        status: 'ONGOING',
        created_at_utc: TimeFormat.format(new Date(now.getTime() - 5 * h)),
        last_known_location: { lat: 52.4675, lon: -3.7823 },
        location_label: 'Pumlumon Fawr summit path',
        travel_mode: 'ON_FOOT',
        last_seen_utc: TimeFormat.format(new Date(now.getTime() - 7 * h)),
        time_zone: 'UTC',
        subject: {
          name: 'Overdue walker',
          age: 34,
          fitness: 'HIGH',
          experience: 'INTERMEDIATE',
          clothing: 'Red shell jacket',
          notes: 'Car parked in forestry lay-by, mobile battery dead',
        },
      },
      {
        id: 'demo-elan',
        status: 'ONGOING',
        created_at_utc: TimeFormat.format(new Date(now.getTime() - 20 * h)),
        last_known_location: { lat: 52.271, lon: -3.582 },
        location_label: 'Elan Valley visitor centre car park',
        travel_mode: 'VEHICLE',
        last_seen_utc: TimeFormat.format(new Date(now.getTime() - 26 * h)),
        time_zone: 'UTC',
        subject: {
          name: 'Vehicle not returned',
          age: 68,
          fitness: 'LOW',
          experience: 'NOVICE',
          clothing: 'Silver estate car',
          notes: 'Vehicle spotted near reservoir turnoff earlier',
        },
      },
      {
        id: 'demo-cadair',
        status: 'COMPLETED',
        created_at_utc: TimeFormat.format(new Date(now.getTime() - 3 * d)),
        last_known_location: { lat: 52.6994, lon: -3.9086 },
        location_label: 'Cadair Idris, Minffordd path',
        travel_mode: 'ON_FOOT',
        last_seen_utc: TimeFormat.format(new Date(now.getTime() - 3 * d - 4 * h)),
        time_zone: 'UTC',
        subject: {
          name: 'Fell runner',
          age: 29,
          fitness: 'HIGH',
          experience: 'EXPERT',
          clothing: 'Black running tights and yellow vest',
          notes: 'Located by UAV thermal sweep near Llyn Cau',
        },
      },
    ];
  }

  private satelliteScenes(
    request: SearchWindowRequest,
    lastSeen: Date,
    now: Date,
    random: SimpleRandom
  ): Observation[] {
    const scenes: Observation[] = [];
    const phase = random.nextInt(0, 3);
    const days = this.daysBetween(lastSeen, now);

    for (const day of days) {
      if (scenes.length >= 40) break;
      const epochDay = Math.floor(day.getTime() / (86400 * 1000));

      if ((epochDay + phase) % 3 === 0) {
        const at = new Date(day);
        at.setUTCHours(11, 11, 0, 0);
        if (this.inWindow(at, lastSeen, now)) {
          scenes.push(this.sentinel2(request, at, random));
        }
      }

      if ((epochDay + phase) % 6 === 1) {
        const at = new Date(day);
        at.setUTCHours(6, 24, 0, 0);
        if (this.inWindow(at, lastSeen, now)) {
          scenes.push(this.sentinel1(request, at));
        }
      }

      const planetAt = new Date(day);
      planetAt.setUTCHours(10, 32, 0, 0);
      if (this.inWindow(planetAt, lastSeen, now)) {
        scenes.push(this.planetScope(request, planetAt, random));
      }
    }
    return scenes;
  }

  private sentinel2(request: SearchWindowRequest, at: Date, random: SimpleRandom): Observation {
    const cloud = 10.0 + random.nextInt(0, 86);
    const usable = cloud < 60.0;
    const epochSec = Math.floor(at.getTime() / 1000);
    return {
      id: `s2-${epochSec}`,
      source: 'SATELLITE',
      platform_id: random.nextBoolean() ? 'Sentinel-2A' : 'Sentinel-2B',
      observed_at_utc: TimeFormat.format(at),
      distance_from_pin_m: 0.0,
      footprint: Geo.circle(request.pin, 50000.0, 4),
      cloud_cover_pct: cloud,
      zarr_uri: `s3://cdse-demo/sentinel-2/T30UVD/${epochSec}.zarr`,
      frame_index: null,
      detection_status: 'NOT_RUN',
      candidate_count: 0,
      note: usable
        ? '10 m optical; vehicle-scale change detection'
        : 'Cloud cover too high for optical use',
    };
  }

  private sentinel1(request: SearchWindowRequest, at: Date): Observation {
    const epochSec = Math.floor(at.getTime() / 1000);
    return {
      id: `s1-${epochSec}`,
      source: 'SATELLITE',
      platform_id: 'Sentinel-1A',
      observed_at_utc: TimeFormat.format(at),
      distance_from_pin_m: 0.0,
      footprint: Geo.circle(request.pin, 90000.0, 4),
      cloud_cover_pct: null,
      zarr_uri: `s3://cdse-demo/sentinel-1/IW_GRDH/${epochSec}.zarr`,
      frame_index: null,
      detection_status: 'NOT_RUN',
      candidate_count: 0,
      note: 'C-band SAR, all-weather; bright targets such as vehicles only',
    };
  }

  private planetScope(request: SearchWindowRequest, at: Date, random: SimpleRandom): Observation {
    const cloud = 5.0 + random.nextInt(0, 90);
    const epochSec = Math.floor(at.getTime() / 1000);
    return {
      id: `ps-${epochSec}`,
      source: 'SATELLITE',
      platform_id: 'PlanetScope',
      observed_at_utc: TimeFormat.format(at),
      distance_from_pin_m: 0.0,
      footprint: Geo.circle(request.pin, 12000.0, 4),
      cloud_cover_pct: cloud,
      zarr_uri: `s3://planet-demo/psscene/${epochSec}.zarr`,
      frame_index: null,
      detection_status: 'NOT_RUN',
      candidate_count: 0,
      note:
        cloud < 50.0
          ? '3 m optical; tasking of higher resolution possible'
          : 'Mostly cloud; request re-task',
    };
  }

  private uavFlights(
    request: SearchWindowRequest,
    lastSeen: Date,
    now: Date,
    random: SimpleRandom
  ): Observation[] {
    const flights: Observation[] = [];
    const days = this.daysBetween(lastSeen, now);
    const phase = random.nextInt(0, 2);

    for (const day of days) {
      if (flights.length >= 40) break;
      const epochDay = Math.floor(day.getTime() / (86400 * 1000));
      if ((epochDay + phase) % 2 !== 0) continue;

      const at = new Date(day);
      at.setUTCHours(13, 0, 0, 0);
      if (!this.inWindow(at, lastSeen, now)) continue;

      const bearing = random.nextDouble(0.0, 360.0);
      const offset = random.nextDouble(0.2, 0.7) * request.radius_m;
      const strip = Geo.destination(request.pin, bearing, offset);
      const heading = random.nextDouble(0.0, 180.0);
      const secondsIntoFlight = random.nextInt(60, 1100);
      const flightDate = new Date(at.getTime() + secondsIntoFlight * 1000);
      const dateString = day.toISOString().slice(0, 10);

      flights.push({
        id: `uav-${Math.floor(at.getTime() / 1000)}`,
        source: 'UAV',
        platform_id: 'UAV-LITTER-SURVEY-03',
        observed_at_utc: TimeFormat.format(flightDate),
        distance_from_pin_m: offset,
        footprint: this.stripFootprint(strip, heading, 800.0, 200.0),
        zarr_uri: `gs://srportal-demo/uav/UAV-LITTER-SURVEY-03_${dateString}T1300.zarr`,
        frame_index: secondsIntoFlight * 30,
        detection_status: 'NOT_RUN',
        candidate_count: 0,
        note: 'Routine 120 m AGL survey strip; 2 cm GSD',
      });
    }
    return flights;
  }

  private dashcamPasses(
    request: SearchWindowRequest,
    lastSeen: Date,
    now: Date,
    random: SimpleRandom
  ): Observation[] {
    const passes: Observation[] = [];
    const roadBearing = random.nextDouble(0.0, 360.0);
    const roadOffset = random.nextDouble(0.3, 0.9) * request.radius_m;
    const roadPoint = Geo.destination(request.pin, roadBearing, roadOffset);
    const days = this.daysBetween(lastSeen, now);

    const schedule = [
      { vehicle: 'CAR01', hour: 8, minute: 30 },
      { vehicle: 'CAR02', hour: 12, minute: 0 },
      { vehicle: 'CAR01', hour: 17, minute: 15 },
      { vehicle: 'CAR03', hour: 19, minute: 40 },
    ];

    for (const day of days) {
      for (const { vehicle, hour, minute } of schedule) {
        if (passes.length >= 40) return passes;
        const at = new Date(day);
        at.setUTCHours(hour, minute, 0, 0);
        if (!this.inWindow(at, lastSeen, now)) continue;

        const alongRoad = random.nextDouble(-600.0, 600.0);
        const passPoint = Geo.destination(roadPoint, roadBearing + 90.0, alongRoad);
        const secondsIntoClip = random.nextInt(5, 290);
        const clipDate = new Date(at.getTime() + secondsIntoClip * 1000);
        const stamp = `${day.toISOString().slice(0, 10).replace(/-/g, '')}_${String(hour).padStart(2, '0')}${String(minute).padStart(2, '0')}00`;

        passes.push({
          id: `dash-${vehicle}-${Math.floor(at.getTime() / 1000)}`,
          source: 'DASHCAM',
          platform_id: vehicle,
          observed_at_utc: TimeFormat.format(clipDate),
          distance_from_pin_m: Geo.distanceM(request.pin, passPoint),
          footprint: this.wedgeFootprint(passPoint, roadBearing + 90.0, 120.0, 70.0),
          zarr_uri: `gs://srportal-demo/dashcam/${vehicle}_${stamp}_CAM01.zarr`,
          frame_index: secondsIntoClip * 30,
          detection_status: 'NOT_RUN',
          candidate_count: 0,
          note: 'Forward camera; GPX-tagged frame manifest',
        });
      }
    }
    return passes;
  }

  private weather(pin: GeoPosition, now: Date, random: SimpleRandom): WeatherSnapshot {
    const wind = random.nextDouble(4.0, 13.0);
    return {
      wind_ms: this.round1(wind),
      gust_ms: this.round1(wind + random.nextDouble(2.0, 6.0)),
      precipitation_mm_h: this.round1(random.nextDouble(0.0, 3.2)),
      visibility_m: 800 + random.nextInt(0, 8200),
      temperature_c: this.round1(random.nextDouble(3.0, 14.0)),
      cloud_cover_pct: 35 + random.nextInt(0, 61),
      daylight: SolarCalculator.isDaylight(pin, now),
      source: 'demo',
    };
  }

  private stripFootprint(
    centre: GeoPosition,
    headingDeg: number,
    lengthM: number,
    widthM: number
  ): GeoPosition[] {
    const half = lengthM / 2.0;
    const a = Geo.destination(centre, headingDeg, half);
    const b = Geo.destination(centre, headingDeg + 180.0, half);
    return [
      Geo.destination(a, headingDeg + 90.0, widthM / 2.0),
      Geo.destination(b, headingDeg + 90.0, widthM / 2.0),
      Geo.destination(b, headingDeg - 90.0, widthM / 2.0),
      Geo.destination(a, headingDeg - 90.0, widthM / 2.0),
    ];
  }

  private wedgeFootprint(
    apex: GeoPosition,
    headingDeg: number,
    rangeM: number,
    fovDeg: number
  ): GeoPosition[] {
    return [
      apex,
      Geo.destination(apex, headingDeg - fovDeg / 2.0, rangeM),
      Geo.destination(apex, headingDeg, rangeM * 1.1),
      Geo.destination(apex, headingDeg + fovDeg / 2.0, rangeM),
    ];
  }

  private daysBetween(lastSeen: Date, now: Date): Date[] {
    const days: Date[] = [];
    const current = new Date(Date.UTC(lastSeen.getUTCFullYear(), lastSeen.getUTCMonth(), lastSeen.getUTCDate()));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    let guard = 0;
    while (current.getTime() <= end.getTime() && guard < 60) {
      days.push(new Date(current));
      current.setUTCDate(current.getUTCDate() + 1);
      guard++;
    }
    return days;
  }

  private inWindow(at: Date, lastSeen: Date, now: Date): boolean {
    return at.getTime() >= lastSeen.getTime() && at.getTime() <= now.getTime();
  }

  private seedOf(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0;
    }
    return hash;
  }

  private round1(val: number): number {
    return Math.round(val * 10) / 10;
  }
}
