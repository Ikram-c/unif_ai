import React from 'react';
import {
  Layers,
  Hexagon,
  Eye,
  Compass,
  Users,
  Footprints,
  Radio,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { MapLayerToggles } from '../types';

interface MapOverlayControlsProps {
  toggles: MapLayerToggles;
  onToggle: (key: keyof MapLayerToggles) => void;
  className?: string;
  isCompact?: boolean;
}

export const MapOverlayControls: React.FC<MapOverlayControlsProps> = ({
  toggles,
  onToggle,
  className = '',
  isCompact = false,
}) => {
  const layerButtons: Array<{
    key: keyof MapLayerToggles;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      key: 'viabilityHeatmap',
      label: 'Causality Viability',
      icon: <Flame size={15} />,
    },
    {
      key: 'hexGrid',
      label: 'Hex Grid',
      icon: <Hexagon size={15} />,
    },
    {
      key: 'sectors',
      label: 'Search Sectors',
      icon: <Compass size={15} />,
    },
    {
      key: 'wanderContours',
      label: 'Wander Rings',
      icon: <Layers size={15} />,
    },
    {
      key: 'teamPositions',
      label: 'Team GPS',
      icon: <Users size={15} />,
    },
    {
      key: 'teamTracks',
      label: 'Breadcrumb Tracks',
      icon: <Footprints size={15} />,
    },
    {
      key: 'uavFlightPath',
      label: 'UAV Survey Swath',
      icon: <Radio size={15} />,
    },
    {
      key: 'terrainHazards',
      label: 'Crags & Hazards',
      icon: <AlertTriangle size={15} />,
    },
  ];

  if (isCompact) {
    return (
      <div
        className={`flex flex-wrap items-center gap-2 p-2 bg-white/95 backdrop-blur-xs border border-[#CBD8D4] rounded-2xl shadow-xs text-xs ${className}`}
      >
        <span className="text-xs font-bold text-[#1E3831] px-2 flex items-center gap-1.5">
          <Eye size={14} className="text-[#0B6758]" />
          <span>Overlays</span>
        </span>
        {layerButtons.map((btn) => {
          const isActive = toggles[btn.key];
          return (
            <button
              key={btn.key}
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => onToggle(btn.key)}
              className={`min-h-[40px] px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                isActive
                  ? 'bg-[#0B6758] text-white border-[#085446]'
                  : 'bg-white text-[#081820] border-[#B8C9C3] hover:bg-[#EDF2EF]'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-[#0B6758]'}>{btn.icon}</span>
              <span className="whitespace-nowrap">{btn.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`tactical-card rounded-2xl p-4 space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-[#CBD8D4] pb-2.5">
        <span className="text-sm font-bold text-[#081820] flex items-center gap-2">
          <Layers size={17} className="text-[#0B6758]" />
          <span>Tactical Map Overlays</span>
        </span>
        <span className="text-xs font-mono font-semibold text-[#1E3831] tabular-nums">
          {Object.values(toggles).filter(Boolean).length} of {layerButtons.length} active
        </span>
      </div>

      {/* Apple HIG Selection Toggles (Area >= 44pt, immediate binary state feedback) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {layerButtons.map((btn) => {
          const isActive = toggles[btn.key];
          return (
            <button
              key={btn.key}
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => onToggle(btn.key)}
              className={`min-h-[46px] px-3.5 py-2.5 rounded-xl text-left text-xs transition-all flex items-center justify-between border cursor-pointer ${
                isActive
                  ? 'bg-[#E1ECE8] border-[#0B6758] text-[#064E3B] font-bold'
                  : 'bg-[#F6F9F7] border-[#CBD8D4] text-[#081820] font-semibold hover:bg-[#EDF2EF]'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className={isActive ? 'text-[#0B6758]' : 'text-[#1E3831]'}>{btn.icon}</span>
                <span className="truncate">{btn.label}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold shrink-0 ml-1.5 ${
                  isActive
                    ? 'bg-[#0B6758] text-white'
                    : 'bg-[#DCE6E2] text-[#1E3831]'
                }`}
              >
                {isActive ? 'ON' : 'OFF'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
