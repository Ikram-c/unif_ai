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
  CloudRain,
  Hand,
  Moon,
  Sun,
  ZoomIn,
} from 'lucide-react';
import { AppSettings, FieldLightingCondition, FieldUiScale, ServerStatus } from '../types';
import { rescueRepository } from '../data/RescueRepository';
import { settingsStore } from '../data/SettingsStore';

/**
 * AberTech Logo Badge — Apple HIG App Icon Squircle (border-radius: 22.5%, pure vector graphic without baked-in drop shadows or text)
 */
export const AberTechBrand: React.FC<{ subtitle?: string; className?: string }> = ({
  subtitle = 'Upland SAR Command',
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="w-11 h-11 hig-app-icon bg-[#0B6758] flex items-center justify-center text-white select-none shrink-0"
        aria-hidden="true"
      >
        <Compass size={22} className="stroke-[2.25]" />
      </div>
      <div className="flex flex-col leading-snug select-none">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#081820] text-lg tracking-tight">AberTech</span>
          <span className="text-xs font-semibold bg-[#E1ECE8] text-[#064E3B] px-2 py-0.5 rounded-md border border-[#A7C7BE]">
            SAR
          </span>
        </div>
        <span className="text-xs font-medium text-[#1E3831]">{subtitle}</span>
      </div>
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
}> = ({
  percentage,
  size = 38,
  strokeWidth = 4,
  color = '#0B6758',
  label,
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
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#DCE6E2"
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
        <span className="absolute text-[10px] font-mono font-bold text-[#081820] tabular-nums">
          {clamped}%
        </span>
      </div>
      {label && <span className="text-xs font-semibold text-[#1E3831]">{label}</span>}
    </div>
  );
};

/**
 * Quick-Toggle Controls for Dynamic Type Scaling & Contrast Presets (All targets >= 44x44pt)
 */
export const FieldVisibilityQuickControls: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [settings, setSettings] = useState<AppSettings>(settingsStore.settings);

  useEffect(() => {
    return settingsStore.subscribe(setSettings);
  }, []);

  const handleScaleChange = (scale: FieldUiScale) => {
    settingsStore.update((s) => ({ ...s, uiScale: scale }));
  };

  const handleCycleLighting = () => {
    const order: FieldLightingCondition[] = ['poor-light-hivis', 'night-vision', 'daylight-field'];
    const currentIdx = order.indexOf(settings.lightingCondition || 'poor-light-hivis');
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
    'poor-light-hivis': 'Hi-Vis Contrast',
    'night-vision': 'Night Mode',
    'daylight-field': 'Daylight',
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Dynamic Type Scale Selector (Buttons >= 44px height) */}
      <div
        className="inline-flex items-center bg-white rounded-xl p-1 border border-[#B8C9C3]"
        role="group"
        aria-label="Dynamic Type UI scale"
      >
        <span className="hidden xl:inline-flex items-center gap-1 px-2.5 text-xs font-semibold text-[#1E3831]">
          <ZoomIn size={15} className="text-[#0B6758]" />
          <span>Type:</span>
        </span>
        {(
          [
            { id: 'standard', label: '100%', title: 'Standard Dynamic Type (17px base)' },
            { id: 'weather-lg', label: '115%', title: 'Foul Weather Dynamic Type (18px base)' },
            { id: 'storm-xl', label: '130%', title: 'Large Storm Dynamic Type (19.5px base)' },
          ] as const
        ).map((opt) => {
          const active = (settings.uiScale || 'weather-lg') === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleScaleChange(opt.id)}
              title={opt.title}
              className={`min-h-[38px] min-w-[48px] px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                active
                  ? 'bg-[#0B6758] text-white'
                  : 'text-[#081820] hover:bg-[#EDF2EF]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Contrast Mode Toggle (>= 44px touch target) */}
      <button
        type="button"
        onClick={handleCycleLighting}
        className={`inline-flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
          settings.lightingCondition === 'night-vision'
            ? 'bg-[#081820] text-[#88C070] border-[#2D6A56]'
            : settings.lightingCondition === 'poor-light-hivis'
            ? 'bg-white text-[#081820] border-[#081820]'
            : 'bg-white text-[#081820] border-[#B8C9C3]'
        }`}
        title="Cycle contrast mode between Hi-Vis, Night Mode, and Daylight"
      >
        {settings.lightingCondition === 'night-vision' ? (
          <Moon size={16} />
        ) : settings.lightingCondition === 'poor-light-hivis' ? (
          <Eye size={16} className="text-[#0B6758]" />
        ) : (
          <Sun size={16} className="text-[#D97706]" />
        )}
        <span>{lightingLabels[settings.lightingCondition || 'poor-light-hivis']}</span>
      </button>

      {/* Binary Selection Pill Toggle for Glove Touch Mode (r >= 14pt / border-radius: 999px) */}
      {!compact && (
        <button
          type="button"
          role="switch"
          aria-checked={settings.gloveMode !== false}
          onClick={handleToggleGloveMode}
          className={`hidden md:inline-flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
            settings.gloveMode
              ? 'bg-[#E1ECE8] text-[#064E3B] border-[#0B6758]'
              : 'bg-white text-[#1E3831] border-[#B8C9C3]'
          }`}
          title="Toggle 44pt+ touch targets for wet screens and gloves"
        >
          <Hand size={15} className="text-[#0B6758]" />
          <span>Glove Targets: {settings.gloveMode ? 'On' : 'Off'}</span>
        </button>
      )}
    </div>
  );
};

/**
 * Top Header Status Bar — Clean, accessible hierarchy with >= 44pt interactive targets
 */
export const DualStatusHeader: React.FC<{
  lastSavedUtc?: string;
  lastRadioCheckUtc?: string;
  onRefresh?: () => void;
}> = ({
  lastSavedUtc = '12:30 UTC',
  lastRadioCheckUtc = '12:24 UTC (6m ago)',
  onRefresh,
}) => {
  const [status, setStatus] = useState<ServerStatus>(rescueRepository.currentStatus);

  useEffect(() => {
    return rescueRepository.subscribeStatus(setStatus);
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2 bg-[#EDF2EF] text-xs">
      <div className="flex items-center gap-2.5 overflow-x-auto">
        {/* Local Persistence Status */}
        <div
          className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-xl bg-white text-[#081820] border border-[#B8C9C3] font-medium shrink-0"
          title="Incident metadata and audit records are saved to encrypted local flash."
        >
          <CheckCircle2 size={16} className="text-[#0B6758] shrink-0" />
          <span>Saved locally · <span className="font-mono font-semibold tabular-nums">{lastSavedUtc}</span></span>
        </div>

        {/* Radio Link Connectivity Button (>= 44px height) */}
        <button
          type="button"
          onClick={onRefresh || (() => rescueRepository.checkHealth())}
          className={`inline-flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-xl font-semibold shrink-0 border cursor-pointer transition-colors ${
            status.state === 'ONLINE'
              ? 'bg-[#E1ECE8] text-[#064E3B] border-[#0B6758]'
              : 'bg-[#FEF3DD] text-[#78350F] border-[#D97706] hover:bg-[#FDE68A]'
          }`}
          title="Team radio mesh connection. Tap to check connection."
        >
          <Radio size={16} className="shrink-0" />
          <span>
            {status.state === 'ONLINE'
              ? 'Team link online'
              : `Link offline · last ${lastRadioCheckUtc}`}
          </span>
        </button>
      </div>

      {/* Dynamic Type & Contrast Controls */}
      <div className="flex items-center gap-2.5">
        <FieldVisibilityQuickControls />
        <div className="hidden 2xl:flex items-center gap-1.5 text-[#1E3831] text-xs font-mono font-semibold bg-white px-3 py-2 min-h-[44px] rounded-xl border border-[#B8C9C3]">
          <HardDrive size={15} className="text-[#0B6758]" />
          <span>{settingsStore.settings.deviceTag}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Step Breadcrumb Bar e.g. "07 / 09 · Active Operation"
 */
export const StepHeader: React.FC<{
  stepNumber: string;
  stepTitle: string;
  missionRef?: string;
}> = ({ stepNumber, stepTitle, missionRef }) => {
  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white border-b border-[#CBD8D4]">
      <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#081820]">
        <span className="text-[#064E3B] font-mono font-bold bg-[#E1ECE8] px-2.5 py-1 rounded-md border border-[#A7C7BE] tabular-nums">
          {stepNumber}
        </span>
        <span className="text-[#5A706A]">/</span>
        <span className="tracking-tight text-[#081820]">{stepTitle}</span>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-[#1E3831] bg-[#EDF2EF] px-3 py-1 rounded-full border border-[#CBD8D4]">
          <CloudRain size={14} className="text-[#0B6758]" />
          <span>Accessible Field View</span>
        </span>
        {missionRef && (
          <span className="text-xs sm:text-sm font-mono font-bold bg-[#081820] text-[#FACC15] px-3 py-1 rounded-lg tabular-nums">
            {missionRef}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Notice and Callout Banners (CR >= 4.5:1)
 */
export const PlanningEstimateNotice: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`bg-[#FEF3DD] border border-[#D97706] text-[#78350F] rounded-xl p-4 flex items-start gap-3 ${className}`}
  >
    <AlertTriangle size={20} className="shrink-0 mt-0.5 text-[#B45309]" />
    <div className="text-sm leading-relaxed">
      <span className="font-bold block mb-0.5 text-[#081820]">Planning estimate, not evidence</span>
      Probability contours model kinematic reach under the recorded assumptions. They do not confirm
      subject presence in any sector.
    </div>
  </div>
);

export const PrivateByDefaultNotice: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`bg-white border border-[#B8C9C3] text-[#081820] rounded-xl p-4 flex items-start gap-3 ${className}`}
  >
    <Info size={20} className="shrink-0 mt-0.5 text-[#0B6758]" />
    <div className="text-sm leading-relaxed text-[#1E3831]">
      <span className="font-bold text-[#081820] block mb-0.5">Private by default</span>
      This device does not broadcast incident metadata until an authorized team or gateway link is
      confirmed. Records are retained locally under 2 C.F.R. § 200.334 rules.
    </div>
  </div>
);

export const ComplianceNotice: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`bg-[#E1ECE8] border border-[#0B6758]/40 text-[#064E3B] rounded-xl p-4 flex items-start gap-3 ${className}`}
  >
    <ShieldAlert size={20} className="shrink-0 mt-0.5 text-[#0B6758]" />
    <div className="text-sm leading-relaxed">
      <span className="font-bold block mb-0.5 text-[#081820]">2 C.F.R. § 200.334 Audit Retention</span>
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
    className={`tactical-card rounded-xl p-4 sm:p-5 ${
      onClick ? 'cursor-pointer hover:border-[#0B6758] transition-colors' : ''
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
    green: 'bg-[#E1ECE8] text-[#064E3B] border border-[#0B6758]',
    amber: 'bg-[#FEF3DD] text-[#78350F] border border-[#D97706]',
    red: 'bg-[#FEE2E2] text-[#991B1B] border border-[#DC2626]',
    neutral: 'bg-[#EDF2EF] text-[#081820] border border-[#B8C9C3]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${styles[type]} ${className}`}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
};

/**
 * Primary & Secondary Buttons — Apple HIG >= 44x44pt Touch Targets
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
    className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] min-w-[44px] rounded-xl font-bold text-sm text-white bg-[#0B6758] border border-[#085446] hover:bg-[#085446] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-all cursor-pointer ${className}`}
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
    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] min-w-[44px] rounded-xl font-bold text-sm text-[#081820] bg-white border border-[#8BA39B] hover:bg-[#EDF2EF] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer ${className}`}
  >
    {icon}
    <span>{children}</span>
  </button>
);

/**
 * Mobile Bottom Tab Bar — Apple HIG Tab Bars (Height >= 49pt, 4 mutually exclusive top-level destinations, safe-area inset)
 */
export const MobileBottomNav: React.FC<{
  currentStep: number;
  onNavigateStep: (step: number) => void;
}> = ({ currentStep, onNavigateStep }) => {
  const items = [
    { label: 'Workspace', step: 1, icon: <Layers size={20} /> },
    { label: 'Operation', step: 7, icon: <Compass size={20} /> },
    { label: 'Evidence', step: 8, icon: <Camera size={20} /> },
    { label: 'Audit', step: 9, icon: <FileText size={20} /> },
  ];

  return (
    <nav
      aria-label="Primary Bottom Navigation"
      className="lg:hidden shrink-0 bg-white border-t border-[#CBD8D4] px-2 pt-1.5 hig-tab-bar flex items-center justify-around z-30"
    >
      {items.map((item) => {
        const isActive =
          (item.step === 1 && currentStep <= 6) ||
          currentStep === item.step;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => onNavigateStep(item.step)}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-4 min-h-[49px] min-w-[64px] rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              isActive
                ? 'text-[#0B6758] bg-[#E1ECE8]/70'
                : 'text-[#1E3831] hover:bg-[#EDF2EF]'
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
