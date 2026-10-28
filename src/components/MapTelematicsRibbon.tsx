import React from 'react';
import {
  Battery,
  BatteryWarning,
  Compass,
  Crosshair,
  Download,
  FastForward,
  Flame,
  Heart,
  Navigation,
  Pause,
  Play,
  Radio,
  Satellite,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wind,
  Zap,
} from 'lucide-react';
import { TacticalTeam, TacticalTeamStatus } from '../types';
import { TeamBatteryPill } from './TeamStatusSummaries';

interface MapTelematicsRibbonProps {
  teams: TacticalTeam[];
  selectedTeamId: string | null;
  onSelectTeam: (teamId: string) => void;
  isLiveTracking: boolean;
  onToggleLiveTracking: () => void;
  trackingSpeed: 1 | 2 | 5;
  onChangeTrackingSpeed: (speed: 1 | 2 | 5) => void;
  onStepPositionsOnce: () => void;
  onUpdateTeamStatus: (teamId: string, status: TacticalTeamStatus) => void;
  onPingTeamRadio: (teamId: string) => void;
  isDispatchingWaypoint: boolean;
  onToggleDispatchWaypoint: () => void;
  onSimulateDriftToggle: () => void;
  isSimulatingDrift: boolean;
  onTriggerUavDetection: () => void;
  onTriggerWeatherFlare: () => void;
  onToggleBatteryDrain?: () => void;
  isSimulatingLowBattery?: boolean;
  onExportAuditLog: () => void;
}

const STATUS_OPTIONS: TacticalTeamStatus[] = [
  'In progress',
  'Ready',
  'Holding',
  'Returning',
  'SOS / Assist',
];

export const MapTelematicsRibbon: React.FC<MapTelematicsRibbonProps> = ({
  teams,
  selectedTeamId,
  onSelectTeam,
  isLiveTracking,
  onToggleLiveTracking,
  trackingSpeed,
  onChangeTrackingSpeed,
  onStepPositionsOnce,
  onUpdateTeamStatus,
  onPingTeamRadio,
  isDispatchingWaypoint,
  onToggleDispatchWaypoint,
  onSimulateDriftToggle,
  isSimulatingDrift,
  onTriggerUavDetection,
  onTriggerWeatherFlare,
  onToggleBatteryDrain,
  isSimulatingLowBattery = false,
  onExportAuditLog,
}) => {
  const activeTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];
  const telematics = activeTeam?.telematics;
  const activeBatteryVal =
    activeTeam.batteryPct !== undefined ? activeTeam.batteryPct : activeTeam.endurancePct;
  const isActiveBatteryCritical = activeBatteryVal < 20;

  return (
    <div className="tactical-card rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Top Control Bar: Live Position Tracking Engine & Team Selector */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 border-b border-[#CBD8D4] pb-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isLiveTracking ? 'bg-[#16A34A] animate-ping' : 'bg-[#D97706]'
              }`}
            />
            <h2 className="text-base font-bold text-[#081820]">
              Live Position &amp; Unit Telematics
            </h2>
          </div>

          {/* Live Stream Transport Controls (All targets >= 40-44px) */}
          <div className="inline-flex items-center bg-[#EDF2EF] border border-[#B8C9C3] rounded-xl p-1 gap-1">
            <button
              type="button"
              role="switch"
              aria-checked={isLiveTracking}
              onClick={onToggleLiveTracking}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isLiveTracking
                  ? 'bg-[#0B6758] text-white'
                  : 'bg-[#FEF3DD] text-[#78350F] border border-[#D97706]'
              }`}
              title={isLiveTracking ? 'Pause live GPS position stream' : 'Resume live GPS position stream'}
            >
              {isLiveTracking ? <Pause size={13} /> : <Play size={13} />}
              <span>{isLiveTracking ? 'Live Stream' : 'Paused'}</span>
            </button>

            {([1, 2, 5] as const).map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => onChangeTrackingSpeed(spd)}
                className={`min-h-[38px] min-w-[40px] px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer tabular-nums ${
                  trackingSpeed === spd
                    ? 'bg-[#081820] text-[#FACC15]'
                    : 'text-[#081820] hover:bg-white'
                }`}
                title={`Set live position update rate to ${spd}x`}
              >
                {spd}x
              </button>
            ))}

            <button
              type="button"
              onClick={onStepPositionsOnce}
              className="min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold text-[#081820] hover:bg-white flex items-center gap-1 transition-colors cursor-pointer"
              title="Advance all active team positions by one kinematic step"
            >
              <FastForward size={13} />
              <span>+Step</span>
            </button>
          </div>
        </div>

        {/* Segmented Unit Selector Pills (Selection r >= 14pt / rounded-full) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0">
          {teams.map((t) => {
            const isSelected = t.id === activeTeam.id;
            const isSos = t.status === 'SOS / Assist';
            const hasAlert = t.isDrifted || isSos;
            const battVal = t.batteryPct !== undefined ? t.batteryPct : t.endurancePct;
            const isBatteryCritical = battVal < 20;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTeam(t.id)}
                className={`min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer border ${
                  isBatteryCritical
                    ? 'bg-[#FEE2E2] text-[#991B1B] border-[#DC2626] animate-pulse'
                    : isSelected
                    ? hasAlert
                      ? 'bg-[#DC2626] text-white border-[#991B1B]'
                      : 'bg-[#081820] text-white border-[#081820]'
                    : hasAlert
                    ? 'bg-[#FEE2E2] text-[#991B1B] border-[#DC2626]'
                    : 'bg-[#F6F9F7] text-[#081820] border-[#B8C9C3] hover:bg-[#E1ECE8]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    hasAlert || isBatteryCritical
                      ? 'bg-[#DC2626] animate-ping'
                      : t.speedKmh > 0 && t.status === 'In progress'
                      ? 'bg-[#16A34A]'
                      : 'bg-[#64748B]'
                  }`}
                />
                <span>{t.callsign}</span>
                <TeamBatteryPill
                  percentage={battVal}
                  size="sm"
                  showLabel={false}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Team Status & Direct Command Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#F6F9F7] border border-[#CBD8D4] rounded-xl p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#1E3831]">
            Unit {activeTeam.callsign} Status:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_OPTIONS.map((st) => {
              const active = activeTeam.status === st;
              const isSosBtn = st === 'SOS / Assist';
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => onUpdateTeamStatus(activeTeam.id, st)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                    active
                      ? isSosBtn
                        ? 'bg-[#DC2626] text-white border-[#991B1B]'
                        : 'bg-[#0B6758] text-white border-[#085446]'
                      : isSosBtn
                      ? 'bg-white text-[#991B1B] border-[#FCA5A5] hover:bg-[#FEE2E2]'
                      : 'bg-white text-[#081820] border-[#B8C9C3] hover:bg-[#E1ECE8]'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleDispatchWaypoint}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
              isDispatchingWaypoint
                ? 'bg-[#FACC15] text-[#081820] border-[#CA8A04]'
                : 'bg-[#0B6758] text-white border-[#085446] hover:bg-[#085446]'
            }`}
            title="Click anywhere on the tactical map to assign a new destination waypoint for this team"
          >
            <Crosshair size={15} />
            <span>
              {isDispatchingWaypoint
                ? `Click Map to Vector ${activeTeam.callsign}...`
                : `Vector ${activeTeam.callsign} on Map`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onPingTeamRadio(activeTeam.id)}
            className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-white text-[#081820] border border-[#8BA39B] hover:bg-[#EDF2EF] flex items-center gap-2 transition-colors cursor-pointer"
            title="Transmit immediate VHF/Data Link telemetry poll"
          >
            <Radio size={15} className="text-[#0B6758]" />
            <span>Ping Radio Check</span>
          </button>
        </div>
      </div>

      {/* 6-Column Tabular Telemetry Grid for Active Team (High Contrast CR >= 4.5:1) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-mono tabular-nums">
        {/* 1. OS Grid & WGS84 */}
        <div className="bg-[#F6F9F7] p-3 rounded-xl border border-[#CBD8D4]">
          <div className="text-xs font-sans font-bold text-[#1E3831] flex items-center gap-1.5">
            <Navigation size={13} className="text-[#0B6758]" />
            <span>OS Grid / WGS84</span>
          </div>
          <div className="font-bold text-[#081820] mt-1 text-sm tabular-nums">
            {telematics?.osGridRef || 'SN 9864 2138'}
          </div>
          <div className="text-xs text-[#1E3831] tabular-nums mt-0.5">
            {activeTeam.position.lat.toFixed(4)}°N, {Math.abs(activeTeam.position.lon).toFixed(4)}°W
          </div>
        </div>

        {/* 2. Kinematics: Heading, Speed, Altitude */}
        <div className="bg-[#F6F9F7] p-3 rounded-xl border border-[#CBD8D4]">
          <div className="text-xs font-sans font-bold text-[#1E3831] flex items-center gap-1.5">
            <Compass size={13} className="text-[#0B6758]" />
            <span>Vector &amp; Speed</span>
          </div>
          <div className="font-bold text-[#081820] mt-1 text-sm tabular-nums">
            {telematics?.headingDeg ?? 38}° {telematics?.headingCardinal || 'NE'} · {activeTeam.speedKmh.toFixed(1)} km/h
          </div>
          <div className="text-xs text-[#1E3831] tabular-nums mt-0.5">
            Alt {telematics?.altitudeM || 685}m · {telematics?.distanceTraveledKm?.toFixed(2) || '1.20'} km
          </div>
        </div>

        {/* 3. Radio Link & Last Check-In */}
        <div className="bg-[#F6F9F7] p-3 rounded-xl border border-[#CBD8D4]">
          <div className="text-xs font-sans font-bold text-[#1E3831] flex items-center gap-1.5">
            <Radio size={13} className="text-[#0B6758]" />
            <span>RF Telemetry</span>
          </div>
          <div className="font-bold text-[#081820] mt-1 text-sm tabular-nums">
            {telematics?.radioRssiDb || -74} dBm · {activeTeam.lastCheckInUtc.split(' ')[0]}
          </div>
          <div className="text-xs text-[#1E3831] truncate mt-0.5 font-sans">
            {activeTeam.radioChannel}
          </div>
        </div>

        {/* 4. Biometrics / Power */}
        <div
          className={`p-3 rounded-xl border transition-all ${
            isActiveBatteryCritical
              ? 'bg-[#FEF2F2] border-[#DC2626] animate-battery-warning'
              : 'bg-[#F6F9F7] border-[#CBD8D4]'
          }`}
        >
          <div className="text-xs font-sans font-bold text-[#1E3831] flex items-center gap-1.5">
            {isActiveBatteryCritical ? (
              <BatteryWarning size={14} className="text-[#DC2626]" />
            ) : activeTeam.type === 'AIR_UAV' ? (
              <Battery size={13} className="text-[#0B6758]" />
            ) : (
              <Heart size={13} className="text-[#DC2626]" />
            )}
            <span className={isActiveBatteryCritical ? 'text-[#991B1B] font-bold' : ''}>
              {isActiveBatteryCritical
                ? 'Critical Power'
                : activeTeam.type === 'AIR_UAV'
                ? 'Airframe Power'
                : 'Responder Vitals'}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-1.5 flex-wrap">
            <TeamBatteryPill
              percentage={activeBatteryVal}
              size="sm"
              showLabel={false}
            />
            <span className="font-bold text-xs text-[#081820] tabular-nums">
              {activeTeam.type === 'AIR_UAV'
                ? `${telematics?.batteryVoltage || 22.4}V`
                : `${telematics?.heartRateBpm || 114} bpm`}
            </span>
          </div>
          <div className="text-xs text-[#1E3831] tabular-nums mt-0.5 font-sans">
            {isActiveBatteryCritical
              ? 'Warning: <20% reserve'
              : `Personnel: ${activeTeam.personnel} deployed`}
          </div>
        </div>

        {/* 5. GNSS Constellation & Waypoint ETA */}
        <div className="bg-[#F6F9F7] p-3 rounded-xl border border-[#CBD8D4]">
          <div className="text-xs font-sans font-bold text-[#1E3831] flex items-center gap-1.5">
            <Satellite size={13} className="text-[#0B6758]" />
            <span>GNSS Fix &amp; ETA</span>
          </div>
          <div className="font-bold text-[#081820] mt-1 text-sm tabular-nums">
            {telematics?.gpsLockSats || 16} Sats · ±{telematics?.cepRadiusM?.toFixed(1) || '1.4'}m
          </div>
          <div className="text-xs text-[#064E3B] font-semibold tabular-nums mt-0.5 font-sans">
            {activeTeam.speedKmh > 0
              ? `Waypoint ETA: ${telematics?.etaMinutes || 15} min`
              : 'Stationary hold'}
          </div>
        </div>

        {/* 6. Sector Geofence Status */}
        <div
          className={`p-3 rounded-xl border ${
            activeTeam.isDrifted || activeTeam.status === 'SOS / Assist'
              ? 'bg-[#FEF2F2] border-[#DC2626]'
              : 'bg-[#F6F9F7] border-[#CBD8D4]'
          }`}
        >
          <div className="text-xs font-sans font-bold text-[#1E3831] flex items-center gap-1.5">
            {activeTeam.isDrifted || activeTeam.status === 'SOS / Assist' ? (
              <ShieldAlert size={13} className="text-[#DC2626]" />
            ) : (
              <ShieldCheck size={13} className="text-[#0B6758]" />
            )}
            <span>Sector Geofence</span>
          </div>
          <div
            className={`font-bold mt-1 text-sm font-sans ${
              activeTeam.status === 'SOS / Assist' || activeTeam.isDrifted
                ? 'text-[#DC2626]'
                : 'text-[#064E3B]'
            }`}
          >
            {activeTeam.status === 'SOS / Assist'
              ? 'SOS Emergency'
              : activeTeam.isDrifted
              ? 'Boundary Breach'
              : 'Confined in Hex'}
          </div>
          <div className="text-xs text-[#1E3831] truncate tabular-nums mt-0.5 font-sans">
            {activeTeam.isDrifted
              ? `+${activeTeam.telematics?.driftDistanceM || 185}m out of bounds`
              : activeTeam.sector}
          </div>
        </div>
      </div>

      {/* Bottom Scenario & Audit Triggers Bar (Targets >= 40-44px) */}
      <div className="pt-3 border-t border-[#CBD8D4] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#1E3831] flex items-center gap-1.5">
            <Sparkles size={15} className="text-[#0B6758]" />
            <span>Stress Scenarios:</span>
          </span>

          <button
            type="button"
            onClick={onSimulateDriftToggle}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isSimulatingDrift
                ? 'bg-[#DC2626] text-white border-[#991B1B]'
                : 'bg-[#F6F9F7] text-[#081820] border-[#B8C9C3] hover:bg-[#E1ECE8]'
            }`}
          >
            <Zap size={14} className={isSimulatingDrift ? 'text-white' : 'text-[#D97706]'} />
            <span>{isSimulatingDrift ? 'Resolve Bravo Drift' : '1. Boundary Drift (Bravo)'}</span>
          </button>

          <button
            type="button"
            onClick={onTriggerUavDetection}
            className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F6F9F7] text-[#081820] border border-[#B8C9C3] hover:bg-[#E1ECE8] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Flame size={14} className="text-[#D97706]" />
            <span>2. UAV Thermal Hit</span>
          </button>

          <button
            type="button"
            onClick={onTriggerWeatherFlare}
            className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F6F9F7] text-[#081820] border border-[#B8C9C3] hover:bg-[#E1ECE8] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Wind size={14} className="text-[#0B6758]" />
            <span>3. Summit Gale</span>
          </button>

          {onToggleBatteryDrain && (
            <button
              type="button"
              onClick={onToggleBatteryDrain}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                isSimulatingLowBattery
                  ? 'bg-[#DC2626] text-white border-[#991B1B] animate-pulse'
                  : 'bg-[#F6F9F7] text-[#081820] border-[#B8C9C3] hover:bg-[#E1ECE8]'
              }`}
            >
              <BatteryWarning size={14} className={isSimulatingLowBattery ? 'text-white' : 'text-[#DC2626]'} />
              <span>
                {isSimulatingLowBattery
                  ? 'Restore Alpha Battery (88%)'
                  : '4. Critical Battery (<20%)'}
              </span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onExportAuditLog}
          className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-[#081820] hover:bg-[#1B4D3E] text-white flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Download size={15} />
          <span>Export 2 C.F.R. § 200 Telemetry</span>
        </button>
      </div>
    </div>
  );
};
