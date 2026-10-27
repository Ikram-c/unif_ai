import React from 'react';
import {
  Compass,
  Users,
  Radio,
  AlertTriangle,
  Clock,
  Camera,
  FileCheck,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Card, PrimaryButton, SecondaryButton, StatusBadge, StepHeader } from '../components/Common';
import { OsmMap } from '../components/OsmMap';
import { Rescue } from '../types';

interface ActiveOperationScreenProps {
  rescue: Rescue;
  onOpenEvidence: () => void;
  onOpenCloseout: () => void;
  onLogObservation: () => void;
}

export const ActiveOperationScreen: React.FC<ActiveOperationScreenProps> = ({
  rescue,
  onOpenEvidence,
  onOpenCloseout,
  onLogObservation,
}) => {
  const teams = rescue.allocated_teams || [
    {
      id: 'alpha',
      name: 'Alpha',
      personnel: 8,
      sector: 'Sector A · northern path',
      task: 'Northern path sweep',
      status: 'In progress',
      radio_check: '12:24 UTC (6m ago)',
    },
    {
      id: 'bravo',
      name: 'Bravo',
      personnel: 6,
      sector: 'Sector B · southern drainage',
      task: 'Drainage search',
      status: 'In progress',
      radio_check: '12:24 UTC (6m ago)',
    },
  ];

  const candidate = rescue.evidence_candidates?.[0];

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F5] overflow-y-auto">
      <StepHeader
        stepNumber="07 / 09"
        stepTitle="ACTIVE OPERATION"
        missionRef={rescue.mission_reference}
      />

      <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-5">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm bg-[#E1ECE8] text-[#0B6758] px-2 py-0.5 rounded">
                {rescue.mission_reference}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-[#1C2E2A] tracking-tight">
                {rescue.mission_name} · Active Sector Tasking
              </h1>
            </div>
            <p className="text-xs text-[#5A706A] mt-0.5">
              Anchor: {rescue.location_label} ({rescue.last_known_location.lat.toFixed(4)}° N, {Math.abs(rescue.last_known_location.lon).toFixed(4)}° W)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <SecondaryButton onClick={onLogObservation} icon={<PlusCircle size={15} />}>
              Log observation
            </SecondaryButton>
            <PrimaryButton onClick={onOpenCloseout} icon={<FileCheck size={15} />}>
              Close mission & audit
            </PrimaryButton>
          </div>
        </div>

        {/* Evidence Alert Banner if candidate present */}
        {candidate && (
          <div className="bg-[#FEF3DD] border border-[#F3D794] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FBE9BE] flex items-center justify-center text-[#9A690B] shrink-0 mt-0.5">
                <Camera size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#9A690B]">
                    1 Unverified Evidence Candidate ({candidate.id})
                  </span>
                  <StatusBadge
                    type="amber"
                    label={candidate.status === 'unverified' ? 'Awaiting verification' : 'Marked for ground check'}
                  />
                </div>
                <p className="text-xs text-[#9A690B] mt-0.5">
                  Platform: <strong>{candidate.platform_id}</strong> (Frame {candidate.frame_ref}) · {candidate.distance_from_lkp_km} km {candidate.bearing_from_lkp} of Storey Arms
                </p>
              </div>
            </div>
            <PrimaryButton
              onClick={onOpenEvidence}
              className="bg-[#9A690B] hover:bg-[#835807] text-white shrink-0 self-start sm:self-center"
              icon={<ChevronRight size={15} />}
            >
              Review local sources (08 / 09)
            </PrimaryButton>
          </div>
        )}

        {/* Main Grid: Tactical Map & Sector Allocation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Tactical Map (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col min-h-[440px]">
            <Card className="flex-1 flex flex-col p-3">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A] flex items-center gap-1.5">
                  <Compass size={14} className="text-[#0B6758]" />
                  <span>Tactical Sector Map (Sectors A & B)</span>
                </span>
                <span className="text-[11px] font-mono text-[#5A706A]">
                  Radio link offline · Map cached
                </span>
              </div>
              <div className="flex-1 min-h-[400px]">
                <OsmMap
                  center={rescue.last_known_location}
                  zoom={13}
                  pin={rescue.last_known_location}
                  pinLabel={`${rescue.location_label} (LKP)`}
                  teams={teams}
                  candidates={rescue.evidence_candidates || []}
                  showSectors={true}
                  showLegend={true}
                  className="h-full min-h-[400px]"
                />
              </div>
            </Card>
          </div>

          {/* Teams Status & Live Tasks (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8E5] pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A] flex items-center gap-1.5">
                  <Users size={16} className="text-[#0B6758]" />
                  <span>Deployed Ground Teams</span>
                </span>
                <span className="text-[11px] font-mono text-[#0B6758] font-bold">14 Active</span>
              </div>

              <div className="space-y-3">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="p-3 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#1C2E2A]">
                        Team {team.name} ({team.personnel} personnel)
                      </span>
                      <StatusBadge
                        type={team.status === 'In progress' ? 'green' : 'neutral'}
                        label={team.status}
                      />
                    </div>
                    <div className="text-xs text-[#5A706A]">
                      Sector: <strong className="text-[#1C2E2A]">{team.sector}</strong>
                    </div>
                    <div className="text-xs text-[#5A706A]">
                      Task: <span className="text-[#1C2E2A]">{team.task}</span>
                    </div>
                    <div className="text-[11px] font-mono text-[#5A706A] flex items-center gap-1 pt-0.5">
                      <Clock size={12} />
                      <span>Last check: {team.radio_check}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Tactical Incident Parameters */}
            <Card className="space-y-3 text-xs">
              <h2 className="font-bold uppercase tracking-wider text-[#1C2E2A] border-b border-[#E2E8E5] pb-2">
                Incident Parameters
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#5A706A]">Subject Profile:</span>
                  <span className="font-medium text-[#1C2E2A]">{rescue.subject_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A706A]">Incident Commander:</span>
                  <span className="font-mono font-medium text-[#0B6758]">{rescue.commander_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A706A]">Active Search Window:</span>
                  <span className="font-mono text-[#1C2E2A]">3.0 hours elapsed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A706A]">Terrain:</span>
                  <span className="text-[#1C2E2A]">{rescue.terrain_type}</span>
                </div>
              </div>
            </Card>

            {/* Quick Link to Audit */}
            <div className="p-3 bg-white border border-[#E2E8E5] rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#5A706A]">
                <Radio size={14} className="text-[#9A690B]" />
                <span>Next radio check scheduled 13:00 UTC</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
