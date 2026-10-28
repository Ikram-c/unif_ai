import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Server,
  RefreshCw,
  HardDrive,
  ShieldCheck,
  Moon,
  Sun,
  CheckCircle2,
  ZoomIn,
  Hand,
  Eye,
  CloudRain,
} from 'lucide-react';
import { Card, PrimaryButton, SecondaryButton, StepHeader } from '../components/Common';
import { rescueRepository } from '../data/RescueRepository';
import { settingsStore } from '../data/SettingsStore';
import { FieldLightingCondition, FieldUiScale } from '../types';

interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const [settings, setSettings] = useState(settingsStore.settings);
  const [urlDraft, setUrlDraft] = useState(settings.baseUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    return settingsStore.subscribe(setSettings);
  }, []);

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

  const handleSetUiScale = (uiScale: FieldUiScale) => {
    settingsStore.update((s) => ({ ...s, uiScale }));
  };

  const handleSetLighting = (lightingCondition: FieldLightingCondition) => {
    settingsStore.update((s) => ({
      ...s,
      lightingCondition,
      darkMode: lightingCondition === 'night-vision',
    }));
  };

  const handleToggleGloveMode = (gloveMode: boolean) => {
    settingsStore.update((s) => ({ ...s, gloveMode }));
  };

  return (
    <div className="flex-1 flex flex-col bg-[#EDF2EF] overflow-y-auto hig-scroll-view">
      <StepHeader stepNumber="Settings" stepTitle="Display, Readability & Accessibility" />

      <div className="p-4 sm:p-6 hig-safe-area max-w-3xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#081820] tracking-tight">
              Display, Readability &amp; Hardware
            </h1>
            <p className="text-sm text-[#1E3831] mt-0.5">
              Device tag {settings.deviceTag} · Dynamic Type scaling, WCAG ≥ 4.5:1 contrast, and ≥ 44pt touch targets
            </p>
          </div>
          <SecondaryButton onClick={onBack} icon={<ArrowLeft size={18} />}>
            Back to Operation
          </SecondaryButton>
        </div>

        {/* 1. Dynamic Type & Foul Weather Font Scaling Card */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#CBD8D4] pb-3">
            <div className="flex items-center gap-2">
              <CloudRain size={20} className="text-[#0B6758]" />
              <h2 className="text-base font-bold text-[#081820]">
                1. Dynamic Type &amp; Field UI Scale
              </h2>
            </div>
            <span className="text-xs font-mono font-bold bg-[#E1ECE8] text-[#064E3B] px-3 py-1 rounded-full border border-[#A7C7BE]">
              Active: {(settings.uiScale || 'weather-lg').toUpperCase()}
            </span>
          </div>

          <p className="text-sm text-[#1E3831] leading-relaxed">
            Scales typography (≥ 17pt baseline), coordinate readouts, badges, and button targets across all views while retaining visual hierarchy.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'standard' as FieldUiScale,
                title: '100% Standard (17pt)',
                sub: '17px base · Basecamp & desktop command',
              },
              {
                id: 'weather-lg' as FieldUiScale,
                title: '115% Foul Weather',
                sub: '18px base · Rain, mist & poor light (Default)',
              },
              {
                id: 'storm-xl' as FieldUiScale,
                title: '130% Storm XL',
                sub: '19.5px base · Heavy gale & winter gloves',
              },
            ].map((item) => {
              const active = (settings.uiScale || 'weather-lg') === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSetUiScale(item.id)}
                  className={`min-h-[84px] p-4 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                    active
                      ? 'border-[#0B6758] bg-[#E1ECE8] text-[#064E3B] ring-2 ring-[#0B6758]/20'
                      : 'border-[#B8C9C3] bg-[#F6F9F7] text-[#081820] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-bold flex items-center gap-1.5">
                      <ZoomIn size={16} />
                      <span>{item.title}</span>
                    </span>
                    {active && <CheckCircle2 size={18} className="text-[#0B6758] shrink-0" />}
                  </div>
                  <span className="text-xs font-mono text-[#1E3831]">
                    {item.sub}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Wet Screen / Winter Glove Touch Mode */}
          <div className="pt-3 border-t border-[#CBD8D4]">
            <label className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-[#F6F9F7] border border-[#CBD8D4] cursor-pointer">
              <div className="flex items-start gap-3">
                <Hand size={20} className="text-[#0B6758] shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-bold text-[#081820] block">
                    Enforce 44×44pt Touch Targets (Glove &amp; Wet Screen Mode)
                  </span>
                  <span className="text-xs text-[#1E3831]">
                    Maintains generous padding around tap areas and high-visibility focus rings.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.gloveMode !== false}
                onChange={(e) => handleToggleGloveMode(e.target.checked)}
                className="h-6 w-6 rounded accent-[#0B6758] shrink-0 cursor-pointer"
              />
            </label>
          </div>
        </Card>

        {/* 2. Contrast & Ambient Lighting Preset */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#CBD8D4] pb-3">
            <div className="flex items-center gap-2">
              <Eye size={20} className="text-[#0B6758]" />
              <h2 className="text-base font-bold text-[#081820]">
                2. Color &amp; Contrast Mode
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-[#0B6758]">CR ≥ 4.5:1 Verified</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleSetLighting('poor-light-hivis')}
              className={`min-h-[96px] p-4 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                (settings.lightingCondition || 'poor-light-hivis') === 'poor-light-hivis'
                  ? 'border-[#0B6758] bg-[#E1ECE8] text-[#064E3B] font-bold ring-2 ring-[#0B6758]/20'
                  : 'border-[#B8C9C3] bg-[#F6F9F7] text-[#081820] hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Eye size={18} />
                  <span className="text-sm font-bold">Hi-Vis Contrast</span>
                </div>
                {(settings.lightingCondition || 'poor-light-hivis') === 'poor-light-hivis' && (
                  <CheckCircle2 size={18} className="text-[#0B6758]" />
                )}
              </div>
              <span className="text-xs text-[#1E3831] font-normal">
                Reinforced borders and high-contrast slate typography for overcast, dusk &amp; rain.
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSetLighting('night-vision')}
              className={`min-h-[96px] p-4 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                settings.lightingCondition === 'night-vision'
                  ? 'border-[#88C070] bg-[#081820] text-[#88C070] font-bold'
                  : 'border-[#B8C9C3] bg-[#F6F9F7] text-[#081820] hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Moon size={18} />
                  <span className="text-sm font-bold">Night Ops Dark</span>
                </div>
                {settings.lightingCondition === 'night-vision' && (
                  <CheckCircle2 size={18} className="text-[#FACC15]" />
                )}
              </div>
              <span className="text-xs opacity-90 font-normal">
                Low-glare dark canvas with phosphor green telemetry for night operations.
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSetLighting('daylight-field')}
              className={`min-h-[96px] p-4 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                settings.lightingCondition === 'daylight-field'
                  ? 'border-[#0B6758] bg-[#E1ECE8] text-[#064E3B] font-bold ring-2 ring-[#0B6758]/20'
                  : 'border-[#B8C9C3] bg-[#F6F9F7] text-[#081820] hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Sun size={18} />
                  <span className="text-sm font-bold">Daylight Standard</span>
                </div>
                {settings.lightingCondition === 'daylight-field' && (
                  <CheckCircle2 size={18} className="text-[#0B6758]" />
                )}
              </div>
              <span className="text-xs text-[#1E3831] font-normal">
                Balanced light theme for clear upland daylight visibility.
              </span>
            </button>
          </div>
        </Card>

        {/* 3. Hardware & Map Pack Card */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#CBD8D4] pb-3">
            <HardDrive size={20} className="text-[#0B6758]" />
            <h2 className="text-base font-bold text-[#081820]">
              3. Assigned Field Hardware &amp; Offline Packs
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-[#F6F9F7] rounded-xl border border-[#CBD8D4]">
              <span className="text-[#1E3831] font-medium block">Device Hardware Tag</span>
              <span className="font-mono font-bold text-[#081820] text-base mt-0.5 block">
                {settings.deviceTag}
              </span>
            </div>
            <div className="p-3.5 bg-[#F6F9F7] rounded-xl border border-[#CBD8D4]">
              <span className="text-[#1E3831] font-medium block">Active Offline Map Pack</span>
              <span className="font-bold text-[#0B6758] text-base mt-0.5 block">
                {settings.activeMapPack}
              </span>
            </div>
          </div>
        </Card>

        {/* 4. Audit Retention Card (2 C.F.R. § 200.334) */}
        <Card className="space-y-3">
          <div className="flex items-center gap-2 border-b border-[#CBD8D4] pb-3">
            <ShieldCheck size={20} className="text-[#0B6758]" />
            <h2 className="text-base font-bold text-[#081820]">
              4. Statutory Grant Retention (2 C.F.R. § 200.334)
            </h2>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#E1ECE8] text-[#081820] border border-[#A7C7BE] rounded-xl text-sm">
            <div>
              <span className="font-bold block">3-Year Mandatory Audit Retention</span>
              <span className="text-xs text-[#1E3831]">
                All incident creation, radio log entries, and team sign-offs are sealed in flash.
              </span>
            </div>
            <span className="font-mono font-bold text-sm bg-white px-3 py-1.5 rounded-lg border border-[#A7C7BE]">
              3 Years
            </span>
          </div>
        </Card>

        {/* 5. Gateway & Standalone Demo Toggle */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#CBD8D4] pb-3">
            <div className="flex items-center gap-2">
              <Server size={20} className="text-[#0B6758]" />
              <h2 className="text-base font-bold text-[#081820]">
                5. Base Station Gateway URL
              </h2>
            </div>
            <span className="text-xs font-semibold text-[#1E3831]">Optional cloud sync</span>
          </div>

          <div className="space-y-3">
            <input
              type="url"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="http://localhost:8000/"
              aria-label="Base Station Gateway URL"
              className="w-full px-4 py-2.5 min-h-[44px] rounded-xl border border-[#8BA39B] font-mono text-[#081820] bg-[#F6F9F7] focus:bg-white"
            />

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <PrimaryButton
                onClick={handleSaveAndTest}
                disabled={testing}
                icon={testing ? <RefreshCw size={16} className="animate-spin" /> : undefined}
              >
                {testing ? 'Testing connection...' : 'Save & Probe Gateway'}
              </PrimaryButton>
              <SecondaryButton onClick={() => setUrlDraft('http://localhost:8000/')}>
                Reset to Local
              </SecondaryButton>
            </div>

            {testResult && (
              <div className="p-3 rounded-xl bg-[#FEF3DD] border border-[#D97706] text-[#78350F] text-xs font-mono font-semibold mt-2">
                {testResult}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#CBD8D4]">
            <label className="flex items-center justify-between cursor-pointer gap-3 p-2">
              <div>
                <span className="text-sm font-bold text-[#081820] block">
                  Force Standalone Demo Mode
                </span>
                <span className="text-xs text-[#1E3831]">
                  Bypass network polling and use high-fidelity bundled Welsh / Highland datasets
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.forceDemo}
                onChange={(e) => handleToggleDemo(e.target.checked)}
                className="h-6 w-6 rounded accent-[#0B6758] cursor-pointer"
              />
            </label>
          </div>
        </Card>
      </div>
    </div>
  );
};
