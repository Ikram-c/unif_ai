import { GeoPosition, RadiusRing, SearchCell, SearchRegion, SectorSummary, Terrain, TravelMode } from '../types';
import { Geo } from './Geo';
import { defaultSarConfig, SarConfig } from './SarConfig';

export interface ScoredCell {
  cell: SearchCell;
  probability: number;
  distanceM: number;
  sector: string;
}

export class RegionScorer {
  constructor(private config: SarConfig = defaultSarConfig) {}

  score(
    pin: GeoPosition,
    rings: RadiusRing[],
    cells: SearchCell[],
    mode: TravelMode
  ): ScoredCell[] {
    if (cells.length === 0) return [];

    const p50 =
      rings.find((r) => r.probability === 0.5)?.radius_m ??
      Math.min(...rings.map((r) => r.radius_m));

    const sigma = Math.max(1.0, p50 * this.config.scoring.sigmaOverP50);
    const weights =
      mode === 'VEHICLE'
        ? this.config.scoring.vehicleTerrainWeights
        : this.config.scoring.terrainWeights;

    const raw = cells.map((cell) => {
      const distance = Geo.distanceM(pin, cell.centre);
      const decay = Math.exp(-0.5 * (distance / sigma) ** 2);
      const terrain = weights[cell.terrain] ?? 1.0;
      const weight = decay * terrain * cell.area_km2;
      return { cell, weight, distance };
    });

    const total = raw.reduce((sum, item) => sum + item.weight, 0);
    if (total <= 0) return [];

    return raw.map(({ cell, weight, distance }) => ({
      cell,
      probability: weight / total,
      distanceM: distance,
      sector: Geo.sector(Geo.bearingDeg(pin, cell.centre)),
    }));
  }

  rank(scored: ScoredCell[]): SearchRegion[] {
    const sorted = [...scored].sort((a, b) => b.probability - a.probability);
    const limit = Math.min(this.config.scoring.maxRegions, sorted.length);
    const regions: SearchRegion[] = [];
    let cumulative = 0.0;

    for (let i = 0; i < limit; i++) {
      const entry = sorted[i];
      cumulative += entry.probability;
      regions.push({
        cell: entry.cell,
        rank: i + 1,
        score: entry.probability,
        cumulative_probability: Math.min(1.0, cumulative),
        sector: entry.sector,
        distance_m: entry.distanceM,
      });
    }
    return regions;
  }

  sectors(scored: ScoredCell[]): SectorSummary[] {
    const grouped = new Map<string, ScoredCell[]>();
    for (const item of scored) {
      const list = grouped.get(item.sector) ?? [];
      list.push(item);
      grouped.set(item.sector, list);
    }

    const summaries: SectorSummary[] = [];
    grouped.forEach((entries, sector) => {
      const terrainCounts = new Map<Terrain, number>();
      for (const e of entries) {
        terrainCounts.set(e.cell.terrain, (terrainCounts.get(e.cell.terrain) ?? 0) + 1);
      }

      let dominantTerrain: Terrain = 'UNKNOWN';
      let maxCount = -1;
      terrainCounts.forEach((count, t) => {
        if (count > maxCount) {
          maxCount = count;
          dominantTerrain = t;
        }
      });

      const probability = entries.reduce((sum, e) => sum + e.probability, 0);
      const areaKm2 = entries.reduce((sum, e) => sum + e.cell.area_km2, 0);

      summaries.push({
        sector,
        probability,
        area_km2: areaKm2,
        dominant_terrain: dominantTerrain,
        cell_count: entries.length,
      });
    });

    return summaries.sort((a, b) => b.probability - a.probability);
  }
}
