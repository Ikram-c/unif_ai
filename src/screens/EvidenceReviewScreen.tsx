import React, { useState } from 'react';
import {
  Camera,
  Layers,
  Video,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Crosshair,
  UserCheck,
  ShieldAlert,
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
  const [selectedCandidate, setSelectedCandidate] = useState<EvidenceCandidate | undefined>(
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
    <div className="flex-1 flex flex-col bg-[#F4F6F5] overflow-y-auto">
      <StepHeader
        stepNumber="08 / 09"
        stepTitle="LOCAL SOURCES"
        missionRef={rescue.mission_reference}
      />

      <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1C2E2A] tracking-tight">
              Evidence & local sources review
            </h1>
            <p className="text-xs text-[#5A706A] mt-0.5">
              Review airborne and forward-facing telemetry frames prior to committing ground tasking
            </p>
          </div>
          <SecondaryButton onClick={onBackToOperation} icon={<ArrowLeft size={16} />}>
            Back to active operation
          </SecondaryButton>
        </div>

        {/* Source Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E2E8E5] pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('UAV')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'UAV'
                ? 'bg-[#0B6758] text-white shadow-xs'
                : 'bg-white text-[#5A706A] border border-[#E2E8E5] hover:bg-[#F4F6F5]'
            }`}
          >
            <Camera size={14} />
            <span>UAV Recon (1 Candidate)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DASHCAM')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'DASHCAM'
                ? 'bg-[#0B6758] text-white shadow-xs'
                : 'bg-white text-[#5A706A] border border-[#E2E8E5] hover:bg-[#F4F6F5]'
            }`}
          >
            <Video size={14} />
            <span>Forward Dashcam (0)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SATELLITE')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'SATELLITE'
                ? 'bg-[#0B6758] text-white shadow-xs'
                : 'bg-white text-[#5A706A] border border-[#E2E8E5] hover:bg-[#F4F6F5]'
            }`}
          >
            <Layers size={14} />
            <span>Satellite CDSE (0)</span>
          </button>
        </div>

        {activeTab === 'UAV' && candidate ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 7 Cols: Aerial Photo Frame with Bounding Box */}
            <div className="lg:col-span-7 flex flex-col">
              <Card className="flex-1 flex flex-col p-3 space-y-2 bg-[#1C2E2A] text-white border-none shadow-md">
                <div className="flex items-center justify-between text-xs font-mono px-1">
                  <span className="text-[#57BCAE] font-bold">
                    {candidate.platform_id} · FRAME {candidate.frame_ref}
                  </span>
                  <span className="text-gray-300">
                    {new Date(candidate.captured_at_utc).toISOString().slice(11, 19)} UTC
                  </span>
                </div>

                {/* High-Fidelity Tactical Aerial Viewport */}
                <div className="relative flex-1 min-h-[320px] rounded-lg overflow-hidden bg-[#2D453E] border border-white/10 flex items-center justify-center select-none">
                  {/* Topo / Terrain background representation */}
                  <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="contourPattern" width="60" height="60" patternUnits="userSpaceOnUse">
                        <path d="M0 30 Q 30 10 60 30 T 120 30" fill="none" stroke="#57BCAE" strokeWidth="0.5" />
                        <path d="M0 45 Q 30 25 60 45 T 120 45" fill="none" stroke="#269584" strokeWidth="0.5" />
                        <path d="M0 15 Q 30 -5 60 15 T 120 15" fill="none" stroke="#18796C" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#contourPattern)" />
                    {/* Winding mountain path */}
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
                    <div className="relative w-28 h-28 border-2 border-[#F5A623] bg-[#F5A623]/20 rounded-xs animate-pulse flex items-center justify-center shadow-lg">
                      {/* Corner marks */}
                      <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#F5A623]" />
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#F5A623]" />
                      <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#F5A623]" />
                      <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#F5A623]" />

                      {/* Ambiguous target silhouette */}
                      <div className="w-5 h-5 rounded-full bg-[#383838] border border-white/80" />
                    </div>

                    <div className="mt-1.5 px-2 py-0.5 bg-[#FEF3DD] text-[#9A690B] font-mono text-[10px] font-bold rounded shadow border border-[#F3D794]">
                      C-01 · 51.8720° N, -3.4695° W
                    </div>
                  </div>

                  {/* Aerial Telemetry HUD Overlays */}
                  <div className="absolute top-3 left-3 bg-[#1C2E2A]/85 backdrop-blur-xs px-2.5 py-1.5 rounded text-[10px] font-mono text-gray-200 border border-white/10 space-y-0.5">
                    <div>ALT: 120m AGL · GSD: 2.1cm</div>
                    <div>CAM: Zenmuse H20T (Thermal/Visual)</div>
                    <div>SUN ELEV: 32° · AZ: 184°</div>
                  </div>

                  <div className="absolute bottom-3 right-3 bg-[#1C2E2A]/85 backdrop-blur-xs px-2.5 py-1.5 rounded text-[10px] font-mono text-gray-200 border border-white/10">
                    SCALE: 1:500 · 20m
                  </div>
                </div>

                <div className="text-[11px] text-gray-400 px-1 pt-1 flex items-center justify-between">
                  <span>Sensor: Zenmuse H20T Wide RGB</span>
                  <span>Ground truth verification required</span>
                </div>
              </Card>
            </div>

            {/* Right 5 Cols: Candidate Info & Commander Review Decisions */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8E5] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-[#FEF3DD] text-[#9A690B] px-2 py-0.5 rounded">
                      {candidate.id}
                    </span>
                    <h2 className="font-bold text-sm text-[#1C2E2A]">Airborne Anomaly</h2>
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

                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-[#5A706A] block text-[11px]">Visual Observation</span>
                    <p className="text-[#1C2E2A] font-medium leading-relaxed mt-0.5">
                      {candidate.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#E2E8E5]">
                    <div>
                      <span className="text-[#5A706A] text-[11px]">Offset from LKP</span>
                      <div className="font-mono font-bold text-[#1C2E2A] mt-0.5">
                        {candidate.distance_from_lkp_km} km ({candidate.bearing_from_lkp})
                      </div>
                    </div>
                    <div>
                      <span className="text-[#5A706A] text-[11px]">Reviewer</span>
                      <div className="font-mono font-bold text-[#0B6758] mt-0.5">
                        {candidate.reviewer}
                      </div>
                    </div>
                  </div>

                  {candidate.assigned_team && (
                    <div className="p-2.5 bg-[#E1ECE8] text-[#0B6758] rounded-lg font-medium text-xs">
                      Assigned to: <strong>Team {candidate.assigned_team}</strong> for ground physical check
                    </div>
                  )}
                </div>

                {/* Mandatory Disclaimer Callout */}
                <div className="bg-[#FEF3DD] border border-[#F3D794] text-[#9A690B] rounded-lg p-3 flex items-start gap-2.5 text-xs">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">Human Ground Check Required</span>
                    Visual UAV review is an anomaly flag, not subject identification. A deployed ground
                    team must inspect in person.
                  </div>
                </div>

                {/* Commander Decision Buttons */}
                <div className="space-y-2 pt-2 border-t border-[#E2E8E5]">
                  <PrimaryButton
                    onClick={() => setShowAssignModal(true)}
                    className="w-full"
                    icon={<UserCheck size={16} />}
                  >
                    Mark for field verification
                  </PrimaryButton>

                  <SecondaryButton
                    onClick={handleReject}
                    className="w-full text-[#A62626] hover:bg-[#FCEBEB]"
                    icon={<XCircle size={16} />}
                  >
                    Reject candidate (False positive)
                  </SecondaryButton>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="text-center py-12 text-[#5A706A] text-xs space-y-2">
            <Layers size={32} className="mx-auto text-gray-400" />
            <div className="font-bold text-[#1C2E2A] text-sm">No candidates in this source stream</div>
            <p>Select UAV Recon to inspect the active frame detection candidate.</p>
          </Card>
        )}

        {/* Modal: Assign Ground Verification Task */}
        {showAssignModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-[#E2E8E5]">
              <div className="flex items-center justify-between border-b border-[#E2E8E5] pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck size={18} className="text-[#0B6758]" />
                  <h3 className="font-bold text-sm text-[#1C2E2A]">
                    Assign Ground Verification Task
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-lg font-bold"
                >
                  ×
                </button>
              </div>

              <div className="text-xs text-[#5A706A] leading-relaxed">
                Task a field team to verify Candidate <strong>C-01</strong> at{' '}
                <span className="font-mono text-[#1C2E2A]">51.8720° N, -3.4695° W</span> (0.82 km NE of Storey Arms).
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C2E2A]">
                  Select Field Team
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignedTeam('Alpha')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      assignedTeam === 'Alpha'
                        ? 'border-[#0B6758] bg-[#E1ECE8] text-[#0B6758] font-bold'
                        : 'border-[#E2E8E5] bg-white text-[#1C2E2A] hover:bg-[#F4F6F5]'
                    }`}
                  >
                    <div className="text-xs">Team Alpha</div>
                    <div className="text-[10px] text-[#5A706A]">Sector A (0.3 km away)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssignedTeam('Bravo')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      assignedTeam === 'Bravo'
                        ? 'border-[#0B6758] bg-[#E1ECE8] text-[#0B6758] font-bold'
                        : 'border-[#E2E8E5] bg-white text-[#1C2E2A] hover:bg-[#F4F6F5]'
                    }`}
                  >
                    <div className="text-xs">Team Bravo</div>
                    <div className="text-[10px] text-[#5A706A]">Sector B (0.9 km away)</div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8E5]">
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
