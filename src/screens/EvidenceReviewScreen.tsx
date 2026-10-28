import React, { useState } from 'react';
import {
  Camera,
  Layers,
  Video,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  UserCheck,
  X,
} from 'lucide-react';
import { Card, PrimaryButton, SecondaryButton, StatusBadge, StepHeader } from '../components/Common';
import { EvidenceCandidate, Rescue } from '../types';

interface EvidenceReviewScreenProps {
  rescue: Rescue;
  onBackToOperation: () => void;
  onVerifyCandidate: (candidateId: string, assignedTeam: string) => void;
  onRejectCandidate: (candidateId: string, reason: string) => void;
}

export const EvidenceReviewScreen: React.FC<EvidenceReviewScreenProps> = ({
  rescue,
  onBackToOperation,
  onVerifyCandidate,
  onRejectCandidate,
}) => {
  const [activeTab, setActiveTab] = useState<'UAV' | 'DASHCAM' | 'SATELLITE'>('UAV');
  const [selectedCandidate] = useState<EvidenceCandidate | undefined>(
    rescue.evidence_candidates?.[0]
  );
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignedTeam, setAssignedTeam] = useState('Alpha');

  const candidate = selectedCandidate;

  const handleConfirmVerification = () => {
    if (candidate) {
      onVerifyCandidate(candidate.id, assignedTeam);
      setShowAssignModal(false);
    }
  };

  const handleReject = () => {
    if (candidate) {
      onRejectCandidate(candidate.id, 'Visual check reveals rock outcrop shadow');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#EDF2EF] overflow-y-auto hig-scroll-view">
      <StepHeader
        stepNumber="08 / 09"
        stepTitle="Evidence & Local Sources Review"
        missionRef={rescue.mission_reference}
      />

      <div className="p-4 sm:p-6 hig-safe-area max-w-5xl mx-auto w-full space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#081820] tracking-tight">
              Evidence &amp; Local Sources Review
            </h1>
            <p className="text-sm text-[#1E3831] mt-0.5">
              Inspect airborne and forward-facing telemetry frames prior to committing ground tasking
            </p>
          </div>
          <SecondaryButton onClick={onBackToOperation} icon={<ArrowLeft size={16} />}>
            Back to Active Operation
          </SecondaryButton>
        </div>

        {/* Source Filter Tabs (Targets >= 44pt) */}
        <div className="flex items-center gap-2 border-b border-[#CBD8D4] pb-3 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('UAV')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
              activeTab === 'UAV'
                ? 'bg-[#0B6758] text-white border-[#085446]'
                : 'bg-white text-[#081820] border-[#B8C9C3] hover:bg-[#E1ECE8]'
            }`}
          >
            <Camera size={15} />
            <span>UAV Recon (1 Candidate)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DASHCAM')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
              activeTab === 'DASHCAM'
                ? 'bg-[#0B6758] text-white border-[#085446]'
                : 'bg-white text-[#081820] border-[#B8C9C3] hover:bg-[#E1ECE8]'
            }`}
          >
            <Video size={15} />
            <span>Forward Dashcam (0)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SATELLITE')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
              activeTab === 'SATELLITE'
                ? 'bg-[#0B6758] text-white border-[#085446]'
                : 'bg-white text-[#081820] border-[#B8C9C3] hover:bg-[#E1ECE8]'
            }`}
          >
            <Layers size={15} />
            <span>Satellite CDSE (0)</span>
          </button>
        </div>

        {activeTab === 'UAV' && candidate ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 7 Cols: Aerial Photo Frame with Bounding Box */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="flex-1 flex flex-col p-4 space-y-2.5 bg-[#081820] text-white rounded-2xl border border-[#1B4D3E]">
                <div className="flex items-center justify-between text-xs font-mono px-1">
                  <span className="text-[#88C070] font-bold">
                    {candidate.platform_id} · FRAME {candidate.frame_ref}
                  </span>
                  <span className="text-[#E0F8D0]">
                    {new Date(candidate.captured_at_utc).toISOString().slice(11, 19)} UTC
                  </span>
                </div>

                {/* High-Fidelity Tactical Aerial Viewport */}
                <div className="relative flex-1 min-h-[340px] rounded-xl overflow-hidden bg-[#1D352E] border border-white/15 flex items-center justify-center select-none">
                  <svg
                    className="absolute inset-0 w-full h-full opacity-40"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <pattern
                        id="contourPattern"
                        width="60"
                        height="60"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M0 30 Q 30 10 60 30 T 120 30"
                          fill="none"
                          stroke="#57BCAE"
                          strokeWidth="0.5"
                        />
                        <path
                          d="M0 45 Q 30 25 60 45 T 120 45"
                          fill="none"
                          stroke="#269584"
                          strokeWidth="0.5"
                        />
                        <path
                          d="M0 15 Q 30 -5 60 15 T 120 15"
                          fill="none"
                          stroke="#18796C"
                          strokeWidth="0.5"
                        />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#contourPattern)" />
                    <path
                      d="M 50 360 C 120 280, 180 260, 240 180 S 340 120, 480 40"
                      fill="none"
                      stroke="#E2E8E5"
                      strokeWidth="3.5"
                      strokeDasharray="4 2"
                    />
                  </svg>

                  {/* Amber Bounding Box around Candidate C-01 */}
                  <div className="absolute top-[42%] left-[48%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="relative w-28 h-28 border-2 border-[#FACC15] bg-[#FACC15]/20 rounded-md animate-pulse flex items-center justify-center shadow-lg">
                      <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#FACC15]" />
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#FACC15]" />
                      <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#FACC15]" />
                      <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#FACC15]" />
                      <div className="w-5 h-5 rounded-full bg-[#383838] border border-white/80" />
                    </div>

                    <div className="mt-2 px-2.5 py-1 bg-[#FEF3DD] text-[#78350F] font-mono text-xs font-bold rounded-md shadow border border-[#D97706]">
                      C-01 · 51.8720°N, 3.4695°W
                    </div>
                  </div>

                  {/* Aerial Telemetry HUD Overlays */}
                  <div className="absolute top-3 left-3 bg-[#081820]/90 backdrop-blur-xs px-3 py-2 rounded-lg text-xs font-mono text-[#E0F8D0] border border-white/15 space-y-0.5">
                    <div>ALT: 120m AGL · GSD: 2.1cm</div>
                    <div>CAM: Zenmuse H20T (Thermal/Visual)</div>
                    <div>SUN ELEV: 32° · AZ: 184°</div>
                  </div>

                  <div className="absolute bottom-3 right-3 bg-[#081820]/90 backdrop-blur-xs px-3 py-1.5 rounded-lg text-xs font-mono text-[#E0F8D0] border border-white/15">
                    SCALE: 1:500 · 20m
                  </div>
                </div>

                <div className="text-xs text-[#E0F8D0]/85 px-1 pt-1 flex items-center justify-between">
                  <span>Sensor: Zenmuse H20T Wide RGB</span>
                  <span>Ground truth verification required</span>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Candidate Info & Commander Review Decisions */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#CBD8D4] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-[#FEF3DD] text-[#78350F] px-2.5 py-0.5 rounded-md border border-[#D97706]">
                      {candidate.id}
                    </span>
                    <h2 className="font-bold text-base text-[#081820]">Airborne Anomaly</h2>
                  </div>
                  <StatusBadge
                    type={
                      candidate.status === 'marked_for_field_verification'
                        ? 'green'
                        : candidate.status === 'rejected'
                        ? 'red'
                        : 'amber'
                    }
                    label={
                      candidate.status === 'marked_for_field_verification'
                        ? 'Marked for ground check'
                        : candidate.status === 'rejected'
                        ? 'Rejected (False positive)'
                        : 'Unverified candidate'
                    }
                  />
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-[#1E3831] font-semibold block text-xs">
                      Visual Observation
                    </span>
                    <p className="text-[#081820] font-medium leading-relaxed mt-1">
                      {candidate.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#CBD8D4]">
                    <div>
                      <span className="text-[#1E3831] text-xs font-medium">Offset from LKP</span>
                      <div className="font-mono font-bold text-[#081820] mt-0.5 tabular-nums">
                        {candidate.distance_from_lkp_km} km ({candidate.bearing_from_lkp})
                      </div>
                    </div>
                    <div>
                      <span className="text-[#1E3831] text-xs font-medium">Reviewer</span>
                      <div className="font-mono font-bold text-[#0B6758] mt-0.5">
                        {candidate.reviewer}
                      </div>
                    </div>
                  </div>

                  {candidate.assigned_team && (
                    <div className="p-3 bg-[#E1ECE8] text-[#064E3B] rounded-xl font-semibold text-xs border border-[#A7C7BE]">
                      Assigned to: <strong>Team {candidate.assigned_team}</strong> for ground physical check
                    </div>
                  )}
                </div>

                {/* Mandatory Disclaimer Callout */}
                <div className="bg-[#FEF3DD] border border-[#D97706] text-[#78350F] rounded-xl p-3.5 flex items-start gap-2.5 text-xs">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5 text-[#B45309]" />
                  <div>
                    <span className="font-bold text-[#081820] block mb-0.5">
                      Human Ground Check Required
                    </span>
                    Visual UAV review is an anomaly flag, not subject identification. A deployed ground
                    team must inspect in person.
                  </div>
                </div>

                {/* Commander Decision Buttons */}
                <div className="space-y-2.5 pt-2 border-t border-[#CBD8D4]">
                  <PrimaryButton
                    onClick={() => setShowAssignModal(true)}
                    className="w-full"
                    icon={<UserCheck size={17} />}
                  >
                    Mark for Field Verification
                  </PrimaryButton>

                  <SecondaryButton
                    onClick={handleReject}
                    className="w-full text-[#991B1B] hover:bg-[#FEE2E2]"
                    icon={<XCircle size={17} />}
                  >
                    Reject Candidate (False Positive)
                  </SecondaryButton>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="text-center py-12 text-[#1E3831] text-sm space-y-2">
            <Layers size={32} className="mx-auto text-[#0B6758]" />
            <div className="font-bold text-[#081820] text-base">
              No candidates in this source stream
            </div>
            <p>Select UAV Recon to inspect the active frame detection candidate.</p>
          </Card>
        )}

        {/* Modal Sheet: Assign Ground Verification Task (Apple HIG Alerts & Sheets: explicit dismissal, >=44pt buttons) */}
        {showAssignModal && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setShowAssignModal(false)}
          >
            <div
              className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-[#B8C9C3]"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between border-b border-[#CBD8D4] pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck size={19} className="text-[#0B6758]" />
                  <h3 className="font-bold text-base text-[#081820]">
                    Assign Ground Verification Task
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-[#1E3831] hover:bg-[#EDF2EF] cursor-pointer"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="text-sm text-[#1E3831] leading-relaxed">
                Task a field team to verify Candidate <strong>C-01</strong> at{' '}
                <span className="font-mono font-bold text-[#081820]">51.8720°N, 3.4695°W</span> (0.82 km NE of Storey Arms).
              </div>

              <div className="space-y-2">
                <span className="block text-xs font-bold uppercase tracking-wider text-[#081820]">
                  Select Field Team
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAssignedTeam('Alpha')}
                    className={`min-h-[60px] p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      assignedTeam === 'Alpha'
                        ? 'border-[#0B6758] bg-[#E1ECE8] text-[#064E3B] font-bold'
                        : 'border-[#B8C9C3] bg-white text-[#081820] hover:bg-[#F6F9F7]'
                    }`}
                  >
                    <div className="text-sm font-bold">Team Alpha</div>
                    <div className="text-xs text-[#1E3831]">Sector A (0.3 km away)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssignedTeam('Bravo')}
                    className={`min-h-[60px] p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      assignedTeam === 'Bravo'
                        ? 'border-[#0B6758] bg-[#E1ECE8] text-[#064E3B] font-bold'
                        : 'border-[#B8C9C3] bg-white text-[#081820] hover:bg-[#F6F9F7]'
                    }`}
                  >
                    <div className="text-sm font-bold">Team Bravo</div>
                    <div className="text-xs text-[#1E3831]">Sector B (0.9 km away)</div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#CBD8D4]">
                <SecondaryButton onClick={() => setShowAssignModal(false)}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton onClick={handleConfirmVerification}>
                  Assign Field Verification
                </PrimaryButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
