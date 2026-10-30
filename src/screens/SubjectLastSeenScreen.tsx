import React, { useState, useEffect } from 'react';
import { Clock, User, Compass, ArrowLeft, ArrowRight, Activity, Mountain, ShieldAlert } from 'lucide-react';
import { Card, PrimaryButton, SecondaryButton, StepHeader } from '../components/Common';
import { Fitness, SubjectProfile, TravelMode } from '../types';

interface SubjectLastSeenScreenProps {
  initialMode: TravelMode;
  initialDate: string;
  initialTime: string;
  initialSubject: SubjectProfile;
  initialTerrain: string;
  initialContext: string;
  missionRef: string;
  onBack: () => void;
  onBuildPlan: (params: {
    travelMode: TravelMode;
    date: string;
    time: string;
    subject: SubjectProfile;
    terrain_type: string;
    subject_context: string;
  }) => void;
  isBuilding?: boolean;
}

export const SubjectLastSeenScreen: React.FC<SubjectLastSeenScreenProps> = ({
  initialMode,
  initialDate,
  initialTime,
  initialSubject,
  initialTerrain,
  initialContext,
  missionRef,
  onBack,
  onBuildPlan,
  isBuilding = false,
}) => {
  const [travelMode, setTravelMode] = useState<TravelMode>(initialMode || 'ON_FOOT');
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [terrain, setTerrain] = useState(initialTerrain || 'Moorland / upland paths');
  const [contextNotes, setContextNotes] = useState(initialContext || 'S-01 · intended route unknown');
  const [subject, setSubject] = useState<SubjectProfile>(initialSubject);
  const [elapsedHours, setElapsedHours] = useState<number>(3.0);

  // Compute elapsed hours from last seen to now
  useEffect(() => {
    try {
      const [year, month, day] = date.split('-').map((v) => parseInt(v, 10));
      const [hour, min] = time.split(':').map((v) => parseInt(v, 10));
      const lastSeen = new Date(Date.UTC(year, month - 1, day, hour, min));
      const now = new Date();
      const diffMs = now.getTime() - lastSeen.getTime();
      const diffHours = Math.max(0.5, Math.round((diffMs / (3600 * 1000)) * 10) / 10);
      setElapsedHours(diffHours);
    } catch {
      setElapsedHours(3.0);
    }
  }, [date, time]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onBuildPlan({
      travelMode,
      date,
      time,
      subject,
      terrain_type: terrain,
      subject_context: contextNotes,
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F4F7F5] overflow-y-auto hig-scroll-view">
      <StepHeader stepNumber="04 / 09" stepTitle="SETUP 3 OF 3" missionRef={missionRef} />

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 pb-8 max-w-2xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1C2E2A] tracking-tight">
            Subject & last seen window
          </h1>
          <p className="text-xs text-[#5A706A] mt-0.5">
            Step 3 of 3 · Set mobility mode, temporal bounds, and physical terrain context
          </p>
        </div>

        <Card className="space-y-5">
          {/* Segmented Mobility Mode Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1C2E2A] mb-2">
              Reported Mobility Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { mode: 'ON_FOOT', label: 'On Foot', d50: 'd50 = 3 km, τ = 6h' },
                  { mode: 'VEHICLE', label: 'Vehicle', d50: 'Road network bounds' },
                  { mode: 'UNKNOWN', label: 'Unknown', d50: 'Conservative blend' },
                ] as const
              ).map((m) => {
                const isSelected = travelMode === m.mode;
                return (
                  <button
                    key={m.mode}
                    type="button"
                    onClick={() => setTravelMode(m.mode)}
                    className={`py-3 px-2 rounded-lg border text-center transition-all ${
                      isSelected
                        ? 'border-[#0B6758] bg-[#E1ECE8] text-[#0B6758] font-bold shadow-2xs'
                        : 'border-[#E2E8E5] bg-white text-[#1C2E2A] hover:bg-[#F4F6F5] font-medium'
                    }`}
                  >
                    <div className="text-sm">{m.label}</div>
                    <div className="text-[10px] text-[#5A706A] mt-0.5 truncate">{m.d50}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Temporal Bounds & Dynamic Window Badge */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A]">
                Last Seen Timestamp (UTC)
              </label>
              <span className="text-xs font-semibold text-[#0B6758] bg-[#E1ECE8] px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <Clock size={13} />
                <span>{elapsedHours} hours elapsed</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-[#5A706A] block mb-1">Date</span>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8E5] text-xs font-mono text-[#1C2E2A] focus:outline-none focus:border-[#0B6758] bg-[#F4F6F5]"
                />
              </div>
              <div>
                <span className="text-[11px] text-[#5A706A] block mb-1">Time (UTC)</span>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8E5] text-xs font-mono text-[#1C2E2A] focus:outline-none focus:border-[#0B6758] bg-[#F4F6F5]"
                />
              </div>
            </div>

            <div className="text-[11px] text-[#5A706A] bg-[#F4F6F5] px-3 py-2 rounded-md border border-[#E2E8E5]">
              Active temporal search window: <strong className="text-[#1C2E2A]">{time} UTC</strong> to{' '}
              <strong className="text-[#1C2E2A]">Now (12:30 UTC)</strong>
            </div>
          </div>

          {/* Physical Terrain Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1C2E2A] mb-1.5">
              Terrain & Trail System
            </label>
            <select
              value={terrain}
              onChange={(e) => setTerrain(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8E5] text-sm text-[#1C2E2A] focus:outline-none focus:border-[#0B6758] bg-[#F4F6F5]"
            >
              <option value="Moorland / upland paths">Moorland / upland paths (Bannau Brycheiniog)</option>
              <option value="Forest / dense woodland">Forest / dense woodland (0.8× velocity decay)</option>
              <option value="Mountain scree & ridge">Mountain scree & steep ridge (0.5× velocity decay)</option>
              <option value="Open pastoral farmland">Open pastoral farmland (1.1× velocity factor)</option>
            </select>
          </div>

          {/* Subject Context & Route Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1C2E2A] mb-1.5">
              Subject Context Notes
            </label>
            <input
              type="text"
              value={contextNotes}
              onChange={(e) => setContextNotes(e.target.value)}
              placeholder="e.g. S-01 · intended route unknown · green rain jacket"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8E5] text-sm text-[#1C2E2A] focus:outline-none focus:border-[#0B6758] bg-[#F4F6F5]"
            />
          </div>
        </Card>

        <div className="flex items-center justify-between pt-2">
          <SecondaryButton onClick={onBack} icon={<ArrowLeft size={16} />}>
            Back: LKP
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            disabled={isBuilding}
            icon={isBuilding ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Compass size={16} />}
          >
            {isBuilding ? 'Building model plan...' : 'Build estimated search area'}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
};
