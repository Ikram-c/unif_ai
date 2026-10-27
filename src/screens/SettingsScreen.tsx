import React, { useState } from 'react';
import {
  ArrowLeft,
  Server,
  RefreshCw,
  HardDrive,
  ShieldCheck,
  Moon,
  Sun,
  Map,
  CheckCircle2,
} from 'lucide-react';
import { Card, PrimaryButton, SecondaryButton, StepHeader } from '../components/Common';
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

  const handleToggleDarkMode = (dark: boolean) => {
    settingsStore.update((s) => ({ ...s, darkMode: dark }));
    setSettings(settingsStore.settings);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F5] overflow-y-auto">
      <StepHeader stepNumber="SETTINGS" stepTitle="FIELD HARDWARE & RETENTION" />

      <div className="p-4 sm:p-6 max-w-2xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1C2E2A] tracking-tight">
              Settings & Hardware
            </h1>
            <p className="text-xs text-[#5A706A] mt-0.5">
              Device tag ABER-04 · Local flash storage and sync gateway
            </p>
          </div>
          <SecondaryButton onClick={onBack} icon={<ArrowLeft size={16} />}>
            Back
          </SecondaryButton>
        </div>

        {/* 1. Hardware & Map Pack Card */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E2E8E5] pb-2">
            <HardDrive size={18} className="text-[#0B6758]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A]">
              Assigned Field Hardware & Offline Packs
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5]">
              <span className="text-[#5A706A] block text-[11px]">Device Hardware Tag</span>
              <span className="font-mono font-bold text-[#1C2E2A] text-sm mt-0.5 block">
                {settings.deviceTag}
              </span>
            </div>
            <div className="p-3 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5]">
              <span className="text-[#5A706A] block text-[11px]">Active Offline Map Pack</span>
              <span className="font-bold text-[#0B6758] text-sm mt-0.5 block">
                {settings.activeMapPack}
              </span>
            </div>
          </div>
        </Card>

        {/* 2. Audit Retention Card (2 C.F.R. § 200.334) */}
        <Card className="space-y-3">
          <div className="flex items-center gap-2 border-b border-[#E2E8E5] pb-2">
            <ShieldCheck size={18} className="text-[#0B6758]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A]">
              Statutory Grant Retention (2 C.F.R. § 200.334)
            </h2>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#E1ECE8] text-[#0B6758] rounded-lg text-xs">
            <div>
              <span className="font-bold block">3-Year Mandatory Audit Retention</span>
              <span className="text-[11px] opacity-90">
                All incident creation, radio log entries, and team sign-offs are sealed in flash.
              </span>
            </div>
            <span className="font-mono font-bold text-sm bg-white px-2.5 py-1 rounded shadow-2xs">
              3 Years
            </span>
          </div>
        </Card>

        {/* 3. Appearance Mode (Light / Dark) */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#E2E8E5] pb-2">
            <div className="flex items-center gap-2">
              <Sun size={18} className="text-[#0B6758]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A]">
                Field Display Appearance
              </h2>
            </div>
            <span className="text-[11px] text-[#5A706A]">High-contrast daylight mode</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleToggleDarkMode(false)}
              className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                !settings.darkMode
                  ? 'border-[#0B6758] bg-[#E1ECE8] text-[#0B6758] font-bold'
                  : 'border-[#E2E8E5] bg-white text-[#1C2E2A] hover:bg-[#F4F6F5]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sun size={16} />
                <span className="text-xs">Daylight Light (Default)</span>
              </div>
              {!settings.darkMode && <CheckCircle2 size={16} />}
            </button>

            <button
              type="button"
              onClick={() => handleToggleDarkMode(true)}
              className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                settings.darkMode
                  ? 'border-[#0B6758] bg-[#1C2E2A] text-white font-bold'
                  : 'border-[#E2E8E5] bg-white text-[#1C2E2A] hover:bg-[#F4F6F5]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Moon size={16} />
                <span className="text-xs">Night Ops Dark</span>
              </div>
              {settings.darkMode && <CheckCircle2 size={16} className="text-[#57BCAE]" />}
            </button>
          </div>
        </Card>

        {/* 4. Gateway & Standalone Demo Toggle */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8E5] pb-2">
            <div className="flex items-center gap-2">
              <Server size={18} className="text-[#0B6758]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A]">
                Base Station Gateway URL
              </h2>
            </div>
            <span className="text-[11px] text-[#5A706A]">Optional cloud sync</span>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="http://localhost:8000/"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8E5] text-xs font-mono text-[#1C2E2A] focus:outline-none focus:border-[#0B6758] bg-[#F4F6F5]"
            />

            <div className="flex items-center gap-2 pt-1">
              <SecondaryButton
                onClick={handleSaveAndTest}
                disabled={testing}
                icon={testing ? <RefreshCw size={13} className="animate-spin" /> : undefined}
              >
                {testing ? 'Testing connection...' : 'Save & probe gateway'}
              </SecondaryButton>
              <SecondaryButton onClick={() => setUrlDraft('http://localhost:8000/')}>
                Reset to local
              </SecondaryButton>
            </div>

            {testResult && (
              <div className="p-2.5 rounded-md bg-[#FEF3DD] text-[#9A690B] text-xs font-mono mt-2">
                {testResult}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-[#E2E8E5]">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-xs font-bold text-[#1C2E2A] block">Force Standalone Demo Mode</span>
                <span className="text-[11px] text-[#5A706A]">
                  Bypass network polling and use high-fidelity bundled Welsh / Highland datasets
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.forceDemo}
                onChange={(e) => handleToggleDemo(e.target.checked)}
                className="h-4 w-4 rounded accent-[#0B6758]"
              />
            </label>
          </div>
        </Card>
      </div>
    </div>
  );
};
