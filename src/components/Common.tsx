import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Info,
  CheckCircle2,
  Radio,
  HardDrive,
  Compass,
  FileText,
  Camera,
  Layers,
  AlertTriangle,
  Eye,
  Hand,
  Moon,
  Sun,
  ZoomIn,
  CloudDownload,
  RefreshCw,
} from 'lucide-react';
import { AppSettings, FieldLightingCondition, FieldUiScale, Rescue, ServerStatus } from '../types';
import { rescueRepository } from '../data/RescueRepository';
import { settingsStore } from '../data/SettingsStore';
import { areaPrecacheService, PrecacheSnapshot } from '../core/AreaPrecacheService';

/**
 * Apple HIG App Icon Squircle Brand Header (Pure Vector Icon — No Raster/Art Graphics)
 */
export const AberTechBrand: React.FC<{
  subtitle?: string;
  className?: string;
  dark?: boolean;
}> = ({ subtitle = 'SR Portal', className = '', dark = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="w-10 h-10 hig-app-icon bg-[#007AFF] text-white flex items-center justify-center shrink-0 shadow-xs"
        aria-hidden="true"
      >
        <Compass size={22} strokeWidth={2.25} />
      </div>
      <div className="flex flex-col leading-tight select-none">
        <div className="flex items-center gap-2">
          <span
            className={`font-sans font-bold text-base tracking-tight ${
              dark ? 'text-white' : 'text-[#1C1C1E]'
            }`}
          >
            AberTech
          </span>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider bg-[#E8F2FF] text-[#0062CC] px-2 py-0.5 rounded-full border border-[#007AFF]/20">
            SAR
          </span>
        </div>
        <span
          className={`text-xs font-medium mt-0.5 ${
            dark ? 'text-[#AEAEB2]' : 'text-[#636366]'
          }`}
        >
          {subtitle}
        </span>
      </div>
    </div>
  );
};

/**
 * Clean Apple HIG Grouped Card Surface (Replaces legacy mountain graphic card — Zero Art/Graphics)
 */
export const MountainHorizonCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  mountainVariant?: 'clean' | 'valley' | 'woodcut';
}> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-white text-[#1C1C1E] border border-[#D1D1D6] shadow-xs ${
        onClick ? 'cursor-pointer hover:border-[#007AFF] transition-colors' : ''
      } ${className}`}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
};

/**
 * Apple HIG Activity Ring (Cumulative progress ring with stroke-dasharray: 100)
 */
export const ActivityRing: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  dark?: boolean;
}> = ({
  percentage,
  size = 38,
  strokeWidth = 4,
  color = '#007AFF',
  label,
  dark = false,
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  const offset = 100 - clamped;
  const center = size / 2;
  const radius = center - strokeWidth;

  return (
    <div
      className="inline-flex items-center gap-2"
      title={label ? `${label}: ${clamped}%` : `${clamped}%`}
    >
      <div
        className="relative inline-flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={dark ? '#38383A' : '#E5E5EA'}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset={offset}
            className="transition-all duration-300"
          />
        </svg>
        <span
          className={`absolute text-[10px] font-mono font-bold tabular-nums ${
            dark ? 'text-white' : 'text-[#1C1C1E]'
          }`}
        >
          {clamped}%
        </span>
      </div>
      {label && (
        <span
          className={`text-xs font-medium ${
            dark ? 'text-[#AEAEB2]' : 'text-[#3A3A3C]'
          }`}
        >
          {label}
        </span>
      )}
    </div>
  );
};

/**
 * Apple HIG Segmented Quick Controls for Dynamic Type Scaling & Appearance
 */
export const FieldVisibilityQuickControls: React.FC<{ compact?: boolean }> = ({
  compact = false,
}) => {
  const [settings, setSettings] = useState<AppSettings>(settingsStore.settings);

  useEffect(() => {
    return settingsStore.subscribe(setSettings);
  }, []);

  const handleScaleChange = (scale: FieldUiScale) => {
    settingsStore.update((s) => ({ ...s, uiScale: scale }));
  };

  const handleCycleLighting = () => {
    const order: FieldLightingCondition[] = [
      'daylight-field',
      'poor-light-hivis',
      'night-vision',
    ];
    const currentIdx = order.indexOf(settings.lightingCondition || 'daylight-field');
    const next = order[(currentIdx + 1) % order.length];
    settingsStore.update((s) => ({
      ...s,
      lightingCondition: next,
      darkMode: next === 'night-vision',
    }));
  };

  const handleToggleGloveMode = () => {
    settingsStore.update((s) => ({ ...s, gloveMode: !s.gloveMode }));
  };

  const lightingLabels: Record<FieldLightingCondition, string> = {
    'daylight-field': 'Light',
    'poor-light-hivis': 'High Contrast',
    'night-vision': 'Dark',
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        className="inline-flex items-center bg-[#E5E5EA] rounded-xl p-0.5"
        role="group"
        aria-label="Dynamic Type UI scale"
      >
        <span className="hidden 2xl:inline-flex items-center gap-1 px-2.5 text-xs font-medium text-[#3A3A3C]">
          <ZoomIn size={14} className="text-[#007AFF]" />
          <span>Text:</span>
        </span>
        {(
          [
            { id: 'standard', label: '100%', title: 'Standard Dynamic Type' },
            { id: 'weather-lg', label: '115%', title: 'Large Dynamic Type' },
            { id: 'storm-xl', label: '130%', title: 'Extra Large Dynamic Type' },
          ] as const
        ).map((opt) => {
          const active = (settings.uiScale || 'standard') === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleScaleChange(opt.id)}
              title={opt.title}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                active
                  ? 'bg-white text-[#1C1C1E] shadow-2xs'
                  : 'text-[#3A3A3C] hover:text-[#1C1C1E]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleCycleLighting}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
          settings.lightingCondition === 'night-vision'
            ? 'bg-[#1C1C1E] text-white border-[#38383A]'
            : settings.lightingCondition === 'poor-light-hivis'
            ? 'bg-white text-[#1C1C1E] border-[#1C1C1E]'
            : 'bg-white text-[#1C1C1E] border-[#D1D1D6]'
        }`}
        title="Switch appearance between Light, High Contrast, and Dark Mode"
      >
        {settings.lightingCondition === 'night-vision' ? (
          <Moon size={14} className="text-[#0A84FF]" />
        ) : settings.lightingCondition === 'poor-light-hivis' ? (
          <Eye size={14} className="text-[#007AFF]" />
        ) : (
          <Sun size={14} className="text-[#FF9500]" />
        )}
        <span>{lightingLabels[settings.lightingCondition || 'daylight-field']}</span>
      </button>

      {!compact && (
        <button
          type="button"
          role="switch"
          aria-checked={settings.gloveMode !== false}
          onClick={handleToggleGloveMode}
          className={`hidden 2xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
            settings.gloveMode
              ? 'bg-[#E8F2FF] text-[#0062CC] border-[#007AFF]/30'
              : 'bg-white text-[#3A3A3C] border-[#D1D1D6]'
          }`}
          title="Toggle 44pt+ touch targets for wet screens and gloves"
        >
          <Hand size={14} className="text-[#007AFF]" />
          <span>Touch: {settings.gloveMode ? '44pt+' : 'Std'}</span>
        </button>
      )}
    </div>
  );
};

/**
 * Apple HIG Top Navigation Status Bar
 */
export const DualStatusHeader: React.FC<{
  lastSavedUtc?: string;
  lastRadioCheckUtc?: string;
  onRefresh?: () => void;
}> = ({
  lastSavedUtc = '12:30 UTC',
  lastRadioCheckUtc = '12:24 UTC',
  onRefresh,
}) => {
  const [status, setStatus] = useState<ServerStatus>(rescueRepository.currentStatus);
  const [precache, setPrecache] = useState<PrecacheSnapshot>(
    areaPrecacheService.currentSnapshot
  );

  useEffect(() => {
    const unsubStatus = rescueRepository.subscribeStatus(setStatus);
    const unsubPrecache = areaPrecacheService.subscribe(setPrecache);
    return () => {
      unsubStatus();
      unsubPrecache();
    };
  }, []);

  return (
    <div className="flex items-center justify-between gap-2 px-3 sm:px-5 py-2 bg-white/95 backdrop-blur-md text-xs">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full">
        {/* Local Persistence Pill */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F2F2F7] text-[#1C1C1E] border border-[#D1D1D6] font-medium whitespace-nowrap shrink-0"
          title="Incident metadata and audit records are saved to local storage."
        >
          <CheckCircle2 size={14} className="text-[#34C759] shrink-0" />
          <span>
            Saved locally ·{' '}
            <span className="font-mono font-semibold tabular-nums">{lastSavedUtc}</span>
          </span>
        </div>

        {/* Radio Link Connectivity Pill */}
        <button
          type="button"
          onClick={onRefresh || (() => rescueRepository.checkHealth())}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors border ${
            status.state === 'ONLINE'
              ? 'bg-[#E8F8EE] text-[#15803D] border-[#34C759]/40'
              : 'bg-[#FFF8E6] text-[#9A690B] border-[#FF9500]/40 hover:bg-[#FEF3C7]'
          }`}
          title="Team radio mesh connection. Tap to check connection."
        >
          <Radio size={14} className="shrink-0" />
          <span>
            {status.state === 'ONLINE'
              ? 'Team link online'
              : `Offline mode · last ${lastRadioCheckUtc}`}
          </span>
        </button>

        {/* Background Area Pre-Cache Pill */}
        {precache.state !== 'IDLE' && (
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono font-semibold whitespace-nowrap shrink-0 border ${
              precache.state === 'PRECACHING'
                ? 'bg-[#E8F2FF] text-[#0062CC] border-[#007AFF]/40'
                : 'bg-[#F2F2F7] text-[#1C1C1E] border-[#D1D1D6]'
            }`}
            title={precache.currentTaskLabel}
          >
            <CloudDownload
              size={14}
              className={`shrink-0 ${
                precache.state === 'PRECACHING'
                  ? 'text-[#007AFF] animate-bounce'
                  : 'text-[#34C759]'
              }`}
            />
            <span>
              {precache.state === 'PRECACHING'
                ? `Caching area ${precache.progressPct}% (${precache.tilesLoaded}/${precache.tilesTotal} tiles)`
                : `Area cached · ${precache.tilesLoaded} tiles · ${precache.weatherSectorsLoaded} wx sectors`}
            </span>
          </div>
        )}
      </div>

      {/* Desktop Dynamic Type & Contrast Controls */}
      <div className="hidden xl:flex items-center gap-2 shrink-0">
        <FieldVisibilityQuickControls compact />
        <div className="hidden 2xl:flex items-center gap-1.5 text-[#3A3A3C] text-xs font-mono font-semibold bg-[#F2F2F7] px-3 py-1.5 rounded-xl border border-[#D1D1D6]">
          <HardDrive size={14} className="text-[#007AFF]" />
          <span>{settingsStore.settings.deviceTag}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Apple HIG Background Map Tile & Weather Pre-Cache Status Card
 */
export const AreaPrecacheBanner: React.FC<{
  rescue: Rescue;
  compact?: boolean;
  className?: string;
}> = ({ rescue, compact = false, className = '' }) => {
  const [snapshot, setSnapshot] = useState<PrecacheSnapshot>(
    areaPrecacheService.currentSnapshot
  );

  useEffect(() => {
    return areaPrecacheService.subscribe(setSnapshot);
  }, []);

  const handleForceResync = () => {
    areaPrecacheService.triggerAreaPrecache(rescue, {
      triggeredFrom: 'Manual Commander Re-Sync',
      force: true,
    });
  };

  const isCaching = snapshot.state === 'PRECACHING';
  const isReady = snapshot.state === 'READY';

  return (
    <div
      className={`rounded-2xl border p-4 transition-all bg-white text-[#1C1C1E] ${
        isCaching
          ? 'border-[#007AFF] shadow-sm'
          : 'border-[#D1D1D6] shadow-2xs'
      } ${className}`}
      role="region"
      aria-label="Search Area Background Pre-Cache Status"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 hig-app-icon flex items-center justify-center shrink-0 ${
              isCaching
                ? 'bg-[#E8F2FF] text-[#007AFF]'
                : 'bg-[#E8F8EE] text-[#15803D]'
            }`}
          >
            <CloudDownload size={20} className={isCaching ? 'animate-pulse' : ''} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-[#1C1C1E] tracking-tight">
                {isCaching
                  ? 'Downloading Offline Map Tiles & Weather...'
                  : isReady
                  ? 'Offline Map & Weather Ready'
                  : 'Offline Area Cache Standby'}
              </span>
              <span
                className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full tabular-nums ${
                  isCaching
                    ? 'bg-[#E8F2FF] text-[#0062CC]'
                    : 'bg-[#E8F8EE] text-[#15803D]'
                }`}
              >
                {snapshot.progressPct}%
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[#F2F2F7] text-[#3A3A3C] border border-[#D1D1D6]">
                Z11–Z14 · {snapshot.cachedAreaKm2} km²
              </span>
            </div>

            <p className="text-xs mt-1 text-[#636366] truncate">
              {snapshot.currentTaskLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          {!compact && (
            <div className="hidden md:flex items-center gap-2 text-xs font-mono tabular-nums">
              <div className="px-2.5 py-1 rounded-lg bg-[#F2F2F7] border border-[#D1D1D6] text-[#1C1C1E]">
                <span className="text-[#636366]">Tiles: </span>
                <strong>
                  {snapshot.tilesLoaded}/{snapshot.tilesTotal || 48}
                </strong>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-[#F2F2F7] border border-[#D1D1D6] text-[#1C1C1E]">
                <span className="text-[#636366]">Weather: </span>
                <strong>
                  {snapshot.weatherSectorsLoaded}/{snapshot.weatherSectorsTotal || 18}
                </strong>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleForceResync}
            disabled={isCaching}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#007AFF] border border-[#D1D1D6] transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh offline map tiles and micro-weather sectors"
          >
            <RefreshCw size={14} className={isCaching ? 'animate-spin' : ''} />
            <span>{isCaching ? 'Syncing...' : 'Refresh Cache'}</span>
          </button>
        </div>
      </div>

      {isCaching && (
        <div className="mt-3 w-full h-1.5 bg-[#E5E5EA] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#007AFF] transition-all duration-300 rounded-full"
            style={{ width: `${snapshot.progressPct}%` }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Apple HIG Navigation Subheader Bar
 */
export const StepHeader: React.FC<{
  stepNumber: string;
  stepTitle: string;
  missionRef?: string;
}> = ({ stepNumber, stepTitle, missionRef }) => {
  return (
    <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-2.5 bg-white/95 backdrop-blur-md text-[#1C1C1E] border-b border-[#D1D1D6]">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-tight">
        <span className="font-mono font-bold text-[#007AFF] bg-[#E8F2FF] px-2 py-0.5 rounded-md tabular-nums">
          {stepNumber}
        </span>
        <span className="text-[#636366]">·</span>
        <span className="text-[#3A3A3C] font-semibold">{stepTitle}</span>
      </div>
      {missionRef && (
        <span className="text-xs font-mono font-semibold bg-[#F2F2F7] text-[#1C1C1E] border border-[#D1D1D6] px-2.5 py-0.5 rounded-md tabular-nums">
          {missionRef}
        </span>
      )}
    </div>
  );
};

/**
 * Apple HIG Callout Banners (CR >= 4.5:1)
 */
export const PlanningEstimateNotice: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <div
    className={`bg-[#FFF8E6] border border-[#F59E0B]/40 text-[#78350F] rounded-2xl p-4 flex items-start gap-3 ${className}`}
  >
    <AlertTriangle size={20} className="shrink-0 mt-0.5 text-[#D97706]" />
    <div className="text-xs sm:text-sm leading-relaxed">
      <span className="font-semibold block mb-0.5 text-[#1C1C1E]">
        Planning Estimate
      </span>
      Probability contours model kinematic reach under the recorded assumptions. They guide team tasking and do not confirm subject location.
    </div>
  </div>
);

export const PrivateByDefaultNotice: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <div
    className={`bg-white border border-[#D1D1D6] text-[#1C1C1E] rounded-2xl p-4 flex items-start gap-3 ${className}`}
  >
    <Info size={20} className="shrink-0 mt-0.5 text-[#007AFF]" />
    <div className="text-xs sm:text-sm leading-relaxed text-[#3A3A3C]">
      <span className="font-semibold text-[#1C1C1E] block mb-0.5">Private by Default</span>
      Incident data remains stored on your device until you explicitly sync with an authorized team gateway.
    </div>
  </div>
);

export const ComplianceNotice: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`bg-[#E8F2FF] border border-[#007AFF]/25 text-[#1C1C1E] rounded-2xl p-4 flex items-start gap-3 ${className}`}
  >
    <ShieldAlert size={20} className="shrink-0 mt-0.5 text-[#007AFF]" />
    <div className="text-xs sm:text-sm leading-relaxed text-[#3A3A3C]">
      <span className="font-semibold block mb-0.5 text-[#1C1C1E]">
        2 C.F.R. § 200.334 Audit Retention
      </span>
      Records are retained locally for 3 years for statutory compliance, with a cryptographic seal generated when the mission closes.
    </div>
  </div>
);

/**
 * Standard Apple HIG Grouped Card Component
 */
export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`tactical-card rounded-2xl p-4 sm:p-5 ${
      onClick ? 'cursor-pointer hover:border-[#007AFF] transition-colors' : ''
    } ${className}`}
  >
    {children}
  </div>
);

/**
 * Apple HIG Semantic Status Pill Badge
 */
export const StatusBadge: React.FC<{
  type: 'green' | 'amber' | 'red' | 'neutral';
  label: string;
  icon?: React.ReactNode;
  className?: string;
}> = ({ type, label, icon, className = '' }) => {
  const styles = {
    green: 'bg-[#E8F8EE] text-[#15803D] border border-[#34C759]/40',
    amber: 'bg-[#FFF8E6] text-[#9A690B] border border-[#FF9500]/40',
    red: 'bg-[#FEE2E2] text-[#991B1B] border border-[#FF3B30]/40',
    neutral: 'bg-[#F2F2F7] text-[#3A3A3C] border border-[#D1D1D6]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${styles[type]} ${className}`}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
};

/**
 * Apple HIG Primary & Secondary Buttons (>= 44x44pt Touch Targets, Filled System Blue & Secondary Gray)
 */
export const PrimaryButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
}> = ({ children, onClick, disabled = false, className = '', icon, type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] min-w-[44px] rounded-xl font-semibold text-sm text-white bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer ${className}`}
  >
    {icon}
    <span>{children}</span>
  </button>
);

export const SecondaryButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
}> = ({ children, onClick, disabled = false, className = '', icon, type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] min-w-[44px] rounded-xl font-semibold text-sm text-[#007AFF] bg-[#E8F2FF] hover:bg-[#D6E8FF] border border-[#007AFF]/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer ${className}`}
  >
    {icon}
    <span>{children}</span>
  </button>
);

/**
 * Apple HIG iOS/iPadOS Translucent Bottom Tab Bar (Missions | Tactical | Evidence | Audit)
 */
export const MobileBottomNav: React.FC<{
  currentStep: number;
  onNavigateStep: (step: number) => void;
}> = ({ currentStep, onNavigateStep }) => {
  const items = [
    { label: 'Missions', step: 1, icon: <Layers size={21} /> },
    { label: 'Tactical', step: 7, icon: <Compass size={21} /> },
    { label: 'Evidence', step: 8, icon: <Camera size={21} /> },
    { label: 'Audit', step: 9, icon: <FileText size={21} /> },
  ];

  return (
    <nav
      aria-label="Primary Bottom Navigation"
      className="lg:hidden shrink-0 bg-white/95 backdrop-blur-md border-t border-[#D1D1D6] px-2 pt-1.5 hig-tab-bar flex items-center justify-around z-30"
    >
      {items.map((item) => {
        const isActive =
          (item.step === 1 && currentStep >= 1 && currentStep <= 6) || currentStep === item.step;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => onNavigateStep(item.step)}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-4 min-h-[48px] min-w-[68px] rounded-xl text-xs transition-colors cursor-pointer ${
              isActive
                ? 'text-[#007AFF] font-semibold'
                : 'text-[#636366] font-medium hover:text-[#1C1C1E]'
            }`}
          >
            {item.icon}
            <span className="text-[11px] leading-none">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
