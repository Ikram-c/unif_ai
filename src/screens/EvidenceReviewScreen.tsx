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
  Crosshair,
  MapPin,
  Thermometer,
  Compass,
  Clock,
  Activity,
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
    <div className="flex-1 min-h-0 flex flex-col bg-[#F2F2F7] overflow-y-auto hig-scroll-view">
      <StepHeader
        stepNumber="08 / 09"
        stepTitle="EVIDENCE & SENSOR TELEMETRY REVIEW"
        missionRef={rescue.mission_reference}
      />

      <div className="p-4 sm:p-6 pb-8 hig-safe-area max-w-5xl mx-auto w-full space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1C1C1E] tracking-tight">
              Evidence &amp; Sensor Telemetry Review
            </h1>
            <p className="text-sm text-[#636366] mt-0.5">
              Inspect airborne sensor detections and assign a ground team for physical verification.
            </p>
          </div>
          <SecondaryButton onClick={onBackToOperation} icon={<ArrowLeft size={16} />}>
            Back to Active Operation
          </SecondaryButton>
        </div>

        {/* Apple HIG Segmented Source Filter */}
        <div className="hig-segmented-control" role="tablist" aria-label="Evidence Source Stream">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'UAV'}
            onClick={() => setActiveTab('UAV')}
            className={`hig-segment-btn inline-flex items-center gap-2 ${
              activeTab === 'UAV' ? 'active' : ''
            }`}
          >
            <Camera size={15} />
            <span>UAV Recon (1 Candidate)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'DASHCAM'}
            onClick={() => setActiveTab('DASHCAM')}
            className={`hig-segment-btn inline-flex items-center gap-2 ${
              activeTab === 'DASHCAM' ? 'active' : ''
            }`}
          >
            <Video size={15} />
            <span>Forward Dashcam (0)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'SATELLITE'}
            onClick={() => setActiveTab('SATELLITE')}
            className={`hig-segment-btn inline-flex items-center gap-2 ${
              activeTab === 'SATELLITE' ? 'active' : ''
            }`}
          >
            <Layers size={15} />
            <span>Satellite Pass (0)</span>
          </button>
        </div>

        {activeTab === 'UAV' && candidate ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 7 Cols: Clean Apple HIG Sensor Telemetry Inspector (Vector Icons Only — No Artwork) */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              <Card className="p-5 sm:p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-[#D1D1D6] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 hig-app-icon bg-[#FF9500] text-white flex items-center justify-center shrink-0">
                      <Crosshair size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#007AFF]">
                          {candidate.platform_id} · FRAME {candidate.frame_ref}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-[#1C1C1E]">
                        Thermal &amp; Optical Anomaly Target {candidate.id}
                      </h2>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-semibold bg-[#F2F2F7] text-[#3A3A3C] px-2.5 py-1 rounded-lg border border-[#D1D1D6]">
                    {new Date(candidate.captured_at_utc).toISOString().slice(11, 19)} UTC
                  </span>
                </div>

                {/* Vector Target Summary Banner */}
                <div className="p-4 rounded-2xl bg-[#F2F2F7] border border-[#D1D1D6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#D1D1D6] flex items-center justify-center text-[#007AFF] shrink-0 shadow-2xs">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#636366] block">
                        Target WGS84 Coordinates
                      </span>
                      <span className="font-mono text-base sm:text-lg font-bold text-[#1C1C1E] tabular-nums">
                        51.8720°N, 3.4695°W
                      </span>
                      <span className="text-xs text-[#3A3A3C] block mt-0.5">
                        {candidate.distance_from_lkp_km} km ({candidate.bearing_from_lkp}) from Last Known Point
                      </span>
                    </div>
                  </div>
                  <StatusBadge
                    type="amber"
                    label="Ground Check Required"
                    icon={<AlertTriangle size={13} />}
                  />
                </div>

                {/* Apple HIG Inset Grouped Sensor Telemetry Rows */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#636366] block px-1">
                    Airborne Sensor Telemetry Metadata
                  </span>
                  <div className="hig-inset-group divide-y divide-[#D1D1D6] text-xs sm:text-sm">
                    <div className="p-3.5 flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-[#3A3A3C] font-medium">
                        <Camera size={16} className="text-[#007AFF]" />
                        <span>Sensor Payload</span>
                      </span>
                      <span className="font-mono font-semibold text-[#1C1C1E]">
                        Zenmuse H20T (Thermal / Wide RGB)
                      </span>
                    </div>
                    <div className="p-3.5 flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-[#3A3A3C] font-medium">
                        <Compass size={16} className="text-[#34C759]" />
                        <span>Flight Altitude &amp; Resolution</span>
                      </span>
                      <span className="font-mono font-semibold text-[#1C1C1E]">
                        120m AGL · GSD 2.1 cm/px
                      </span>
                    </div>
                    <div className="p-3.5 flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-[#3A3A3C] font-medium">
                        <Thermometer size={16} className="text-[#FF9500]" />
                        <span>Surface Thermal Delta</span>
                      </span>
                      <span className="font-mono font-semibold text-[#1C1C1E]">
                        +6.4°C above surrounding moorland
                      </span>
                    </div>
                    <div className="p-3.5 flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-[#3A3A3C] font-medium">
                        <Clock size={16} className="text-[#5856D6]" />
                        <span>Solar Elevation &amp; Azimuth</span>
                      </span>
                      <span className="font-mono font-semibold text-[#1C1C1E]">
                        Elev 32° · Azimuth 184°
                      </span>
                    </div>
                    <div className="p-3.5 flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-[#3A3A3C] font-medium">
                        <Activity size={16} className="text-[#FF3B30]" />
                        <span>Verification Protocol</span>
                      </span>
                      <span className="font-semibold text-[#1C1C1E]">
                        Mandatory Physical Team Inspection
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right 5 Cols: Candidate Info & Commander Review Decisions */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#D1D1D6] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-[#FFF8E6] text-[#9A690B] px-2.5 py-0.5 rounded-md border border-[#FF9500]/40">
                      {candidate.id}
                    </span>
                    <h2 className="font-bold text-base text-[#1C1C1E]">Commander Decision</h2>
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
                        ? 'Assigned for ground check'
                        : candidate.status === 'rejected'
                        ? 'Rejected (False positive)'
                        : 'Unverified candidate'
                    }
                  />
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-[#636366] font-semibold block text-xs">
                      Observation Summary
                    </span>
                    <p className="text-[#1C1C1E] font-medium leading-relaxed mt-1">
                      {candidate.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#D1D1D6]">
                    <div>
                      <span className="text-[#636366] text-xs font-medium">Offset from LKP</span>
                      <div className="font-mono font-bold text-[#1C1C1E] mt-0.5 tabular-nums">
                        {candidate.distance_from_lkp_km} km ({candidate.bearing_from_lkp})
                      </div>
                    </div>
                    <div>
                      <span className="text-[#636366] text-xs font-medium">Logged By</span>
                      <div className="font-mono font-bold text-[#007AFF] mt-0.5">
                        {candidate.reviewer}
                      </div>
                    </div>
                  </div>

                  {candidate.assigned_team && (
                    <div className="p-3 bg-[#E8F8EE] text-[#15803D] rounded-xl font-semibold text-xs border border-[#34C759]/40">
                      Assigned to: <strong>Team {candidate.assigned_team}</strong> for physical ground check
                    </div>
                  )}
                </div>

                {/* Mandatory Disclaimer Callout */}
                <div className="bg-[#FFF8E6] border border-[#FF9500]/40 text-[#78350F] rounded-xl p-3.5 flex items-start gap-2.5 text-xs">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5 text-[#D97706]" />
                  <div>
                    <span className="font-bold text-[#1C1C1E] block mb-0.5">
                      Human Ground Check Required
                    </span>
                    Airborne sensor flags are unverified anomalies, not subject identification. A ground team must verify in person.
                  </div>
                </div>

                {/* Commander Decision Buttons */}
                <div className="space-y-2.5 pt-2 border-t border-[#D1D1D6]">
                  <PrimaryButton
                    onClick={() => setShowAssignModal(true)}
                    className="w-full"
                    icon={<UserCheck size={17} />}
                  >
                    Assign Team for Field Verification
                  </PrimaryButton>

                  <SecondaryButton
                    onClick={handleReject}
                    className="w-full text-[#FF3B30] bg-[#FEE2E2]/60 hover:bg-[#FEE2E2] border-[#FF3B30]/20"
                    icon={<XCircle size={17} />}
                  >
                    Reject Candidate (False Positive)
                  </SecondaryButton>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="text-center py-12 text-[#636366] text-sm space-y-2">
            <Layers size={32} className="mx-auto text-[#007AFF]" />
            <div className="font-bold text-[#1C1C1E] text-base">
              No candidates in this source stream
            </div>
            <p>Select UAV Recon to inspect the active airborne sensor detection.</p>
          </Card>
        )}

        {/* Modal Sheet: Assign Ground Verification Task (Apple HIG Sheet) */}
        {showAssignModal && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setShowAssignModal(false)}
          >
            <div
              className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-xl border border-[#D1D1D6]"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between border-b border-[#D1D1D6] pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck size={19} className="text-[#007AFF]" />
                  <h3 className="font-bold text-base text-[#1C1C1E]">
                    Assign Ground Verification
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-[#636366] hover:bg-[#F2F2F7] cursor-pointer"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="text-sm text-[#3A3A3C] leading-relaxed">
                Task a field team to verify Candidate <strong>C-01</strong> at{' '}
                <span className="font-mono font-bold text-[#1C1C1E]">51.8720°N, 3.4695°W</span> (0.82 km NE of Storey Arms).
              </div>

              <div className="space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-wider text-[#636366]">
                  Select Field Team
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAssignedTeam('Alpha')}
                    className={`min-h-[60px] p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      assignedTeam === 'Alpha'
                        ? 'border-[#007AFF] bg-[#E8F2FF] text-[#0062CC] font-bold'
                        : 'border-[#D1D1D6] bg-white text-[#1C1C1E] hover:bg-[#F2F2F7]'
                    }`}
                  >
                    <div className="text-sm font-bold">Team Alpha</div>
                    <div className="text-xs text-[#636366]">Sector A (0.3 km away)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAssignedTeam('Bravo')}
                    className={`min-h-[60px] p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      assignedTeam === 'Bravo'
                        ? 'border-[#007AFF] bg-[#E8F2FF] text-[#0062CC] font-bold'
                        : 'border-[#D1D1D6] bg-white text-[#1C1C1E] hover:bg-[#F2F2F7]'
                    }`}
                  >
                    <div className="text-sm font-bold">Team Bravo</div>
                    <div className="text-xs text-[#636366]">Sector B (0.9 km away)</div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#D1D1D6]">
                <SecondaryButton onClick={() => setShowAssignModal(false)}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton onClick={handleConfirmVerification}>
                  Confirm Assignment
                </PrimaryButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
