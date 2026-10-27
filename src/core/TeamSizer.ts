import { Confidence, EquipmentAssessment, SearchRegion, TeamEstimate } from '../types';
import { defaultSarConfig, SarConfig } from './SarConfig';

export class TeamSizer {
  constructor(private config: SarConfig = defaultSarConfig) {}

  estimate(
    regions: SearchRegion[],
    equipment: EquipmentAssessment[],
    sourcesAvailable: number,
    weatherSource: string
  ): TeamEstimate {
    const params = this.config.team;
    const selected = this.selectRegions(
      regions,
      params.coverageTargetProbability,
      params.priorityCells
    );
    const areaKm2 = selected.reduce((sum, r) => sum + r.cell.area_km2, 0);
    const covered = selected[selected.length - 1]?.cumulative_probability ?? 0.0;

    const uavViable = equipment.some(
      (e) => e.viable && (e.kind === 'UAV_VISUAL' || e.kind === 'UAV_THERMAL')
    );
    const groundShare = uavViable ? 1.0 - params.uavAreaShare : 1.0;

    const searcherHours = selected.reduce((sum, region) => {
      const rate =
        params.coverageKm2PerSearcherHour[region.cell.terrain] ??
        params.coverageKm2PerSearcherHour['UNKNOWN'] ??
        0.1;
      return sum + (region.cell.area_km2 * groundShare) / Math.max(0.001, rate);
    }, 0);

    const raw = Math.ceil(searcherHours / Math.max(0.5, params.targetHours));
    const searchers = Math.min(params.maxSearchers, Math.max(params.minSearchers, raw));
    const teams = Math.max(
      1,
      Math.ceil(searchers / Math.max(1, params.teamSize))
    );

    let confidence: Confidence = 'LOW';
    if (sourcesAvailable >= 2 && weatherSource !== 'demo') {
      confidence = 'HIGH';
    } else if (sourcesAvailable >= 1 || weatherSource !== 'demo') {
      confidence = 'MEDIUM';
    }

    let rationale = `Priority: ${selected.length} cells, ${areaKm2.toFixed(1)} km2, holding ${(covered * 100).toFixed(0)}% of the probability mass. `;
    if (uavViable) {
      rationale += `A UAV takes ${(params.uavAreaShare * 100).toFixed(0)}% of that area. `;
    }
    rationale += `Hasty sweep at terrain rates needs ${searcherHours.toFixed(0)} searcher-hours; ${params.targetHours.toFixed(0)} h target period.`;
    if (raw > params.maxSearchers) {
      rationale += ` Capped at ${params.maxSearchers}: phase the remaining cells into the next period.`;
    }

    return {
      searchers,
      teams,
      search_area_km2: areaKm2,
      target_hours: params.targetHours,
      confidence,
      rationale,
    };
  }

  private selectRegions(
    regions: SearchRegion[],
    target: number,
    maxCells: number
  ): SearchRegion[] {
    const selected: SearchRegion[] = [];
    for (const region of regions) {
      if (selected.length >= Math.max(1, maxCells)) break;
      selected.push(region);
      if (region.cumulative_probability >= target) break;
    }
    return selected;
  }
}
