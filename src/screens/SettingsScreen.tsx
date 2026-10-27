import React, { useState } from 'react';
import { ArrowLeft, Server, RefreshCw } from 'lucide-react';
import { SectionCard, SrScaffold } from '../components/Common';
import { rescueRepository } from '../data/RescueRepository';
import { settingsStore } from '../data/SettingsStore';

interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const [settings, setSettings] = useState(settingsStore.settings);
  const [urlDraft, setUrlDraft] = useState(settings.baseUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const timeZones = ['UTC', 'Europe/London', 'Local'];

  const handleSaveAndTest = async () => {
    setTesting(true);
    settingsStore.update((s) => ({ ...s, baseUrl: urlDraft.trim() }));
    setSettings(settingsStore.settings);
    const result = await rescueRepository.checkHealth();
    setTestResult(result.detail);
    setTesting(false);
  };

  const handleToggleDemo = async (checked: boolean) => {
    settingsStore.update((s) => ({ ...s, forceDemo: checked }));
    setSettings(settingsStore.settings);
    const result = await rescueRepository.checkHealth();
    setTestResult(result.detail);
  };

  const handleSetTimeZone = (tz: string) => {
    settingsStore.update((s) => ({ ...s, timeZone: tz }));
    setSettings(settingsStore.settings);
  };

  return (
    <SrScaffold
      topBar={
        <div className="w-full flex items-center gap-3 px-4 py-3 bg-[#5B5B5B] border-b border-white/10 shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="p-1 text-white hover:text-[#D9D9D9] transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-white text-lg font-bold">Settings</h2>
        </div>
      }
    >
      <div className="flex-1 overflow-y-auto p-4 max-w-xl mx-auto w-full flex flex-col gap-4">
        {/* 1. Cloud Server Configuration */}
        <SectionCard title="Cloud server">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-[#D9D9D9] font-medium">Base URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="http://localhost:8000/"
                className="flex-1 bg-[#2B2B2B] text-white px-3 py-2 rounded-lg border border-white/20 text-sm outline-none focus:border-[#6B5AA6]"
              />
            </div>

            <div className="flex flex-wrap gap-2 mt-1">
              <button
                type="button"
                onClick={handleSaveAndTest}
                disabled={testing}
                className="bg-[#E6DEF5] text-[#141414] font-bold text-xs px-3.5 py-1.5 rounded-lg hover:bg-white active:scale-95 transition-all shadow flex items-center gap-1.5"
              >
                {testing && <RefreshCw size={12} className="animate-spin" />}
                <span>Save & test</span>
              </button>
              <button
                type="button"
                onClick={() => setUrlDraft('http://localhost:8000/')}
                className="bg-[#2B2B2B] text-white border border-white/20 text-xs px-3 py-1.5 rounded-lg hover:bg-[#323232] transition-colors"
              >
                Localhost default
              </button>
            </div>

            {testResult && (
              <p className="text-xs text-[#F2D06B] font-medium mt-1">{testResult}</p>
            )}

            <p className="text-[11px] text-[#D9D9D9]/70 leading-relaxed mt-1">
              The cloud server indexes satellite scenes, UAV flights and dashcam GPX-tagged
              frames. When offline, the app seamlessly runs full offline models.
            </p>
          </div>
        </SectionCard>

        {/* 2. Demo Mode Switch */}
        <SectionCard title="Demo mode">
          <div className="flex items-center justify-between py-1">
            <div className="flex flex-col">
              <span className="text-white text-sm font-semibold">Force demo data</span>
              <span className="text-[#D9D9D9] text-xs">
                Ignore remote server and use bundled Welsh datasets
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.forceDemo}
                onChange={(e) => handleToggleDemo(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#2B2B2B] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34C759]" />
            </label>
          </div>
        </SectionCard>

        {/* 3. Default Time Zone */}
        <SectionCard title="Default time zone">
          <div className="flex gap-2 py-1">
            {timeZones.map((tz) => (
              <button
                key={tz}
                type="button"
                onClick={() => handleSetTimeZone(tz)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                  settings.timeZone === tz
                    ? 'bg-[#6B5AA6] text-white border-[#E6DEF5]'
                    : 'bg-[#2B2B2B] text-[#D9D9D9] border-white/10 hover:bg-[#323232]'
                }`}
              >
                {tz}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* 4. Architectural Explanation */}
        <SectionCard title="How the model works">
          <p className="text-xs text-[#D9D9D9] leading-relaxed">
            <strong>Pin + confirmed last-seen time</strong> establish the search window (
            <em>now minus last seen</em>).
          </p>
          <p className="text-xs text-[#D9D9D9] leading-relaxed mt-1">
            The window bounds a metadata query across indexed satellite scenes, UAV flights and
            dashcam passes; each hit stores the OME-Zarr store and frame index so the small-object
            detector opens only that specific chunk.
          </p>
          <p className="text-xs text-[#D9D9D9] leading-relaxed mt-1">
            The travel mode and subject profile size the wander radius rings, hexagonal cells inside
            are scored via 2D Gaussian decay with terrain weighting, weather at the pin determines
            which equipment can deploy, and sweep rates calculate search party sizing.
          </p>
        </SectionCard>

        <div className="text-center py-2 text-xs text-white/50">
          SR Portal MVP · Designed by AberTech
        </div>
      </div>
    </SrScaffold>
  );
};
