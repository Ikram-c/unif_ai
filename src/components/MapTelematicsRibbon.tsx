import React, { useState } from 'react';
import {
  Activity,
  Battery,
  Compass,
  Download,
  Flame,
  Heart,
  Navigation,
  Radio,
  Satellite,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Wind,
  Zap,
} from 'lucide-react';
import { TacticalTeam } from '../types';
import { Card, StatusBadge } from './Common';

interface MapTelematicsRibbonProps {
  teams: TacticalTeam[];
  selectedTeamId: string | null;
  onSelectTeam: (teamId: string) => void;
  onSimulateDriftToggle: () => void;
  isSimulatingDrift: boolean;
  onTriggerUavDetection: () => void;
  onTriggerWeatherFlare: () => void;
  onExportAuditLog: () => void;
}

export const MapTelematicsRibbon: React.FC<MapTelematicsRibbonProps> = ({
  teams,
  selectedTeamId,
  onSelectTeam,
  onSimulateDriftToggle,
  isSimulatingDrift,
  onTriggerUavDetection,
  onTriggerWeatherFlare,
  onExportAuditLog,
}) => {
  const [isPitchDrawerOpen, setIsPitchDrawerOpen] = useState(false);

  // Active selected team or first team
  const activeTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];
  const telematics = activeTeam?.telematics;

  return (
    <div className="space-y-2">
      {/* Top Strip: Team Quick-Selector & Live Telematics Cards */}
      <div className="bg-[#1C2E2A] text-white rounded-xl p-3 border border-[#0B6758]/50 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2D4540] pb-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <Activity size={15} className="text-[#10B981]" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#A4D0C8]">
              Live Map Telematics & Biometrics
            </span>
            <span className="text-[10px] bg-[#269584]/30 text-[#86EFAC] px-2 py-0.5 rounded font-mono font-bold">
              OS Grid RTK · 1000ms Poll
            </span>
          </div>

          {/* Quick Team Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {teams.map((t) => {
              const isSelected = t.id === activeTeam.id;
              const hasAlert = t.isDrifted;
              const isLowBattery =
                (t.batteryPct !== undefined && t.batteryPct <= 25) || t.endurancePct <= 25;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTeam(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    isSelected
                      ? hasAlert
                        ? 'bg-[#DC2626] text-white ring-2 ring-red-400'
                        : isLowBattery
                        ? 'bg-[#D97706] text-white ring-2 ring-amber-300'
                        : 'bg-[#0B6758] text-white ring-1 ring-[#86EFAC]'
                      : hasAlert
                      ? 'bg-[#DC2626]/20 text-[#FCA5A5] border border-red-500/50 hover:bg-[#DC2626]/30'
                      : isLowBattery
                      ? 'bg-[#D97706]/20 text-amber-300 border border-amber-500/50 hover:bg-[#D97706]/30'
                      : 'bg-[#2A3E39] text-gray-300 hover:bg-[#344F48]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      hasAlert
                        ? 'bg-red-400 animate-ping'
                        : isLowBattery
                        ? 'bg-amber-400 animate-pulse'
                        : isSelected
                        ? 'bg-[#86EFAC]'
                        : 'bg-gray-400'
                    }`}
                  />
                  <span>{t.callsign}</span>
                  {hasAlert && <span className="text-[9px] text-white font-extrabold uppercase">!DRIFT</span>}
                  {!hasAlert && isLowBattery && (
                    <span className="text-[9px] text-amber-200 font-extrabold uppercase">!BATT</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Telematics Row for Selected Asset */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-mono">
          {/* OS Grid & Lat/Lon */}
          <div className="bg-[#142320] p-2 rounded-lg border border-[#2D4540]">
            <div className="text-[10px] text-[#86A8A1] uppercase font-sans font-bold flex items-center gap-1">
              <Navigation size={11} className="text-[#0B6758]" />
              <span>OS Grid / WGS84</span>
            </div>
            <div className="font-bold text-[#E1ECE8] mt-0.5 text-xs">
              {telematics?.osGridRef || 'SN 9864 2138'}
            </div>
            <div className="text-[10px] text-gray-400">
              {activeTeam.position.lat.toFixed(4)}°N, {Math.abs(activeTeam.position.lon).toFixed(4)}°W
            </div>
          </div>

          {/* Elevation & Gradient */}
          <div className="bg-[#142320] p-2 rounded-lg border border-[#2D4540]">
            <div className="text-[10px] text-[#86A8A1] uppercase font-sans font-bold flex items-center gap-1">
              <Compass size={11} className="text-[#0B6758]" />
              <span>Altitude / Heading</span>
            </div>
            <div className="font-bold text-[#E1ECE8] mt-0.5 text-xs">
              {telematics?.altitudeM || 685}m ASL
            </div>
            <div className="text-[10px] text-gray-400">
              {telematics?.headingDeg || 38}° {telematics?.headingCardinal || 'NE'} · {activeTeam.speedKmh} km/h
            </div>
          </div>

          {/* Radio Link & RSSI */}
          <div className="bg-[#142320] p-2 rounded-lg border border-[#2D4540]">
            <div className="text-[10px] text-[#86A8A1] uppercase font-sans font-bold flex items-center gap-1">
              <Radio size={11} className="text-[#0B6758]" />
              <span>Radio Telemetry</span>
            </div>
            <div className="font-bold text-[#E1ECE8] mt-0.5 text-xs flex items-center gap-1">
              <span>{telematics?.radioRssiDb || -74} dBm</span>
              <span className="text-[9px] text-[#86EFAC] font-normal">(-85 min)</span>
            </div>
            <div className="text-[10px] text-gray-400 truncate">
              {activeTeam.radioChannel}
            </div>
          </div>

          {/* Biometrics / Power */}
          <div className="bg-[#142320] p-2 rounded-lg border border-[#2D4540]">
            <div className="text-[10px] text-[#86A8A1] uppercase font-sans font-bold flex items-center gap-1">
              {activeTeam.type === 'AIR_UAV' ? (
                <Battery size={11} className="text-[#10B981]" />
              ) : (
                <Heart size={11} className="text-[#EF4444]" />
              )}
              <span>{activeTeam.type === 'AIR_UAV' ? 'Battery & V' : 'Responder Vitals'}</span>
            </div>
            <div className="font-bold text-[#E1ECE8] mt-0.5 text-xs">
              {activeTeam.type === 'AIR_UAV'
                ? `${activeTeam.batteryPct || 78}% · ${telematics?.batteryVoltage || 22.4}V`
                : `${telematics?.heartRateBpm || 114} bpm`}
            </div>
            <div className="text-[10px] text-gray-400">
              {activeTeam.type === 'AIR_UAV' ? 'Remaining: 24 min' : 'Exertion: Moderate (Zone 3)'}
            </div>
          </div>

          {/* GPS Constellation */}
          <div className="bg-[#142320] p-2 rounded-lg border border-[#2D4540]">
            <div className="text-[10px] text-[#86A8A1] uppercase font-sans font-bold flex items-center gap-1">
              <Satellite size={11} className="text-[#0B6758]" />
              <span>GNSS Constellation</span>
            </div>
            <div className="font-bold text-[#E1ECE8] mt-0.5 text-xs">
              {telematics?.gpsLockSats || 16} Sats (RTK Fix)
            </div>
            <div className="text-[10px] text-[#86EFAC]">
              Accuracy: ±1.2m CEP
            </div>
          </div>

          {/* Geofence Boundary Status */}
          <div
            className={`p-2 rounded-lg border ${
              activeTeam.isDrifted
                ? 'bg-[#DC2626]/20 border-red-500 animate-pulse'
                : 'bg-[#142320] border-[#2D4540]'
            }`}
          >
            <div className="text-[10px] text-[#86A8A1] uppercase font-sans font-bold flex items-center gap-1">
              {activeTeam.isDrifted ? (
                <ShieldAlert size={11} className="text-[#EF4444]" />
              ) : (
                <ShieldCheck size={11} className="text-[#10B981]" />
              )}
              <span>Geofence Status</span>
            </div>
            <div
              className={`font-bold mt-0.5 text-xs ${
                activeTeam.isDrifted ? 'text-red-400' : 'text-[#86EFAC]'
              }`}
            >
              {activeTeam.isDrifted ? 'BOUNDARY BREACH' : 'WITHIN SECTOR'}
            </div>
            <div className="text-[10px] text-gray-400 truncate">
              {activeTeam.isDrifted
                ? `+${activeTeam.telematics?.driftDistanceM || 185}m breach`
                : activeTeam.sector}
            </div>
          </div>
        </div>

        {/* Pitch Showcase / Interactive Triggers Drawer */}
        <div className="mt-2.5 pt-2 border-t border-[#2D4540] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-sans text-gray-300 font-semibold flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#F5A623]" />
              <span>MVP Pitch Triggers:</span>
            </span>

            <button
              type="button"
              onClick={onSimulateDriftToggle}
              className={`px-2.5 py-1 rounded text-[11px] font-sans font-bold flex items-center gap-1 transition-colors ${
                isSimulatingDrift
                  ? 'bg-[#DC2626] text-white hover:bg-red-700'
                  : 'bg-[#2A3E39] text-[#A4D0C8] hover:bg-[#344F48] border border-[#0B6758]/50'
              }`}
            >
              <Zap size={11} />
              <span>{isSimulatingDrift ? 'Stop Drift' : '1. Simulate Drift (Bravo)'}</span>
            </button>

            <button
              type="button"
              onClick={onTriggerUavDetection}
              className="px-2.5 py-1 rounded text-[11px] font-sans font-bold bg-[#2A3E39] text-[#A4D0C8] hover:bg-[#344F48] border border-[#0B6758]/50 flex items-center gap-1 transition-colors"
            >
              <Flame size={11} className="text-[#F5A623]" />
              <span>2. Trigger UAV FLIR Hit</span>
            </button>

            <button
              type="button"
              onClick={onTriggerWeatherFlare}
              className="px-2.5 py-1 rounded text-[11px] font-sans font-bold bg-[#2A3E39] text-[#A4D0C8] hover:bg-[#344F48] border border-[#0B6758]/50 flex items-center gap-1 transition-colors"
            >
              <Wind size={11} className="text-[#8ED0FF]" />
              <span>3. Summit Gale (Ground UAV)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onExportAuditLog}
            className="px-2.5 py-1 rounded text-[11px] font-sans font-bold bg-[#0B6758] hover:bg-[#07483D] text-white flex items-center gap-1 transition-colors shadow-xs"
          >
            <Download size={11} />
            <span>2 C.F.R. § 200 Telemetry Log</span>
          </button>
        </div>
      </div>
    </div>
  );
};
