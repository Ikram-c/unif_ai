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
    color: string;
  }> = [
    {
      key: 'viabilityHeatmap',
      label: 'Causality Viability',
      icon: <Flame size={14} />,
      color: '#0B6758',
    },
    {
      key: 'hexGrid',
      label: 'Hex Grid',
      icon: <Hexagon size={14} />,
      color: '#07483D',
    },
    {
      key: 'sectors',
      label: 'Search Sectors',
      icon: <Compass size={14} />,
      color: '#269584',
    },
    {
      key: 'wanderContours',
      label: 'Wander Rings',
      icon: <Layers size={14} />,
      color: '#57BCAE',
    },
    {
      key: 'teamPositions',
      label: 'Team GPS',
      icon: <Users size={14} />,
      color: '#0B6758',
    },
    {
      key: 'teamTracks',
      label: 'Breadcrumb Tracks',
      icon: <Footprints size={14} />,
      color: '#9A690B',
    },
    {
      key: 'uavFlightPath',
      label: 'UAV Survey Swath',
      icon: <Radio size={14} />,
      color: '#16A34A',
    },
    {
      key: 'terrainHazards',
      label: 'Crags & Hazards',
      icon: <AlertTriangle size={14} />,
      color: '#DC2626',
    },
  ];

  if (isCompact) {
    return (
      <div
        className={`flex flex-wrap items-center gap-1.5 p-1.5 bg-white/95 backdrop-blur-xs border border-[#E2E8E5] rounded-xl shadow-xs text-xs ${className}`}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A706A] px-1 flex items-center gap-1">
          <Eye size={12} className="text-[#0B6758]" />
          <span>Overlays</span>
        </span>
        {layerButtons.map((btn) => {
          const isActive = toggles[btn.key];
          return (
            <button
              key={btn.key}
              type="button"
              onClick={() => onToggle(btn.key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 border ${
                isActive
                  ? 'bg-[#0B6758] text-white border-[#0B6758] shadow-xs'
                  : 'bg-white text-[#5A706A] border-[#E2E8E5] hover:bg-[#F4F6F5] hover:text-[#1C2E2A]'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-[#5A706A]'}>{btn.icon}</span>
              <span className="whitespace-nowrap">{btn.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-[#E2E8E5] rounded-xl p-3 shadow-xs space-y-2.5 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-[#E2E8E5] pb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A] flex items-center gap-1.5">
          <Layers size={15} className="text-[#0B6758]" />
          <span>Tactical Map Overlays</span>
        </span>
        <span className="text-[11px] font-mono text-[#5A706A]">
          {Object.values(toggles).filter(Boolean).length} / {layerButtons.length} active
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {layerButtons.map((btn) => {
          const isActive = toggles[btn.key];
          return (
            <button
              key={btn.key}
              type="button"
              onClick={() => onToggle(btn.key)}
              className={`p-2 rounded-lg text-left text-xs transition-all flex items-center justify-between border ${
                isActive
                  ? 'bg-[#E1ECE8] border-[#0B6758] text-[#07483D] font-bold shadow-2xs'
                  : 'bg-[#F4F6F5] border-[#E2E8E5] text-[#5A706A] hover:bg-[#EAEFEA] hover:text-[#1C2E2A]'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className={isActive ? 'text-[#0B6758]' : 'text-[#5A706A]'}>{btn.icon}</span>
                <span className="text-[11px] truncate">{btn.label}</span>
              </div>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ml-1.5 ${
                  isActive ? 'bg-[#0B6758]' : 'bg-[#D1DDD9]'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
