import {
  DataSourceAvailability,
  Observation,
  Place,
  Rescue,
  SearchDataBundle,
  ServerHealth,
  ServerStatus,
} from '../types';
import { DemoDataset } from '../core/DemoDataset';
import { RescuePlanner } from '../core/RescuePlanner';
import { TimeFormat } from '../core/TimeFormat';
import { settingsStore } from './SettingsStore';

const RESCUES_KEY = 'srportal_rescues';

export class RescueRepository {
  private demo: DemoDataset;
  private planner: RescuePlanner;
  private rescues: Rescue[] = [];
  private serverStatus: ServerStatus = {
    state: 'DEMO',
    detail: 'Demo mode · Bundled datasets active',
  };
  private rescueListeners: Array<(rescues: Rescue[]) => void> = [];
  private statusListeners: Array<(status: ServerStatus) => void> = [];

  constructor() {
    this.demo = new DemoDataset();
    this.planner = new RescuePlanner();
    this.load();
    this.checkHealth();
  }

  get allRescues(): Rescue[] {
    return [...this.rescues];
  }

  get currentStatus(): ServerStatus {
    return { ...this.serverStatus };
  }

  get demoDataset(): DemoDataset {
    return this.demo;
  }

  subscribeRescues(fn: (rescues: Rescue[]) => void): () => void {
    this.rescueListeners.push(fn);
    fn(this.rescues);
    return () => {
      this.rescueListeners = this.rescueListeners.filter((l) => l !== fn);
    };
  }

  subscribeStatus(fn: (status: ServerStatus) => void): () => void {
    this.statusListeners.push(fn);
    fn(this.serverStatus);
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    this.rescueListeners.forEach((l) => l([...this.rescues]));
    try {
      localStorage.setItem(RESCUES_KEY, JSON.stringify(this.rescues));
    } catch {
      // ignore
    }
  }

  private notifyStatus() {
    this.statusListeners.forEach((l) => l({ ...this.serverStatus }));
  }

  load(): Rescue[] {
    try {
      const stored = localStorage.getItem(RESCUES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Rescue[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.rescues = parsed;
          return this.rescues;
        }
      }
    } catch {
      // fallback to sample rescues
    }

    // Seed sample cases
    const samples = this.demo.sampleRescues(new Date());
    // Run model for each sample rescue so they have complete initial plans
    this.rescues = samples.map((r) => {
      const bundle = this.demo.bundle(this.planner.request(r, new Date()));
      const plan = this.planner.plan(r, bundle, new Date());
      return { ...r, plan };
    });
    this.notify();
    return this.rescues;
  }

  find(id: string): Rescue | undefined {
    return this.rescues.find((r) => r.id === id);
  }

  async save(rescue: Rescue): Promise<Rescue> {
    const existingIndex = this.rescues.findIndex((r) => r.id === rescue.id);
    if (existingIndex >= 0) {
      this.rescues[existingIndex] = rescue;
    } else {
      this.rescues.unshift(rescue);
    }
    this.notify();

    // If online, optionally sync to remote
    if (this.serverStatus.state === 'ONLINE' && !settingsStore.settings.forceDemo) {
      try {
        const url = new URL(`rescues/${rescue.id}`, settingsStore.settings.baseUrl).toString();
        await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rescue),
        });
      } catch {
        // saved locally
      }
    }
    return rescue;
  }

  async runModel(rescue: Rescue, now: Date = new Date()): Promise<Rescue> {
    const request = this.planner.request(rescue, now);
    let bundle: SearchDataBundle;

    if (this.serverStatus.state === 'ONLINE' && !settingsStore.settings.forceDemo) {
      try {
        const url = new URL('search-window', settingsStore.settings.baseUrl).toString();
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        bundle = await res.json();
      } catch {
        bundle = this.demo.bundle(request);
      }
    } else {
      bundle = this.demo.bundle(request);
    }

    const plan = this.planner.plan(rescue, bundle, now);
    const updated: Rescue = {
      ...rescue,
      plan,
      status: 'ONGOING',
    };
    return this.save(updated);
  }

  async triggerDetection(rescueId: string, observationId: string): Promise<Rescue> {
    const rescue = this.find(rescueId);
    if (!rescue || !rescue.plan) throw new Error('Rescue not found');

    // Optimistically set to QUEUED
    let currentRescue = this.updateObservationStatus(rescue, observationId, 'QUEUED', 0);
    await this.save(currentRescue);

    // Transition to RUNNING shortly
    setTimeout(async () => {
      const r = this.find(rescueId);
      if (r) {
        currentRescue = this.updateObservationStatus(r, observationId, 'RUNNING', 0);
        await this.save(currentRescue);
      }
    }, 800);

    // Transition to DONE with candidates
    setTimeout(async () => {
      const r = this.find(rescueId);
      if (r) {
        const candidateCount = this.demo.detectionOutcome(observationId);
        currentRescue = this.updateObservationStatus(
          r,
          observationId,
          'DONE',
          candidateCount
        );
        await this.save(currentRescue);
      }
    }, 2200);

    return currentRescue;
  }

  private updateObservationStatus(
    rescue: Rescue,
    observationId: string,
    status: Observation['detection_status'],
    candidateCount: number
  ): Rescue {
    if (!rescue.plan) return rescue;
    const sources: DataSourceAvailability[] = rescue.plan.data_sources.map(
      (source: DataSourceAvailability) => ({
        ...source,
        observations: source.observations.map((obs: Observation) => {
          if (obs.id === observationId) {
            return {
              ...obs,
              detection_status: status,
              candidate_count: candidateCount,
            };
          }
          return obs;
        }),
      })
    );
    return {
      ...rescue,
      plan: {
        ...rescue.plan,
        data_sources: sources,
      },
    };
  }

  async complete(rescue: Rescue): Promise<Rescue> {
    return this.save({ ...rescue, status: 'COMPLETED' });
  }

  async reopen(rescue: Rescue): Promise<Rescue> {
    return this.save({ ...rescue, status: 'ONGOING' });
  }

  async geocode(query: string): Promise<Place[]> {
    if (this.serverStatus.state === 'ONLINE' && !settingsStore.settings.forceDemo) {
      try {
        const url = new URL(
          `geocode?q=${encodeURIComponent(query)}`,
          settingsStore.settings.baseUrl
        ).toString();
        const res = await fetch(url);
        if (res.ok) {
          return await res.json();
        }
      } catch {
        // fallback
      }
    }
    return this.demo.search(query);
  }

  async checkHealth(): Promise<ServerStatus> {
    if (settingsStore.settings.forceDemo) {
      this.serverStatus = {
        state: 'DEMO',
        detail: 'Demo mode · Standalone datasets active',
      };
      this.notifyStatus();
      return this.serverStatus;
    }

    this.serverStatus = {
      state: 'CHECKING',
      detail: 'Connecting to Cloud Server...',
    };
    this.notifyStatus();

    try {
      const url = new URL('health', settingsStore.settings.baseUrl).toString();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = (await res.json()) as ServerHealth;
        const totalRows = Object.values(data.db_rows || {}).reduce((a: number, b: number) => a + b, 0);
        this.serverStatus = {
          state: 'ONLINE',
          detail: `Connected to Cloud Server (v${data.version || '0.1.0'} · ${totalRows} indexed)`,
        };
      } else {
        this.serverStatus = {
          state: 'DEMO',
          detail: `Server responded with ${res.status} · Falling back to Demo datasets`,
        };
      }
    } catch {
      this.serverStatus = {
        state: 'DEMO',
        detail: 'Cloud Server offline · Using offline hex tiling & demo data',
      };
    }
    this.notifyStatus();
    return this.serverStatus;
  }
}

export const rescueRepository = new RescueRepository();
