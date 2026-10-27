import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Info,
  CheckCircle2,
  Radio,
  Clock,
  HardDrive,
  Users,
  Compass,
  FileText,
  Camera,
  Layers,
  ChevronRight,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { ServerStatus } from '../types';
import { rescueRepository } from '../data/RescueRepository';
import { settingsStore } from '../data/SettingsStore';

/**
 * AberTech Logo Badge
 */
export const AberTechBrand: React.FC<{ subtitle?: string; className?: string }> = ({
  subtitle = 'SR Portal',
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-[#0B6758] flex items-center justify-center text-white font-black text-lg tracking-tighter shadow-sm select-none">
        A
      </div>
      <div className="flex flex-col leading-tight select-none">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-[#1C2E2A] text-base tracking-tight">AberTech</span>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E1ECE8] text-[#0B6758] px-1.5 py-0.5 rounded">
            Field
          </span>
        </div>
        <span className="text-xs font-medium text-[#5A706A]">{subtitle}</span>
      </div>
    </div>
  );
};

/**
 * Top Header Status Bars:
 * 1. "Device saved · 12:30 UTC"
 * 2. "Team link offline · last 12:24 UTC (6m ago)"
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
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-[#F4F6F5] border-b border-[#E2E8E5] text-xs">
      <div className="flex items-center gap-2 overflow-x-auto py-0.5">
        {/* Device Local Persistence Pill */}
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E1ECE8] text-[#0B6758] font-medium shrink-0 shadow-2xs cursor-default"
          title="Incident metadata and audit records are saved to encrypted local flash."
        >
          <CheckCircle2 size={13} className="text-[#0B6758] stroke-[2.5]" />
          <span>Device saved · {lastSavedUtc}</span>
        </div>

        {/* Radio Link Connectivity State Pill */}
        <div
          onClick={onRefresh || (() => rescueRepository.checkHealth())}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium shrink-0 shadow-2xs cursor-pointer transition-colors ${
            status.state === 'ONLINE'
              ? 'bg-[#E1ECE8] text-[#0B6758]'
              : 'bg-[#FEF3DD] text-[#9A690B] hover:bg-[#FBE9BE]'
          }`}
          title="Team radio mesh connection. Click to probe connection."
        >
          <Radio size={13} className="stroke-[2.5]" />
          <span>
            {status.state === 'ONLINE'
              ? 'Team link online'
              : `Team link offline · last ${lastRadioCheckUtc}`}
          </span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2 text-[#5A706A] text-[11px] font-mono">
        <HardDrive size={12} />
        <span>{settingsStore.settings.deviceTag} · Bannau pack</span>
      </div>
    </div>
  );
};

/**
 * Step Indicator Bar e.g. "01 / 09 · FIELD WORKSPACE"
 */
export const StepHeader: React.FC<{
  stepNumber: string; // e.g. "01 / 09"
  stepTitle: string; // e.g. "FIELD WORKSPACE"
  missionRef?: string;
}> = ({ stepNumber, stepTitle, missionRef }) => {
  return (
    <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-white border-b border-[#E2E8E5]">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#5A706A]">
        <span className="text-[#0B6758] font-mono font-bold">{stepNumber}</span>
        <span className="text-gray-300">·</span>
        <span className="uppercase text-[#1C2E2A]">{stepTitle}</span>
      </div>
      {missionRef && (
        <span className="text-xs font-mono font-semibold bg-[#E1ECE8] text-[#0B6758] px-2 py-0.5 rounded">
          {missionRef}
        </span>
      )}
    </div>
  );
};

/**
 * Notice and Callout Banners
 */
export const PlanningEstimateNotice: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`bg-[#FEF3DD] border border-[#F3D794] text-[#9A690B] rounded-lg p-3.5 flex items-start gap-3 shadow-2xs ${className}`}
  >
    <AlertTriangle size={18} className="shrink-0 mt-0.5 text-[#9A690B]" />
    <div className="text-xs leading-relaxed">
      <span className="font-bold block mb-0.5">Planning estimate, not evidence</span>
      Probability contours model kinematic reach under the recorded assumptions. They do not confirm
      subject presence in any sector.
    </div>
  </div>
);

export const PrivateByDefaultNotice: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`bg-[#F4F6F5] border border-[#E2E8E5] text-[#5A706A] rounded-lg p-3 flex items-start gap-2.5 ${className}`}
  >
    <Info size={16} className="shrink-0 mt-0.5 text-[#0B6758]" />
    <div className="text-xs leading-relaxed">
      <span className="font-semibold text-[#1C2E2A] block mb-0.5">Private by default</span>
      This device does not broadcast incident metadata until an authorized team or gateway link is
      confirmed. Records are retained locally under 2 C.F.R. § 200.334 rules.
    </div>
  </div>
);

export const ComplianceNotice: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`bg-[#E1ECE8] border border-[#BCE0D7] text-[#0B6758] rounded-lg p-3 flex items-start gap-2.5 ${className}`}
  >
    <ShieldAlert size={16} className="shrink-0 mt-0.5 text-[#0B6758]" />
    <div className="text-xs leading-relaxed">
      <span className="font-semibold block mb-0.5">2 C.F.R. § 200.334 Audit Retention</span>
      Retained on device for 3 years to ensure FEMA AFG and statutory grant compliance. Local
      cryptographic seal generated upon mission closure.
    </div>
  </div>
);

/**
 * Standard Card Component
 */
export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white border border-[#E2E8E5] rounded-xl p-4 sm:p-5 shadow-xs ${
      onClick ? 'cursor-pointer hover:border-[#0B6758] transition-colors' : ''
    } ${className}`}
  >
    {children}
  </div>
);

/**
 * Status Badge
 */
export const StatusBadge: React.FC<{
  type: 'green' | 'amber' | 'red' | 'neutral';
  label: string;
  icon?: React.ReactNode;
  className?: string;
}> = ({ type, label, icon, className = '' }) => {
  const styles = {
    green: 'bg-[#E1ECE8] text-[#0B6758]',
    amber: 'bg-[#FEF3DD] text-[#9A690B]',
    red: 'bg-[#FCEBEB] text-[#A62626]',
    neutral: 'bg-[#F4F6F5] text-[#5A706A] border border-[#E2E8E5]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[type]} ${className}`}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
};

/**
 * Primary & Secondary Buttons
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
    className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-white bg-[#0B6758] hover:bg-[#085446] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-all ${className}`}
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
    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm text-[#1C2E2A] bg-white border border-[#E2E8E5] hover:bg-[#F4F6F5] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all ${className}`}
  >
    {icon}
    <span>{children}</span>
  </button>
);

/**
 * Mobile Bottom Navigation (for phone/narrow tablet)
 */
export const MobileBottomNav: React.FC<{
  currentStep: number;
  onNavigateStep: (step: number) => void;
}> = ({ currentStep, onNavigateStep }) => {
  const items = [
    { label: 'Missions', step: 1, icon: <Layers size={18} /> },
    { label: 'Tactical', step: 7, icon: <Compass size={18} /> },
    { label: 'Evidence', step: 8, icon: <Camera size={18} /> },
    { label: 'Audit', step: 9, icon: <FileText size={18} /> },
  ];

  return (
    <div className="md:hidden shrink-0 bg-white border-t border-[#E2E8E5] px-2 py-1.5 flex items-center justify-around z-30">
      {items.map((item) => {
        const isActive =
          (item.step === 1 && currentStep <= 6 && currentStep !== 7 && currentStep !== 8 && currentStep !== 9) ||
          currentStep === item.step;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => onNavigateStep(item.step)}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-semibold transition-colors ${
              isActive ? 'text-[#0B6758]' : 'text-[#5A706A] hover:text-[#1C2E2A]'
            }`}
          >
            {item.icon}
            <span className="text-[11px]">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
