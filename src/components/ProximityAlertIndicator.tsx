import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Radio,
  Compass,
  ArrowRight,
  ShieldAlert,
  Volume2,
  VolumeX,
  CheckCircle,
  RotateCcw,
  Zap,
  Activity,
  Sliders,
} from 'lucide-react';
import { TacticalTeam } from '../types';
import { PrimaryButton, SecondaryButton, StatusBadge } from './Common';

interface ProximityAlertIndicatorProps {
  driftedTeams: TacticalTeam[];
  onRevectorTeam: (teamCallsign: string) => void;
  onExpandSector: (teamCallsign: string) => void;
  onSimulateDriftToggle: () => void;
  isSimulatingDrift: boolean;
}

export const ProximityAlertIndicator: React.FC<ProximityAlertIndicatorProps> = ({
  driftedTeams,
  onRevectorTeam,
  onExpandSector,
  onSimulateDriftToggle,
  isSimulatingDrift,
}) => {
  const [audioBeaconEnabled, setAudioBeaconEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [secondsBreached, setSecondsBreached] = useState(134);

  // Tick timer while breach active
  useEffect(() => {
    if (driftedTeams.length === 0) return;
    const timer = setInterval(() => {
      setSecondsBreached((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [driftedTeams.length]);

  // Audio tone generation for realistic pitch demo
  const playTacticalBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz high alert beep
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      // AudioContext not allowed or disabled
    }
  };

  const handleToggleAudio = () => {
    if (!audioBeaconEnabled) {
      playTacticalBeep();
    }
    setAudioBeaconEnabled(!audioBeaconEnabled);
  };

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const hasBreach = driftedTeams.length > 0;
  const primaryDrifted = driftedTeams[0];

  return (
    <div className="space-y-2">
      {/* Simulation Bar for MVP Demonstrations */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#1C2E2A] text-white rounded-xl border border-[#0B6758]/40 shadow-xs text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
          <span className="font-mono text-[#A4D0C8] font-bold text-[11px] uppercase tracking-wide">
            Automated Geofence Engine · H3 Hexagonal Boundaries
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-300 hidden sm:inline">
            Pitch Demo Control:
          </span>
          <button
            type="button"
            onClick={onSimulateDriftToggle}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
              isSimulatingDrift
                ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white animate-pulse'
                : 'bg-[#0B6758] hover:bg-[#07483D] text-white border border-[#269584]'
            }`}
          >
            <Zap size={13} />
            <span>{isSimulatingDrift ? 'Resolve Team Bravo Drift' : 'Simulate Sector Boundary Drift (Team Bravo)'}</span>
          </button>
        </div>
      </div>

      {/* Flashing Proximity Alert Indicator */}
      {hasBreach && !isMuted && (
        <div className="relative overflow-hidden bg-[#FEF2F2] border-2 border-[#DC2626] rounded-xl p-3 sm:p-4 shadow-lg animate-[pulse_1.5s_infinite]">
          {/* Strobe background bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#DC2626] animate-[ping_2s_infinite]" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Left: Flashing icon & Breach Info */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#DC2626] text-white flex items-center justify-center shrink-0 shadow-md animate-bounce">
                <ShieldAlert size={22} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-mono font-black text-xs bg-[#DC2626] text-white uppercase tracking-wider">
                    PROXIMITY ALERT · BOUNDARY DRIFT
                  </span>
                  <span className="text-xs font-mono font-bold text-[#DC2626]">
                    +{primaryDrifted.telematics?.driftDistanceM || 185}m outside {primaryDrifted.sector}
                  </span>
                  <span className="text-[11px] bg-red-100 text-[#991B1B] px-2 py-0.5 rounded font-mono font-semibold">
                    Elapsed: {formatElapsed(secondsBreached)}
                  </span>
                </div>

                <div className="text-xs text-[#991B1B] font-medium mt-1 leading-relaxed">
                  <strong>Team {primaryDrifted.callsign}</strong> ({primaryDrifted.personnel} searchers) has drifted outside their assigned sector geofence into unchecked terrain.
                  <span className="font-bold text-[#DC2626] block sm:inline sm:ml-1">
                    ⚠️ Proximity Warning: Terrain slope exceeds 34° towards Craig Cwm Llwch scarp perimeter.
                  </span>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#7F1D1D] font-mono">
                  <span>GPS: {primaryDrifted.position.lat.toFixed(4)}° N, {Math.abs(primaryDrifted.position.lon).toFixed(4)}° W</span>
                  <span>OS Grid: <strong>{primaryDrifted.telematics?.osGridRef || 'SN 9841 2012'}</strong></span>
                  <span>Alt: {primaryDrifted.telematics?.altitudeM || 540}m ASL</span>
                  <span>VHF: {primaryDrifted.radioChannel}</span>
                  <span>Ground Speed: {primaryDrifted.speedKmh} km/h</span>
                </div>
              </div>
            </div>

            {/* Right: Quick Tactical Commands */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 self-start lg:self-center">
              <button
                type="button"
                onClick={handleToggleAudio}
                className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                  audioBeaconEnabled
                    ? 'bg-[#DC2626] text-white border-[#DC2626]'
                    : 'bg-white text-[#991B1B] border-red-200 hover:bg-red-50'
                }`}
                title="Audible tactical proximity beacon"
              >
                {audioBeaconEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                <span className="text-[11px]">{audioBeaconEnabled ? 'Tone On' : 'Audio Tone'}</span>
              </button>

              <button
                type="button"
                onClick={() => onRevectorTeam(primaryDrifted.callsign)}
                className="px-3 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Radio size={14} />
                <span>Re-vector Team VHF Ch 2</span>
              </button>

              <button
                type="button"
                onClick={() => onExpandSector(primaryDrifted.callsign)}
                className="px-3 py-1.5 bg-white hover:bg-red-50 text-[#991B1B] border border-red-300 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle size={14} />
                <span>Authorize & Expand Sector</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMuted(true)}
                className="px-2 py-1.5 text-[11px] text-gray-500 hover:text-gray-700 underline font-medium"
              >
                Dismiss (5m)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status banner when all teams are safely within geofence boundaries */}
      {!hasBreach && (
        <div className="bg-[#E1ECE8] border border-[#0B6758]/30 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-[#07483D]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="font-semibold">
              All 6 Tactical Teams & Payloads Confined Within Authorized Hexagonal Sectors
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#0B6758]">
            Geofence Refresh: 1000ms · 0 Active Breaches
          </span>
        </div>
      )}
    </div>
  );
};
