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
 * AberTech Hexagonal Mountain & Lake Emblem Lockup (Transparent exterior around hexagon)
 */
export const AberTechBrand: React.FC<{
  subtitle?: string;
  className?: string;
  dark?: boolean;
}> = ({ subtitle = 'SR Portal', className = '', dark = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/assets/aistudio/abertech_hex_logo.svg"
        alt="AberTech Hexagonal Mountain & Lake Logo"
        className="w-11 h-11 object-contain bg-transparent select-none shrink-0 drop-shadow-xs"
      />
      <div className="flex flex-col leading-tight select-none">
        <div className="flex items-center gap-2">
          <span
            className={`font-serif-editorial font-bold text-lg tracking-wider uppercase ${
              dark ? 'text-[#E5E4E2]' : 'text-[#0A0A0A]'
            }`}
          >
            ABERTECH
          </span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-[#536878] text-[#E5E4E2] px-2 py-0.5 rounded-md">
            FIELD
          </span>
        </div>
        <span
          className={`text-xs font-medium mt-0.5 ${
            dark ? 'text-[#9FB2C0]' : 'text-[#485865]'
          }`}
        >
          {subtitle}
        </span>
      </div>
    </div>
  );
};

/**
 * Signature Onyx Mountain Horizon Card (IMG_7717 + mountain_png_Original_d683623e.png)
 */
export const MountainHorizonCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  mountainVariant?: 'clean' | 'valley' | 'woodcut';
}> = ({ children, className = '', onClick, mountainVariant = 'clean' }) => {
  const mountainSrc =
    mountainVariant === 'valley'
      ? '/assets/aistudio/layout_pre_vector_Original_d625885b.png'
      : mountainVariant === 'woodcut'
      ? '/assets/aistudio/mount_overlay_Original_8e3d0a3d.png'
      : '/assets/aistudio/mountain_png_Original_d683623e.png';

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-[#0A0A0A] text-[#E5E4E2] border border-[#536878]/50 abertech-grain shadow-lg ${
        onClick ? 'cursor-pointer hover:border-[#E5A996]/70 transition-colors' : ''
      } ${className}`}
    >
      <img
        src={mountainSrc}
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute bottom-0 inset-x-0 w-full h-28 sm:h-36 object-cover object-bottom opacity-80"
      />
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
  color = '#536878',
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
            stroke={dark ? '#253038' : '#CFCBC4'}
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
            dark ? 'text-[#E5E4E2]' : 'text-[#0A0A0A]'
          }`}
        >
          {clamped}%
        </span>
      </div>
      {label && (
        <span
          className={`text-xs font-semibold ${
            dark ? 'text-[#9FB2C0]' : 'text-[#485865]'
          }`}
        >
          {label}
        </span>
      )}
    </div>
  );
};

/**
 * Quick-Toggle Controls for Dynamic Type Scaling & Contrast Presets (Desktop Header / Settings)
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
    'daylight-field': 'Alabaster',
    'poor-light-hivis': 'Hi-Vis',
    'night-vision': 'Onyx Dark',
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        className="inline-flex items-center bg-[#F4F3F1] rounded-full p-0.5 border border-[#C7C6C1]"
        role="group"
        aria-label="Dynamic Type UI scale"
      >
        <span className="hidden 2xl:inline-flex items-center gap-1 px-2.5 text-xs font-semibold text-[#485865]">
          <ZoomIn size={14} className="text-[#536878]" />
          <span>Scale:</span>
        </span>
        {(
          [
            { id: 'standard', label: '100%', title: 'Standard Dynamic Type' },
            { id: 'weather-lg', label: '115%', title: 'Foul Weather Dynamic Type' },
            { id: 'storm-xl', label: '130%', title: 'Large Storm Dynamic Type' },
          ] as const
        ).map((opt) => {
          const active = (settings.uiScale || 'standard') === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleScaleChange(opt.id)}
              title={opt.title}
              className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold transition-colors cursor-pointer ${
                active
                  ? 'bg-[#0A0A0A] text-[#E5E4E2]'
                  : 'text-[#0A0A0A] hover:bg-[#D7DFE5]'
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
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
          settings.lightingCondition === 'night-vision'
            ? 'bg-[#0A0A0A] text-[#E5E4E2] border-[#536878]'
            : settings.lightingCondition === 'poor-light-hivis'
            ? 'bg-white text-[#0A0A0A] border-[#0A0A0A]'
            : 'bg-[#F4F3F1] text-[#0A0A0A] border-[#C7C6C1]'
        }`}
        title="Cycle contrast mode between Alabaster Daylight, Hi-Vis, and Onyx Dark Mode"
      >
        {settings.lightingCondition === 'night-vision' ? (
          <Moon size={14} className="text-[#E5A996]" />
        ) : settings.lightingCondition === 'poor-light-hivis' ? (
          <Eye size={14} className="text-[#536878]" />
        ) : (
          <Sun size={14} className="text-[#D97706]" />
        )}
        <span>{lightingLabels[settings.lightingCondition || 'daylight-field']}</span>
      </button>

      {!compact && (
        <button
          type="button"
          role="switch"
          aria-checked={settings.gloveMode !== false}
          onClick={handleToggleGloveMode}
          className={`hidden 2xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
            settings.gloveMode
              ? 'bg-[#D7DFE5] text-[#0A0A0A] border-[#536878]'
              : 'bg-[#F4F3F1] text-[#485865] border-[#C7C6C1]'
          }`}
          title="Toggle 44pt+ touch targets for wet screens and gloves"
        >
          <Hand size={14} className="text-[#536878]" />
          <span>Glove: {settings.gloveMode ? 'On' : 'Off'}</span>
        </button>
      )}
    </div>
  );
};

/**
 * Top Header Status Bar — Clean pill badges in Onyx, Blue Slate & Alabaster Grey
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
    <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-[#E5E4E2] text-xs">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full">
        {/* Local Persistence Pill */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0A0A0A] text-[#E5E4E2] border border-[#536878]/50 font-medium whitespace-nowrap shrink-0"
          title="Incident metadata and audit records are saved to encrypted local flash."
        >
          <CheckCircle2 size={14} className="text-[#86EFAC] shrink-0" />
          <span>
            Device saved ·{' '}
            <span className="font-mono font-semibold tabular-nums">{lastSavedUtc}</span>
          </span>
        </div>

        {/* Radio Link Connectivity Pill */}
        <button
          type="button"
          onClick={onRefresh || (() => rescueRepository.checkHealth())}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors border ${
            status.state === 'ONLINE'
              ? 'bg-[#D7DFE5] text-[#0A0A0A] border-[#536878]/40'
              : 'bg-[#FEF3DD] text-[#9A690B] border-[#D97706]/40 hover:bg-[#FDE68A]'
          }`}
          title="Team radio mesh connection. Tap to check connection."
        >
          <Radio size={14} className="shrink-0" />
          <span>
            {status.state === 'ONLINE'
              ? 'Team link online'
              : `Team link offline · last ${lastRadioCheckUtc}`}
          </span>
        </button>

        {/* Background Area Pre-Cache Pill */}
        {precache.state !== 'IDLE' && (
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono font-semibold whitespace-nowrap shrink-0 border ${
              precache.state === 'PRECACHING'
                ? 'bg-[#0A0A0A] text-[#E5A996] border-[#E5A996]/60'
                : 'bg-[#D7DFE5] text-[#0A0A0A] border-[#536878]/50'
            }`}
            title={precache.currentTaskLabel}
          >
            <CloudDownload
              size={14}
              className={`shrink-0 ${
                precache.state === 'PRECACHING'
                  ? 'text-[#E5A996] animate-bounce'
                  : 'text-[#0B6758]'
              }`}
            />
            <span>
              {precache.state === 'PRECACHING'
                ? `Pre-caching area ${precache.progressPct}% (${precache.tilesLoaded}/${precache.tilesTotal} tiles)`
                : `Area cached · ${precache.tilesLoaded} tiles · ${precache.weatherSectorsLoaded} wx sectors`}
            </span>
          </div>
        )}
      </div>

      {/* Desktop Dynamic Type & Contrast Controls */}
      <div className="hidden xl:flex items-center gap-2 shrink-0">
        <FieldVisibilityQuickControls compact />
        <div className="hidden 2xl:flex items-center gap-1.5 text-[#0A0A0A] text-xs font-mono font-semibold bg-[#F4F3F1] px-3 py-1.5 rounded-full border border-[#C7C6C1]">
          <HardDrive size={14} className="text-[#536878]" />
          <span>{settingsStore.settings.deviceTag}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Background Map Tile & Weather Pre-Cache Status Banner
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
      className={`rounded-2xl border p-3.5 sm:p-4 transition-all ${
        isCaching
          ? 'bg-[#0A0A0A] text-[#E5E4E2] border-[#E5A996]/60 shadow-md'
          : 'bg-[#F4F3F1] text-[#0A0A0A] border-[#536878]/40'
      } ${className}`}
      role="region"
      aria-label="Search Area Background Pre-Cache Status"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isCaching
                ? 'bg-[#536878]/30 text-[#E5A996] border-[#E5A996]/50'
                : 'bg-[#0A0A0A] text-[#86EFAC] border-[#536878]/60'
            }`}
          >
            <CloudDownload size={19} className={isCaching ? 'animate-pulse' : ''} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs sm:text-sm tracking-tight">
                {isCaching
                  ? 'Background Pre-Caching Search Area (Tiles & Weather)...'
                  : isReady
                  ? 'Search Area Pre-Cached for Offline Active Operation'
                  : 'Search Area Pre-Cache Standby'}
              </span>
              <span
                className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full tabular-nums ${
                  isCaching
                    ? 'bg-[#E5A996] text-[#0A0A0A]'
                    : 'bg-[#0A0A0A] text-[#86EFAC]'
                }`}
              >
                {snapshot.progressPct}%
              </span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-md border ${
                  isCaching
                    ? 'border-[#536878] text-[#9FB2C0]'
                    : 'border-[#536878]/30 bg-[#D7DFE5] text-[#0A0A0A]'
                }`}
              >
                Z11–Z14 Topo · {snapshot.cachedAreaKm2} km²
              </span>
            </div>

            <p
              className={`text-xs mt-1 font-mono truncate ${
                isCaching ? 'text-[#9FB2C0]' : 'text-[#485865]'
              }`}
            >
              {snapshot.currentTaskLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          {!compact && (
            <div className="hidden md:flex items-center gap-3 text-xs font-mono tabular-nums">
              <div
                className={`px-2.5 py-1 rounded-lg border ${
                  isCaching
                    ? 'bg-[#12161B] border-[#536878]/50 text-[#E5E4E2]'
                    : 'bg-white border-[#C7C6C1] text-[#0A0A0A]'
                }`}
              >
                <span className="opacity-70">Tiles: </span>
                <strong>
                  {snapshot.tilesLoaded}/{snapshot.tilesTotal || 48}
                </strong>
              </div>
              <div
                className={`px-2.5 py-1 rounded-lg border ${
                  isCaching
                    ? 'bg-[#12161B] border-[#536878]/50 text-[#E5E4E2]'
                    : 'bg-white border-[#C7C6C1] text-[#0A0A0A]'
                }`}
              >
                <span className="opacity-70">Wx Sectors: </span>
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
            className={`min-h-[40px] px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border transition-colors cursor-pointer disabled:opacity-50 ${
              isCaching
                ? 'bg-[#536878]/40 text-[#E5E4E2] border-[#536878]'
                : 'bg-[#0A0A0A] text-[#E5E4E2] border-[#536878] hover:bg-[#536878]'
            }`}
            title="Re-run background pre-caching of search area map tiles and micro-weather sectors"
          >
            <RefreshCw size={13} className={isCaching ? 'animate-spin' : ''} />
            <span>{isCaching ? 'Caching...' : 'Sync Area Cache'}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar when actively pre-caching */}
      {isCaching && (
        <div className="mt-3 w-full h-1.5 bg-[#1E262E] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#E5A996] transition-all duration-300 rounded-full"
            style={{ width: `${snapshot.progressPct}%` }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Step Breadcrumb Bar e.g. "01 / 09 · FIELD WORKSPACE"
 */
export const StepHeader: React.FC<{
  stepNumber: string;
  stepTitle: string;
  missionRef?: string;
}> = ({ stepNumber, stepTitle, missionRef }) => {
  return (
    <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-2.5 bg-[#0A0A0A] text-[#E5E4E2] border-b border-[#536878]/40">
      <div className="flex items-center gap-2.5 text-xs font-mono font-bold tracking-wider">
        <span className="text-[#E5A996] tabular-nums">{stepNumber}</span>
        <span className="text-[#536878]">·</span>
        <span className="uppercase tracking-widest text-[#E5E4E2]">{stepTitle}</span>
      </div>
      {missionRef && (
        <span className="text-xs font-mono font-bold bg-[#536878] text-[#E5E4E2] px-2.5 py-0.5 rounded-md tabular-nums">
          {missionRef}
        </span>
      )}
    </div>
  );
};

/**
 * Notice and Callout Banners (CR >= 4.5:1)
 */
export const PlanningEstimateNotice: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <div
    className={`bg-[#FEF3DD] border border-[#F3D794] text-[#78350F] rounded-2xl p-4 flex items-start gap-3 ${className}`}
  >
    <AlertTriangle size={20} className="shrink-0 mt-0.5 text-[#B45309]" />
    <div className="text-xs sm:text-sm leading-relaxed">
      <span className="font-bold block mb-0.5 text-[#0A0A0A]">
        Planning estimate, not evidence
      </span>
      Probability contours model kinematic reach under the recorded assumptions. They do not
      confirm subject presence in any sector.
    </div>
  </div>
);

export const PrivateByDefaultNotice: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <div
    className={`bg-[#F4F3F1] border border-[#C7C6C1] text-[#0A0A0A] rounded-2xl p-4 flex items-start gap-3 ${className}`}
  >
    <Info size={20} className="shrink-0 mt-0.5 text-[#536878]" />
    <div className="text-xs sm:text-sm leading-relaxed text-[#485865]">
      <span className="font-bold text-[#0A0A0A] block mb-0.5">Private by default</span>
      This device does not broadcast incident metadata until an authorized team or gateway link
      is confirmed. Records are retained locally under 2 C.F.R. § 200.334 rules.
    </div>
  </div>
);

export const ComplianceNotice: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`bg-[#D7DFE5] border border-[#536878]/40 text-[#0A0A0A] rounded-2xl p-4 flex items-start gap-3 ${className}`}
  >
    <ShieldAlert size={20} className="shrink-0 mt-0.5 text-[#536878]" />
    <div className="text-xs sm:text-sm leading-relaxed">
      <span className="font-bold block mb-0.5 text-[#0A0A0A]">
        2 C.F.R. § 200.334 Audit Retention
      </span>
      Retained on device for 3 years to ensure FEMA AFG and statutory grant compliance. Local
      cryptographic seal generated upon mission closure.
    </div>
  </div>
);

/**
 * Standard Card Component — Clean Single-Elevation Surface
 */
export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`tactical-card rounded-2xl p-4 sm:p-5 ${
      onClick ? 'cursor-pointer hover:border-[#536878] transition-colors' : ''
    } ${className}`}
  >
    {children}
  </div>
);

/**
 * Status Badge — High Contrast Semantic States
 */
export const StatusBadge: React.FC<{
  type: 'green' | 'amber' | 'red' | 'neutral';
  label: string;
  icon?: React.ReactNode;
  className?: string;
}> = ({ type, label, icon, className = '' }) => {
  const styles = {
    green: 'bg-[#0A0A0A] text-[#86EFAC] border border-[#536878]/50',
    amber: 'bg-[#FEF3DD] text-[#9A690B] border border-[#D97706]/40',
    red: 'bg-[#FEE2E2] text-[#991B1B] border border-[#E11D48]/40',
    neutral: 'bg-[#D7DFE5] text-[#0A0A0A] border border-[#536878]/30',
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
 * Primary & Secondary Buttons — Apple HIG >= 44x44pt Touch Targets, Onyx & Blue Slate
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
    className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] min-w-[44px] rounded-full font-bold text-sm text-[#E5E4E2] bg-[#0A0A0A] hover:bg-[#536878] border border-[#536878]/60 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer ${className}`}
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
    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] min-w-[44px] rounded-full font-bold text-sm text-[#0A0A0A] bg-[#F4F3F1] border border-[#536878]/50 hover:bg-[#D7DFE5] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer ${className}`}
  >
    {icon}
    <span>{children}</span>
  </button>
);

/**
 * Mobile Bottom Tab Bar — Onyx & Alabaster Tab Bar (Missions | Tactical | Evidence | Audit)
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
      className="lg:hidden shrink-0 bg-[#0A0A0A] border-t border-[#536878]/50 px-2 pt-1.5 hig-tab-bar flex items-center justify-around z-30"
    >
      {items.map((item) => {
        const isActive =
          (item.step === 1 && currentStep <= 6) || currentStep === item.step;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => onNavigateStep(item.step)}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-4 min-h-[48px] min-w-[68px] rounded-xl text-xs transition-colors cursor-pointer ${
              isActive
                ? 'text-[#E5A996] bg-[#536878]/25 font-bold'
                : 'text-[#E5E4E2]/70 font-medium hover:text-[#E5E4E2]'
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
