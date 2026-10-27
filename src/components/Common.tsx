import React, { useEffect, useState } from 'react';
import { ServerStatus } from '../types';
import { rescueRepository } from '../data/RescueRepository';

export const AberTechHeader: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`w-full text-center text-xs text-white/90 font-medium tracking-wide py-2 ${className}`}>
    Designed by AberTech
  </div>
);

export const ServerStatusBar: React.FC<{ status?: ServerStatus; onRefresh?: () => void }> = ({
  status: propStatus,
  onRefresh,
}) => {
  const [status, setStatus] = useState<ServerStatus>(propStatus || rescueRepository.currentStatus);

  useEffect(() => {
    if (propStatus) {
      setStatus(propStatus);
      return;
    }
    return rescueRepository.subscribeStatus(setStatus);
  }, [propStatus]);

  const dotColor =
    status.state === 'ONLINE'
      ? '#34C759'
      : status.state === 'DEMO'
      ? '#F5A623'
      : '#D9D9D9';

  return (
    <div className="w-full bg-[#5B5B5B] px-4 py-3 pb-4">
      <div
        onClick={onRefresh || (() => rescueRepository.checkHealth())}
        className="w-full flex items-center bg-[#2B2B2B] rounded-md px-4 py-2.5 shadow-sm cursor-pointer hover:bg-[#323232] transition-colors"
        title="Tap to refresh connection status"
      >
        <div
          className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center transition-colors"
          style={{ backgroundColor: dotColor }}
        >
          {status.state === 'CHECKING' && (
            <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
          )}
        </div>
        <div className="ml-5 flex flex-col text-left overflow-hidden">
          <span className="text-white text-sm font-semibold tracking-wide">
            Server Connection Status
          </span>
          <span className="text-[#D9D9D9] text-xs truncate">{status.detail}</span>
        </div>
      </div>
    </div>
  );
};

export const SrScaffold: React.FC<{
  topBar?: React.ReactNode;
  children: React.ReactNode;
  noBottomBar?: boolean;
}> = ({ topBar, children, noBottomBar = false }) => {
  return (
    <div className="flex flex-col h-screen w-full bg-[#5B5B5B] text-white overflow-hidden select-none">
      {topBar && <div className="shrink-0">{topBar}</div>}
      <div className="flex-1 overflow-y-auto relative flex flex-col">
        {children}
      </div>
      {!noBottomBar && (
        <div className="shrink-0">
          <ServerStatusBar />
        </div>
      )}
    </div>
  );
};

export const CircleButton: React.FC<{
  size?: number | string;
  onClick?: () => void;
  disabled?: boolean;
  background?: string;
  className?: string;
  children: React.ReactNode;
}> = ({
  size = 148,
  onClick,
  disabled = false,
  background = '#383838',
  className = '',
  children,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        backgroundColor: background,
      }}
      className={`rounded-full shrink-0 flex items-center justify-center shadow-lg transition-all active:scale-95 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
};

export const LabelChip: React.FC<{ text: string; className?: string }> = ({
  text,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center bg-[#2B2B2B] text-white rounded-lg px-4 py-2 text-base font-medium shadow tracking-wide ${className}`}
    >
      {text}
    </div>
  );
};

export const PrimaryButton: React.FC<{
  text: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}> = ({ text, onClick, disabled = false, className = '' }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-15 rounded-xl border-2 border-[#D9D9D9] bg-[#5B5B5B] text-[#D9D9D9] text-2xl font-normal flex items-center justify-center transition-all hover:bg-[#686868] active:scale-[0.99] disabled:opacity-45 disabled:cursor-not-allowed ${className}`}
    >
      {text}
    </button>
  );
};

export const SectionCard: React.FC<{
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className = '' }) => {
  return (
    <div
      className={`w-full bg-[#383838] rounded-xl p-3.5 shadow-md flex flex-col gap-2 ${className}`}
    >
      <h3 className="text-white font-bold text-base tracking-wide border-b border-white/10 pb-1.5">
        {title}
      </h3>
      <div className="flex flex-col gap-1.5 text-sm">{children}</div>
    </div>
  );
};

export const KeyValueRow: React.FC<{
  keyName: string;
  value: React.ReactNode;
  valueColor?: string;
}> = ({ keyName, value, valueColor = '#FFFFFF' }) => {
  return (
    <div className="flex items-center justify-between py-0.5 text-xs sm:text-sm">
      <span className="text-[#D9D9D9] font-normal">{keyName}</span>
      <span className="font-semibold text-right" style={{ color: valueColor }}>
        {value}
      </span>
    </div>
  );
};

export const LoadingRing: React.FC<{
  size?: number;
  strokeWidth?: number;
  spinning?: boolean;
  trackColor?: string;
  arcColor?: string;
  className?: string;
}> = ({
  size = 56,
  strokeWidth = 7,
  spinning = false,
  trackColor = '#E6DEF5',
  arcColor = '#6B5AA6',
  className = '',
}) => {
  return (
    <div
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`relative inline-flex items-center justify-center shrink-0 ${
        spinning ? 'animate-spin' : ''
      } ${className}`}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" className="w-full h-full">
        {/* Lavender track arc */}
        <circle
          cx="50"
          cy="50"
          r={50 - strokeWidth * 2}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth * 2}
          strokeDasharray="210 60"
          strokeDashoffset="30"
          strokeLinecap="round"
        />
        {/* Violet indicator arc */}
        <circle
          cx="50"
          cy="50"
          r={50 - strokeWidth * 2}
          fill="none"
          stroke={arcColor}
          strokeWidth={strokeWidth * 2}
          strokeDasharray="65 205"
          strokeDashoffset="10"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export const SrIcons = {
  Mountain: ({ className = 'w-16 h-16', color = '#FFFFFF' }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none">
      {/* Mountain outline */}
      <polygon
        points="10,85 45,25 65,58 75,42 90,85"
        fill={color}
        stroke="#2B2B2B"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Snow peak 1 */}
      <polygon points="45,25 36,40 43,45 52,37" fill="#E6DEF5" />
      {/* Snow peak 2 */}
      <polygon points="75,42 70,52 76,55 81,49" fill="#E6DEF5" />
    </svg>
  ),

  Footprints: ({ className = 'w-16 h-16', color = '#141414' }) => (
    <svg viewBox="0 0 100 100" className={className} fill={color}>
      {/* Left footprint */}
      <g transform="translate(18, 15) rotate(-10)">
        <ellipse cx="14" cy="40" rx="8" ry="16" />
        <ellipse cx="13" cy="62" rx="6" ry="8" />
        <circle cx="9" cy="18" r="3" />
        <circle cx="15" cy="19" r="2.8" />
        <circle cx="20" cy="22" r="2.4" />
        <circle cx="23" cy="27" r="2" />
        <circle cx="25" cy="32" r="1.6" />
      </g>
      {/* Right footprint */}
      <g transform="translate(48, 5) rotate(10)">
        <ellipse cx="14" cy="40" rx="8" ry="16" />
        <ellipse cx="15" cy="62" rx="6" ry="8" />
        <circle cx="19" cy="18" r="3" />
        <circle cx="13" cy="19" r="2.8" />
        <circle cx="8" cy="22" r="2.4" />
        <circle cx="5" cy="27" r="2" />
        <circle cx="3" cy="32" r="1.6" />
      </g>
    </svg>
  ),

  Car: ({ className = 'w-16 h-16', color = '#141414' }) => (
    <svg viewBox="0 0 100 100" className={className} fill={color}>
      <path d="M15,55 L25,32 Q28,26 38,26 L62,26 Q72,26 75,32 L85,55 C88,57 90,62 90,66 L90,75 C90,77 88,78 86,78 L80,78 C78,78 76,77 76,75 L76,70 L24,70 L24,75 C24,77 22,78 20,78 L14,78 C12,78 10,77 10,75 L10,66 C10,62 12,57 15,55 Z" />
      {/* Windshield */}
      <path d="M30,34 L70,34 L76,50 L24,50 Z" fill="#D9D9D9" />
      {/* Headlights */}
      <circle cx="22" cy="60" r="4" fill="#F2D06B" />
      <circle cx="78" cy="60" r="4" fill="#F2D06B" />
    </svg>
  ),

  Drone: ({ className = 'w-16 h-16', color = '#141414' }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke={color} strokeWidth="5">
      {/* Drone arms */}
      <line x1="25" y1="25" x2="75" y2="75" strokeLinecap="round" />
      <line x1="75" y1="25" x2="25" y2="75" strokeLinecap="round" />
      {/* Center body */}
      <rect x="40" y="40" width="20" height="20" rx="6" fill={color} stroke="none" />
      {/* Camera eye */}
      <circle cx="50" cy="50" r="4" fill="#86EFAC" stroke="none" />
      {/* 4 Rotors */}
      <circle cx="22" cy="22" r="12" strokeDasharray="6 4" strokeWidth="3" />
      <circle cx="78" cy="22" r="12" strokeDasharray="6 4" strokeWidth="3" />
      <circle cx="22" cy="78" r="12" strokeDasharray="6 4" strokeWidth="3" />
      <circle cx="78" cy="78" r="12" strokeDasharray="6 4" strokeWidth="3" />
    </svg>
  ),

  Satellite: ({ className = 'w-16 h-16', color = '#D9D9D9' }) => (
    <svg viewBox="0 0 100 100" className={className} fill={color} stroke="#141414" strokeWidth="2">
      {/* Solar panel left */}
      <rect x="8" y="38" width="24" height="24" rx="2" fill="#7DD3FC" />
      <line x1="8" y1="50" x2="32" y2="50" stroke="#141414" strokeWidth="1" />
      <line x1="20" y1="38" x2="20" y2="62" stroke="#141414" strokeWidth="1" />
      {/* Connector left */}
      <rect x="32" y="47" width="8" height="6" fill="#D9D9D9" />
      {/* Satellite body */}
      <rect x="40" y="35" width="20" height="30" rx="3" fill="#D9D9D9" />
      {/* Dish */}
      <path d="M50,22 Q58,26 62,35" stroke="#D9D9D9" strokeWidth="3" fill="none" />
      <circle cx="50" cy="22" r="3" fill="#F2D06B" />
      {/* Connector right */}
      <rect x="60" y="47" width="8" height="6" fill="#D9D9D9" />
      {/* Solar panel right */}
      <rect x="68" y="38" width="24" height="24" rx="2" fill="#7DD3FC" />
      <line x1="68" y1="50" x2="92" y2="50" stroke="#141414" strokeWidth="1" />
      <line x1="80" y1="38" x2="80" y2="62" stroke="#141414" strokeWidth="1" />
    </svg>
  ),
};
