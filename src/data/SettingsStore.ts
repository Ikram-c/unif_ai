import { AppSettings } from '../types';

const SETTINGS_KEY = 'srportal_settings';

export const defaultSettings: AppSettings = {
  baseUrl: 'http://localhost:8000/',
  forceDemo: true, // Default to demo mode for standalone browser preview
  timeZone: 'UTC',
  retentionYears: 3, // 3-year 2 CFR 200.334 audit retention
  activeMapPack: 'Bannau map pack',
  deviceTag: 'ABER-04',
  darkMode: false,
};

export class SettingsStore {
  private currentSettings: AppSettings;
  private listeners: Array<(s: AppSettings) => void> = [];

  constructor() {
    this.currentSettings = this.load();
  }

  get settings(): AppSettings {
    return this.currentSettings;
  }

  load(): AppSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (data) {
        return { ...defaultSettings, ...JSON.parse(data) };
      }
    } catch {
      // ignore
    }
    return defaultSettings;
  }

  update(fn: (s: AppSettings) => AppSettings): AppSettings {
    this.currentSettings = fn(this.currentSettings);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.currentSettings));
    } catch {
      // ignore
    }
    this.listeners.forEach((l) => l(this.currentSettings));
    return this.currentSettings;
  }

  subscribe(listener: (s: AppSettings) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

export const settingsStore = new SettingsStore();
