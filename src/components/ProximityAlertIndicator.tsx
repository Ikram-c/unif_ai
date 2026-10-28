import React, { useState, useEffect } from 'react';
import {
  Radio,
  ShieldAlert,
  Volume2,
  VolumeX,
  CheckCircle,
  Zap,
} from 'lucide-react';
import { TacticalTeam } from '../types';

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

  useEffect(() => {
    if (driftedTeams.length === 0) return;
    const timer = setInterval(() => {
      setSecondsBreached((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [driftedTeams.length]);

  const playTacticalBeep = () => {
    try {
      const audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
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
    <div className="space-y-2.5">
      {/* Geofence Status & Pitch Demo Bar (Targets >= 44px) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white rounded-2xl border border-[#B8C9C3] text-xs">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              hasBreach ? 'bg-[#DC2626] animate-ping' : 'bg-[#16A34A]'
            }`}
          />
          <span className="font-bold text-[#081820] text-sm">
            {hasBreach
              ? `Proximity Alert: ${driftedTeams.length} Unit Outside Sector Geofence`
              : 'All 6 Tactical Units Confined Within Authorized Hexagonal Sectors'}
          </span>
          <span className="hidden md:inline font-mono text-xs text-[#1E3831]">
            · H3 Res 8 Geofence (1000ms refresh)
          </span>
        </div>

        <button
          type="button"
          onClick={onSimulateDriftToggle}
          className={`min-h-[42px] px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
            isSimulatingDrift
              ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white border-[#991B1B] animate-pulse'
              : 'bg-[#E1ECE8] hover:bg-[#CBE0D9] text-[#064E3B] border-[#0B6758]'
          }`}
        >
          <Zap size={14} />
          <span>
            {isSimulatingDrift
              ? 'Resolve Team Bravo Drift'
              : 'Simulate Sector Boundary Drift (Team Bravo)'}
          </span>
        </button>
      </div>

      {/* Flashing Proximity Alert Indicator */}
      {hasBreach && !isMuted && (
        <div className="relative overflow-hidden bg-[#FEF2F2] border-2 border-[#DC2626] rounded-2xl p-4 sm:p-5 shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Icon & Breach Info */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 hig-app-icon bg-[#DC2626] text-white flex items-center justify-center shrink-0 animate-pulse">
                <ShieldAlert size={22} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full font-mono font-bold text-xs bg-[#DC2626] text-white uppercase tracking-wider">
                    Proximity Alert · Boundary Drift
                  </span>
                  <span className="text-sm font-mono font-bold text-[#991B1B]">
                    +{primaryDrifted.telematics?.driftDistanceM || 185}m outside {primaryDrifted.sector}
                  </span>
                  <span className="text-xs bg-white text-[#991B1B] border border-[#FCA5A5] px-2.5 py-0.5 rounded-md font-mono font-semibold tabular-nums">
                    Elapsed: {formatElapsed(secondsBreached)}
                  </span>
                </div>

                <div className="text-sm text-[#7F1D1D] font-medium mt-1.5 leading-relaxed">
                  <strong>Team {primaryDrifted.callsign}</strong> ({primaryDrifted.personnel} searchers) has drifted outside their assigned sector geofence into unchecked terrain.{' '}
                  <span className="font-bold text-[#991B1B]">
                    Terrain slope exceeds 34° towards Craig Cwm Llwch scarp perimeter.
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#7F1D1D] font-mono tabular-nums">
                  <span>
                    GPS: {primaryDrifted.position.lat.toFixed(4)}°N,{' '}
                    {Math.abs(primaryDrifted.position.lon).toFixed(4)}°W
                  </span>
                  <span>
                    OS Grid: <strong>{primaryDrifted.telematics?.osGridRef || 'SN 9841 2012'}</strong>
                  </span>
                  <span>Alt: {primaryDrifted.telematics?.altitudeM || 540}m ASL</span>
                  <span>VHF: {primaryDrifted.radioChannel}</span>
                </div>
              </div>
            </div>

            {/* Right: Quick Tactical Commands (All targets >= 44pt) */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
              <button
                type="button"
                onClick={handleToggleAudio}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  audioBeaconEnabled
                    ? 'bg-[#DC2626] text-white border-[#991B1B]'
                    : 'bg-white text-[#991B1B] border-[#FCA5A5] hover:bg-red-50'
                }`}
                title="Audible tactical proximity beacon"
              >
                {audioBeaconEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                <span>{audioBeaconEnabled ? 'Tone On' : 'Audio Tone'}</span>
              </button>

              <button
                type="button"
                onClick={() => onRevectorTeam(primaryDrifted.callsign)}
                className="min-h-[44px] px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Radio size={15} />
                <span>Re-vector Team VHF Ch 2</span>
              </button>

              <button
                type="button"
                onClick={() => onExpandSector(primaryDrifted.callsign)}
                className="min-h-[44px] px-4 py-2 bg-white hover:bg-red-50 text-[#991B1B] border border-[#DC2626] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle size={15} />
                <span>Authorize &amp; Expand Sector</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMuted(true)}
                className="min-h-[44px] px-3 py-2 text-xs text-[#7F1D1D] hover:underline font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
