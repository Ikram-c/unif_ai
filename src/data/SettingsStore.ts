import { AppSettings } from '../types';

const SETTINGS_KEY = 'srportal_settings_v3';

export const defaultSettings: AppSettings = {
  baseUrl: 'http://localhost:8000/',
  forceDemo: true, // Default to demo mode for standalone browser preview
  timeZone: 'UTC',
  retentionYears: 3, // 3-year 2 CFR 200.334 audit retention
  activeMapPack: 'Bannau map pack',
  deviceTag: 'ABER-04',
  darkMode: false,
  uiScale: 'standard', // Clean default scale with optional foul-weather scaling
  lightingCondition: 'daylight-field', // Balanced high-contrast field theme by default
  gloveMode: true, // 44x44pt tactile touch targets
};

export function applyFieldErgonomicsToDOM(settings: AppSettings): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.uiScale = settings.uiScale || 'standard';
  root.dataset.lighting = settings.lightingCondition || 'daylight-field';
  root.dataset.gloveMode = String(settings.gloveMode !== false);
  root.dataset.darkMode = String(Boolean(settings.darkMode));
}

export class SettingsStore {
  private currentSettings: AppSettings;
  private listeners: Array<(s: AppSettings) => void> = [];

  constructor() {
    this.currentSettings = this.load();
    applyFieldErgonomicsToDOM(this.currentSettings);
  }

  get settings(): AppSettings {
    return this.currentSettings;
  }

  load(): AppSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...defaultSettings,
          ...parsed,
          uiScale: parsed.uiScale || defaultSettings.uiScale,
          lightingCondition: parsed.lightingCondition || defaultSettings.lightingCondition,
          gloveMode: parsed.gloveMode !== undefined ? parsed.gloveMode : defaultSettings.gloveMode,
        };
      }
    } catch {
      // ignore
    }
    return defaultSettings;
  }

  update(fn: (s: AppSettings) => AppSettings): AppSettings {
    this.currentSettings = fn(this.currentSettings);
    applyFieldErgonomicsToDOM(this.currentSettings);
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
