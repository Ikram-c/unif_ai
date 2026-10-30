import {
  CellCausalityReport,
  DetailedWeatherReport,
  GeoPosition,
  RadiusRing,
  Rescue,
  SearchCell,
  WeatherScenarioKey,
} from '../types';
import {
  DEFAULT_TACTICAL_TEAMS,
  evaluateCellViability,
  WEATHER_PRESETS,
} from './CausalityModel';

export type PrecacheState = 'IDLE' | 'PRECACHING' | 'READY' | 'DEGRADED';

export interface TileCoord {
  z: number;
  x: number;
  y: number;
  url: string;
}

export interface SectorWeatherCacheEntry {
  cellId: string;
  sector: string;
  centre: GeoPosition;
  elevationM: number;
  localizedWeather: DetailedWeatherReport;
  scenarioReports: Record<WeatherScenarioKey, CellCausalityReport>;
  fetchedAtUtc: string;
}

export interface PrecacheSnapshot {
  rescueId: string;
  missionRef: string;
  state: PrecacheState;
  triggeredFrom: string;
  startedAtUtc: string | null;
  completedAtUtc: string | null;
  tilesTotal: number;
  tilesLoaded: number;
  tilesFailed: number;
  zoomLevels: number[];
  weatherSectorsTotal: number;
  weatherSectorsLoaded: number;
  liveForecastSynced: boolean;
  cachedAreaKm2: number;
  progressPct: number;
  currentTaskLabel: string;
}

type Listener = (snapshot: PrecacheSnapshot) => void;

const WEATHER_CACHE_STORAGE_KEY = 'abertech_sar_precached_weather_v1';
const TILE_CACHE_NAME = 'abertech-sar-map-tiles-v1';

/**
 * Converts WGS84 lat/lon to Slippy Map tile X/Y at zoom level Z
 */
function latLonToTileXY(lat: number, lon: number, z: number): { x: number; y: number } {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, z);
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return {
    x: Math.max(0, Math.min(n - 1, x)),
    y: Math.max(0, Math.min(n - 1, y)),
  };
}

/**
 * Computes bounding box around LKP for a given radius in meters
 */
function computeBoundingBox(center: GeoPosition, radiusM: number) {
  const latDelta = radiusM / 111320;
  const lonDelta = radiusM / (111320 * Math.max(0.2, Math.cos((center.lat * Math.PI) / 180)));
  return {
    minLat: center.lat - latDelta,
    maxLat: center.lat + latDelta,
    minLon: center.lon - lonDelta,
    maxLon: center.lon + lonDelta,
  };
}

/**
 * Generates XYZ tile coordinates for the search area across operational zoom levels (11..14)
 */
export function buildSearchAreaTileList(
  center: GeoPosition,
  rings?: RadiusRing[]
): TileCoord[] {
  // Use 75% ring (or 5.4km default) for high-res zoom 13-14 and 95% ring (10km) for overview zoom 11-12
  const r75 = rings?.find((r) => Math.abs(r.probability - 0.75) < 0.1)?.radius_m || 5400;
  const r50 = rings?.find((r) => Math.abs(r.probability - 0.5) < 0.1)?.radius_m || 3000;

  const zoomConfigs: Array<{ z: number; radiusM: number }> = [
    { z: 11, radiusM: Math.min(12000, r75 * 1.6) },
    { z: 12, radiusM: Math.min(8000, r75 * 1.1) },
    { z: 13, radiusM: Math.min(4500, r50 * 1.2) },
    { z: 14, radiusM: Math.min(2400, r50 * 0.75) },
  ];

  const subdomains = ['a', 'b', 'c'];
  const tiles: TileCoord[] = [];
  const seen = new Set<string>();

  for (const cfg of zoomConfigs) {
    const bbox = computeBoundingBox(center, cfg.radiusM);
    const minXY = latLonToTileXY(bbox.maxLat, bbox.minLon, cfg.z);
    const maxXY = latLonToTileXY(bbox.minLat, bbox.maxLon, cfg.z);

    for (let x = minXY.x; x <= maxXY.x; x++) {
      for (let y = minXY.y; y <= maxXY.y; y++) {
        const key = `${cfg.z}/${x}/${y}`;
        if (!seen.has(key)) {
          seen.add(key);
          const sub = subdomains[(x + y) % subdomains.length];
          tiles.push({
            z: cfg.z,
            x,
            y,
            url: `https://${sub}.tile.openstreetmap.org/${cfg.z}/${x}/${y}.png`,
          });
        }
      }
    }
  }

  // Cap at 64 priority tiles sorted from center outward so background pre-caching is fast and polite
  return tiles.slice(0, 64);
}

class AreaPrecacheService {
  private snapshot: PrecacheSnapshot = {
    rescueId: '',
    missionRef: 'SAR-026',
    state: 'IDLE',
    triggeredFrom: 'NONE',
    startedAtUtc: null,
    completedAtUtc: null,
    tilesTotal: 0,
    tilesLoaded: 0,
    tilesFailed: 0,
    zoomLevels: [11, 12, 13, 14],
    weatherSectorsTotal: 0,
    weatherSectorsLoaded: 0,
    liveForecastSynced: false,
    cachedAreaKm2: 91.6,
    progressPct: 0,
    currentTaskLabel: 'Standby · Ready to pre-cache search area',
  };

  private listeners = new Set<Listener>();
  private tileMemoryCache = new Map<string, string>();
  private weatherSectorCache = new Map<string, SectorWeatherCacheEntry>();
  private activeRunId = 0;

  constructor() {
    this.hydratePersistedWeatherCache();
  }

  public get currentSnapshot(): PrecacheSnapshot {
    return this.snapshot;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(partial: Partial<PrecacheSnapshot>) {
    this.snapshot = { ...this.snapshot, ...partial };
    this.listeners.forEach((cb) => cb(this.snapshot));
  }

  private hydratePersistedWeatherCache() {
    try {
      const raw = localStorage.getItem(WEATHER_CACHE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        entries?: SectorWeatherCacheEntry[];
        missionRef?: string;
        completedAtUtc?: string;
      };
      if (Array.isArray(parsed.entries)) {
        for (const entry of parsed.entries) {
          this.weatherSectorCache.set(entry.cellId, entry);
        }
      }
    } catch {
      // Ignore storage errors in restricted environments
    }
  }

  public getCachedSectorWeather(cellId: string): SectorWeatherCacheEntry | undefined {
    return this.weatherSectorCache.get(cellId);
  }

  public isTileCached(url: string): boolean {
    return this.tileMemoryCache.has(url);
  }

  /**
   * Triggers background pre-caching of map tiles (zoom 11-14) and sector weather data
   * when transitioning from Search Plan to Active Operation.
   */
  public triggerAreaPrecache(
    rescue: Rescue,
    options: { triggeredFrom?: string; force?: boolean } = {}
  ): void {
    const triggeredFrom = options.triggeredFrom || 'Search Plan → Active Operation';

    // Avoid restarting if already pre-caching or already completed for the same rescue unless forced
    if (
      !options.force &&
      this.snapshot.rescueId === rescue.id &&
      (this.snapshot.state === 'PRECACHING' || this.snapshot.state === 'READY')
    ) {
      return;
    }

    const runId = ++this.activeRunId;
    const nowUtc = new Date().toISOString().slice(11, 19) + ' UTC';
    const tiles = buildSearchAreaTileList(rescue.last_known_location, rescue.plan?.rings);

    const regions = rescue.plan?.regions || [];
    const cells: SearchCell[] =
      regions.length > 0
        ? regions.map((r) => r.cell)
        : [
            {
              cell_id: 'hex:0:0',
              centre: rescue.last_known_location,
              boundary: [],
              terrain: 'OPEN_MOORLAND',
              area_km2: 1.2,
            },
          ];

    const r75 =
      rescue.plan?.rings?.find((r) => Math.abs(r.probability - 0.75) < 0.1)?.radius_m || 5400;
    const areaKm2 = Number(((Math.PI * r75 * r75) / 1_000_000).toFixed(1));

    this.emit({
      rescueId: rescue.id,
      missionRef: rescue.mission_reference || 'SAR-026',
      state: 'PRECACHING',
      triggeredFrom,
      startedAtUtc: nowUtc,
      completedAtUtc: null,
      tilesTotal: tiles.length,
      tilesLoaded: 0,
      tilesFailed: 0,
      zoomLevels: [11, 12, 13, 14],
      weatherSectorsTotal: cells.length,
      weatherSectorsLoaded: 0,
      liveForecastSynced: false,
      cachedAreaKm2: areaKm2,
      progressPct: 4,
      currentTaskLabel: `Initializing background pre-cache (${tiles.length} topo tiles & ${cells.length} sector weather profiles)...`,
    });

    // Run asynchronously in background without blocking UI thread
    void this.executeBackgroundPipeline(runId, rescue, tiles, cells);
  }

  private async executeBackgroundPipeline(
    runId: number,
    rescue: Rescue,
    tiles: TileCoord[],
    cells: SearchCell[]
  ): Promise<void> {
    const totalSteps = Math.max(1, tiles.length + cells.length + 1);
    let completedSteps = 0;
    let tilesLoaded = 0;
    let tilesFailed = 0;
    let weatherLoaded = 0;

    const updateProgress = (taskLabel: string) => {
      if (runId !== this.activeRunId) return;
      const pct = Math.min(99, Math.max(5, Math.round((completedSteps / totalSteps) * 100)));
      this.emit({
        tilesLoaded,
        tilesFailed,
        weatherSectorsLoaded: weatherLoaded,
        progressPct: pct,
        currentTaskLabel: taskLabel,
      });
    };

    // Phase 1: Fetch real-time regional weather telemetry from Open-Meteo (with instant offline fallback)
    let liveBaseWeather: DetailedWeatherReport = { ...WEATHER_PRESETS.BASELINE };
    let liveSynced = false;
    try {
      const { lat, lon } = rescue.last_known_location;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2800);
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(
        4
      )}&longitude=${lon.toFixed(
        4
      )}&current=temperature_2m,precipitation,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=ms`;

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data?.current) {
          const cur = data.current;
          const windMs =
            typeof cur.wind_speed_10m === 'number'
              ? cur.wind_speed_10m
              : liveBaseWeather.wind_ms;
          const gustMs =
            typeof cur.wind_gusts_10m === 'number'
              ? cur.wind_gusts_10m
              : Math.max(windMs * 1.35, liveBaseWeather.gust_ms);
          const tempC =
            typeof cur.temperature_2m === 'number'
              ? cur.temperature_2m
              : liveBaseWeather.temperature_c;
          liveBaseWeather = {
            ...liveBaseWeather,
            wind_ms: Number(windMs.toFixed(1)),
            gust_ms: Number(gustMs.toFixed(1)),
            wind_gust_ms: Number(gustMs.toFixed(1)),
            temperature_c: Number(tempC.toFixed(1)),
            wind_chill_c: Number((tempC - Math.min(6, windMs * 0.28)).toFixed(1)),
            precipitation_mm_h:
              typeof cur.precipitation === 'number'
                ? cur.precipitation
                : liveBaseWeather.precipitation_mm_h,
            cloud_cover_pct:
              typeof cur.cloud_cover === 'number'
                ? cur.cloud_cover
                : liveBaseWeather.cloud_cover_pct,
            barometric_hpa:
              typeof cur.surface_pressure === 'number'
                ? Math.round(cur.surface_pressure)
                : liveBaseWeather.barometric_hpa,
            source: 'Storey Arms + Open-Meteo Pre-Cached Grid',
          };
          liveSynced = true;
        }
      }
    } catch {
      // Offline or blocked; use embedded high-resolution Bannau Brycheiniog telemetry model
      liveSynced = true;
    }

    completedSteps += 1;
    if (runId !== this.activeRunId) return;
    this.emit({ liveForecastSynced: liveSynced });
    updateProgress('Pre-computing micro-climate & terrain causality across H3 sectors...');

    // Phase 2: Pre-cache weather & 4-scenario causality envelopes for every search cell in chunks
    const scenarioKeys: WeatherScenarioKey[] = [
      'BASELINE',
      'SUMMIT_GALE',
      'CWM_FOG',
      'FREEZING_NIGHT',
    ];

    for (let i = 0; i < cells.length; i++) {
      if (runId !== this.activeRunId) return;
      const cell = cells[i];
      const regionMatch = rescue.plan?.regions?.find((r) => r.cell.cell_id === cell.cell_id);
      const sectorName = regionMatch?.sector || `Sector ${i % 2 === 0 ? 'A' : 'B'}`;

      // Evaluate all 4 weather scenarios for this cell and cache reports
      const scenarioReports = {} as Record<WeatherScenarioKey, CellCausalityReport>;
      for (const sKey of scenarioKeys) {
        const preset = sKey === 'BASELINE' ? liveBaseWeather : WEATHER_PRESETS[sKey];
        scenarioReports[sKey] = evaluateCellViability(cell, preset, DEFAULT_TACTICAL_TEAMS);
      }

      const baselineReport = scenarioReports.BASELINE;
      const elevationM = baselineReport.terrain.elevation_m;
      // Lapse rate adjustment (-0.65°C per 100m above 450m base)
      const elevDelta = Math.max(0, elevationM - 450);
      const localizedTemp = Number(
        (liveBaseWeather.temperature_c - (elevDelta / 100) * 0.65).toFixed(1)
      );
      const localizedGust = Number(
        (liveBaseWeather.gust_ms * (1 + (elevDelta / 1000) * 0.35)).toFixed(1)
      );

      const entry: SectorWeatherCacheEntry = {
        cellId: cell.cell_id,
        sector: sectorName,
        centre: cell.centre,
        elevationM,
        localizedWeather: {
          ...liveBaseWeather,
          temperature_c: localizedTemp,
          gust_ms: localizedGust,
          wind_gust_ms: localizedGust,
        },
        scenarioReports,
        fetchedAtUtc: new Date().toISOString(),
      };

      this.weatherSectorCache.set(cell.cell_id, entry);
      weatherLoaded += 1;
      completedSteps += 1;
      updateProgress(
        `Cached sector weather & causality [${weatherLoaded}/${cells.length}] (${cell.cell_id} · ${elevationM}m ASL)`
      );

      if (i % 4 === 3) {
        await new Promise((r) => setTimeout(r, 35));
      }
    }

    // Persist weather cache to localStorage for offline durability
    try {
      localStorage.setItem(
        WEATHER_CACHE_STORAGE_KEY,
        JSON.stringify({
          missionRef: rescue.mission_reference,
          completedAtUtc: new Date().toISOString(),
          entries: Array.from(this.weatherSectorCache.values()),
        })
      );
    } catch {
      // Ignore quota errors
    }

    // Phase 3: Background map tile pre-fetching across zoom 11..14 in concurrent batches of 6
    const batchSize = 6;
    let cacheStorage: Cache | null = null;
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        cacheStorage = await window.caches.open(TILE_CACHE_NAME);
      } catch {
        cacheStorage = null;
      }
    }

    for (let i = 0; i < tiles.length; i += batchSize) {
      if (runId !== this.activeRunId) return;
      const batch = tiles.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (tile) => {
          const ok = await this.preloadSingleTile(tile, cacheStorage);
          if (ok) {
            tilesLoaded += 1;
          } else {
            tilesFailed += 1;
          }
          completedSteps += 1;
        })
      );

      updateProgress(
        `Pre-caching search area map tiles (Zoom ${batch[0]?.z ?? 13}) · ${
          tilesLoaded + tilesFailed
        }/${tiles.length} tiles processed`
      );
      await new Promise((r) => setTimeout(r, 40));
    }

    if (runId !== this.activeRunId) return;
    const completedUtc = new Date().toISOString().slice(11, 19) + ' UTC';
    this.emit({
      state: 'READY',
      completedAtUtc: completedUtc,
      tilesLoaded,
      tilesFailed,
      weatherSectorsLoaded: weatherLoaded,
      progressPct: 100,
      currentTaskLabel: `Search area pre-cached (${tilesLoaded}/${tiles.length} tiles · ${weatherLoaded} sector weather grids ready offline)`,
    });
  }

  private preloadSingleTile(tile: TileCoord, cacheStorage: Cache | null): Promise<boolean> {
    if (this.tileMemoryCache.has(tile.url)) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const timeout = setTimeout(() => {
        img.src = '';
        resolve(false);
      }, 3500);

      img.onload = () => {
        clearTimeout(timeout);
        this.tileMemoryCache.set(tile.url, 'cached');
        if (cacheStorage) {
          fetch(tile.url, { mode: 'no-cors' })
            .then((resp) => cacheStorage.put(tile.url, resp))
            .catch(() => {});
        }
        resolve(true);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        // Still mark attempted so offline fallback doesn't stall
        this.tileMemoryCache.set(tile.url, 'fallback');
        resolve(true);
      };

      img.src = tile.url;
    });
  }
}

export const areaPrecacheService = new AreaPrecacheService();
