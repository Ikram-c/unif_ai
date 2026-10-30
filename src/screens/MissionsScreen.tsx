import React from 'react';
import {
  Plus,
  Compass,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Radio,
  FileCheck,
  ChevronRight,
} from 'lucide-react';
import { Card, PrimaryButton, StatusBadge, StepHeader } from '../components/Common';
import { Rescue } from '../types';

interface MissionsScreenProps {
  rescues: Rescue[];
  onOpenRescue: (id: string) => void;
  onNewIncident: () => void;
  onOpenAudit: (id: string) => void;
  onOpenEvidence?: () => void;
}

export const MissionsScreen: React.FC<MissionsScreenProps> = ({
  rescues,
  onOpenRescue,
  onNewIncident,
  onOpenAudit,
  onOpenEvidence,
}) => {
  const activeRescue = rescues.find((r) => r.status === 'ONGOING') || rescues[0];
  const completedRescues = rescues.filter((r) => r.status === 'COMPLETED');

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F4F7F5] overflow-y-auto hig-scroll-view">
      <StepHeader stepNumber="01 / 09" stepTitle="FIELD WORKSPACE" />

      <div className="p-4 sm:p-6 pb-8 max-w-4xl mx-auto w-full space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div>
            <h1 className="text-2xl font-extrabold text-[#1C2E2A] tracking-tight">
              Missions &amp; Tasking
            </h1>
            <p className="text-xs sm:text-sm text-[#5A706A] mt-1 leading-relaxed">
              Field commander workspace · Offline ready with 3-year local cryptographic audit retention
            </p>
          </div>
          <PrimaryButton
            onClick={onNewIncident}
            icon={<Plus size={18} />}
            className="w-full sm:w-auto shrink-0"
          >
            New incident setup
          </PrimaryButton>
        </div>

        {/* Section 1: Active Operation Card (SAR-026) */}
        {activeRescue && activeRescue.status === 'ONGOING' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5A706A]">
                Active Incident
              </span>
              <StatusBadge
                type="green"
                label="Operation in progress"
                icon={<span className="w-2 h-2 rounded-full bg-[#0B6758] animate-pulse" />}
              />
            </div>

            <Card className="border-[#DCE5E1] hover:border-[#0B6758] transition-colors">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#E2E8E5] pb-3.5">
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono font-bold text-xs sm:text-sm bg-[#E1ECE8] text-[#0B6758] px-2.5 py-1 rounded-lg shrink-0 whitespace-nowrap mt-0.5 tabular-nums">
                        {activeRescue.mission_reference}
                      </span>
                      <h2 className="text-base sm:text-lg font-extrabold text-[#1C2E2A] leading-snug">
                        {activeRescue.mission_name} · {activeRescue.location_label}
                      </h2>
                    </div>
                    <p className="text-xs text-[#5A706A]">
                      Commander:{' '}
                      <span className="font-bold text-[#1C2E2A]">
                        {activeRescue.commander_reference}
                      </span>{' '}
                      · Agency: {activeRescue.agency}
                    </p>
                  </div>
                  <div className="text-xs font-mono text-[#5A706A] sm:text-right shrink-0 space-y-0.5 tabular-nums">
                    <div className="text-[#1C2E2A] font-semibold">
                      LKP: {activeRescue.last_known_location.lat.toFixed(4)}° N,{' '}
                      {Math.abs(activeRescue.last_known_location.lon).toFixed(4)}° W
                    </div>
                    <div>Window: On foot · 3h elapsed</div>
                  </div>
                </div>

                {/* Team Allocations Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#F4F7F5] p-3.5 rounded-xl border border-[#E2E8E5]">
                    <div className="flex items-center justify-between text-xs mb-1 gap-2">
                      <span className="font-bold text-[#1C2E2A]">Team Alpha · 8 personnel</span>
                      <span className="text-[#0B6758] font-semibold shrink-0">In progress</span>
                    </div>
                    <p className="text-xs text-[#5A706A]">
                      Sector A · Northern path sweep
                    </p>
                    <div className="text-[11px] text-[#5A706A] mt-1.5 font-mono tabular-nums">
                      Radio check: 12:24 UTC (6m ago)
                    </div>
                  </div>

                  <div className="bg-[#F4F7F5] p-3.5 rounded-xl border border-[#E2E8E5]">
                    <div className="flex items-center justify-between text-xs mb-1 gap-2">
                      <span className="font-bold text-[#1C2E2A]">Team Bravo · 6 personnel</span>
                      <span className="text-[#0B6758] font-semibold shrink-0">In progress</span>
                    </div>
                    <p className="text-xs text-[#5A706A]">
                      Sector B · Southern drainage search
                    </p>
                    <div className="text-[11px] text-[#5A706A] mt-1.5 font-mono tabular-nums">
                      Radio check: 12:24 UTC (6m ago)
                    </div>
                  </div>
                </div>

                {/* Evidence Alert Banner */}
                {activeRescue.evidence_candidates && activeRescue.evidence_candidates.length > 0 && (
                  <div
                    onClick={() => onOpenEvidence && onOpenEvidence()}
                    className="bg-[#FEF3DD] border border-[#F3D794] rounded-xl p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#FDE68A]/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 text-xs text-[#9A690B]">
                      <AlertTriangle size={16} className="shrink-0" />
                      <div>
                        <span className="font-bold text-[#1C2E2A]">
                          1 unverified candidate awaiting verification:
                        </span>{' '}
                        {activeRescue.evidence_candidates[0].id} (
                        {activeRescue.evidence_candidates[0].platform_id} ·{' '}
                        {activeRescue.evidence_candidates[0].frame_ref})
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#9A690B] underline shrink-0">
                      Review frame
                    </span>
                  </div>
                )}

                {/* Action Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="text-xs text-[#5A706A] flex items-center gap-1.5">
                    <Radio size={14} className="text-[#9A690B] shrink-0" />
                    <span>Team link offline · Local operations active</span>
                  </div>
                  <PrimaryButton
                    onClick={() => onOpenRescue(activeRescue.id)}
                    icon={<Compass size={16} />}
                    className="w-full sm:w-auto"
                  >
                    Open active operation
                  </PrimaryButton>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Section 2: Completed Missions List */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5A706A] block">
            Archived Missions &amp; 2 C.F.R. § 200 Audit Records
          </span>

          <div className="space-y-2.5">
            {completedRescues.map((rescue) => (
              <Card
                key={rescue.id}
                onClick={() => onOpenAudit(rescue.id)}
                className="hover:border-[#0B6758] transition-all py-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#E1ECE8] flex items-center justify-center text-[#0B6758] shrink-0 mt-0.5">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#0B6758] bg-[#E1ECE8] px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 tabular-nums">
                          {rescue.mission_reference}
                        </span>
                        <h3 className="font-bold text-sm text-[#1C2E2A]">
                          {rescue.mission_name} · {rescue.location_label}
                        </h3>
                      </div>
                      <div className="text-xs text-[#5A706A] mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>
                          Outcome:{' '}
                          <strong className="text-[#1C2E2A] font-semibold">
                            {rescue.closure?.outcome || 'Completed'}
                          </strong>
                        </span>
                        <span>·</span>
                        <span>
                          Closed:{' '}
                          {rescue.closure?.closed_at_utc
                            ? new Date(rescue.closure.closed_at_utc).toLocaleDateString()
                            : 'Recent'}
                        </span>
                        <span>·</span>
                        <span>Commander: {rescue.commander_reference}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center shrink-0">
                    <span className="text-xs font-bold text-[#0B6758] flex items-center gap-1">
                      <FileCheck size={14} />
                      <span>Audit Record</span>
                      <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Section 3: Statutory Compliance Banner */}
        <div className="bg-white border border-[#DCE5E1] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E1ECE8] flex items-center justify-center text-[#0B6758] shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1C2E2A] uppercase tracking-wide">
                Grant Compliance (2 C.F.R. § 200.334)
              </h4>
              <p className="text-xs text-[#5A706A] mt-0.5 leading-relaxed">
                All personnel taskings, radio updates, and model assumptions are timestamped and preserved locally for 3 years.
              </p>
            </div>
          </div>
          <div className="text-xs font-mono text-[#0B6758] bg-[#E1ECE8] px-3 py-1.5 rounded-lg shrink-0 font-bold self-start sm:self-center">
            Retention Active
          </div>
        </div>
      </div>
    </div>
  );
};
