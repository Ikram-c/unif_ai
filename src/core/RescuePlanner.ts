import {
  Confidence,
  DataSourceAvailability,
  DataSourceKind,
  Observation,
  Rescue,
  SearchDataBundle,
  SearchPlan,
  SearchWindowRequest,
} from '../types';
import { EquipmentAssessor } from './EquipmentAssessor';
import { RegionScorer } from './RegionScorer';
import { defaultSarConfig, SarConfig } from './SarConfig';
import { SearchWindowCalculator, TimeFormat } from './TimeFormat';
import { TeamSizer } from './TeamSizer';
import { WanderRadiusModel } from './WanderRadiusModel';

export class RescuePlanner {
  private radiusModel: WanderRadiusModel;
  private scorer: RegionScorer;
  private assessor: EquipmentAssessor;
  private sizer: TeamSizer;

  constructor(private config: SarConfig = defaultSarConfig) {
    this.radiusModel = new WanderRadiusModel(config);
    this.scorer = new RegionScorer(config);
    this.assessor = new EquipmentAssessor(config);
    this.sizer = new TeamSizer(config);
  }

  /**
   * The query bounded by the 95 percent radius at [now].
   */
  request(rescue: Rescue, now: Date): SearchWindowRequest {
    const lastSeen = TimeFormat.parse(rescue.last_seen_utc);
    const elapsed = SearchWindowCalculator.elapsedMinutes(lastSeen, now);
    return {
      rescue_id: rescue.id,
      pin: rescue.last_known_location,
      last_seen_utc: TimeFormat.format(lastSeen),
      now_utc: TimeFormat.format(now),
      travel_mode: rescue.travel_mode,
      radius_m: this.radiusModel.outerRadiusM(rescue.travel_mode, elapsed, rescue.subject),
    };
  }

  /**
   * Scores [bundle] for [rescue] at [now].
   */
  plan(rescue: Rescue, bundle: SearchDataBundle, now: Date): SearchPlan {
    const lastSeen = TimeFormat.parse(rescue.last_seen_utc);
    const window = SearchWindowCalculator.compute(lastSeen, now);
    const rings = this.radiusModel.rings(rescue.travel_mode, window.elapsed_minutes, rescue.subject);
    const scored = this.scorer.score(
      rescue.last_known_location,
      rings,
      bundle.cells,
      rescue.travel_mode
    );
    const regions = this.scorer.rank(scored);
    const sectors = this.scorer.sectors(scored);
    const sources = this.groupSources(bundle.observations, lastSeen, now);
    const equipment = this.assessor.assess(
      bundle.weather,
      window.elapsed_minutes,
      rescue.travel_mode
    );
    const availableCount = sources.filter((s) => s.available).length;
    const team = this.sizer.estimate(regions, equipment, availableCount, bundle.weather.source);

    return {
      generated_at_utc: TimeFormat.format(now),
      window,
      rings,
      regions,
      sectors,
      data_sources: sources,
      weather: bundle.weather,
      equipment,
      team,
      confidence: this.overallConfidence(availableCount, regions.length, bundle.cell_source),
      cell_source: bundle.cell_source,
    };
  }

  /**
   * One entry per source kind, keeping only observations inside the window, newest first.
   */
  groupSources(
    observations: Observation[],
    lastSeen: Date,
    now: Date
  ): DataSourceAvailability[] {
    const kinds: DataSourceKind[] = ['SATELLITE', 'DASHCAM', 'UAV'];
    return kinds.map((kind) => {
      const inWindow = observations
        .filter((o) => o.source === kind && this.isInWindow(o.observed_at_utc, lastSeen, now))
        .sort(
          (a, b) =>
            new Date(b.observed_at_utc).getTime() - new Date(a.observed_at_utc).getTime()
        );
      return {
        source: kind,
        available: inWindow.length > 0,
        observations: inWindow,
      };
    });
  }

  private isInWindow(observedAtUtc: string, lastSeen: Date, now: Date): boolean {
    const observed = TimeFormat.parseOrNull(observedAtUtc);
    if (!observed) return false;
    return observed.getTime() >= lastSeen.getTime() && observed.getTime() <= now.getTime();
  }

  private overallConfidence(
    sourcesAvailable: number,
    regionCount: number,
    cellSource: string
  ): Confidence {
    if (regionCount === 0) return 'LOW';
    if (sourcesAvailable >= 2 && cellSource === 'h3') return 'HIGH';
    if (sourcesAvailable >= 1) return 'MEDIUM';
    return 'LOW';
  }
}
