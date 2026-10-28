import React, { useState } from 'react';
import {
  FileCheck,
  CheckCircle2,
  Clock,
  Download,
  Printer,
  RotateCcw,
  ArrowLeft,
  HardDrive,
  X,
} from 'lucide-react';
import { Card, ComplianceNotice, PrimaryButton, SecondaryButton, StatusBadge, StepHeader } from '../components/Common';
import { AuditEvent, MissionClosure, Rescue } from '../types';

interface CloseMissionScreenProps {
  rescue: Rescue;
  onBackToOperation: () => void;
  onFinalizeClose: (closure: MissionClosure) => void;
  onReopen: () => void;
}

export const CloseMissionScreen: React.FC<CloseMissionScreenProps> = ({
  rescue,
  onBackToOperation,
  onFinalizeClose,
  onReopen,
}) => {
  const isCompleted = rescue.status === 'COMPLETED';

  const [outcome, setOutcome] = useState(
    rescue.closure?.outcome || 'Subject located safe · transported to base'
  );
  const [notes, setNotes] = useState(
    rescue.closure?.notes ||
      'Subject located 0.9 km NE of Storey Arms following ground verification of UAV candidate C-01. Mild hypothermia treated on site. Stood down all teams.'
  );
  const [alphaReconciled, setAlphaReconciled] = useState(rescue.closure?.alpha_reconciled ?? true);
  const [bravoReconciled, setBravoReconciled] = useState(rescue.closure?.bravo_reconciled ?? true);
  const [equipmentReconciled, setEquipmentReconciled] = useState(
    rescue.closure?.equipment_reconciled ?? true
  );
  const [showExportModal, setShowExportModal] = useState(false);

  const canFinalize =
    alphaReconciled && bravoReconciled && equipmentReconciled && outcome.trim().length > 0;

  const handleFinalize = () => {
    onFinalizeClose({
      outcome,
      notes,
      alpha_reconciled: alphaReconciled,
      bravo_reconciled: bravoReconciled,
      equipment_reconciled: equipmentReconciled,
      closed_at_utc: new Date().toISOString(),
      closed_by: rescue.commander_reference || 'Commander C-01',
    });
  };

  const handleDownloadJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(rescue, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${rescue.mission_reference}_2CFR200_Audit.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const auditEvents: AuditEvent[] = rescue.audit_events || [
    {
      time_utc: '09:30',
      title: 'Last seen near Storey Arms',
      details: 'Source: reported witness location',
      timestamp: '2026-10-27T09:30:00Z',
    },
    {
      time_utc: '12:10',
      title: 'Plan v1 built locally',
      details: 'On foot · moorland · 3h input snapshot',
      timestamp: '2026-10-27T12:10:00Z',
    },
    {
      time_utc: '12:18',
      title: 'Commander confirmed plan',
      details: 'C-01 · Alpha 8 / Bravo 6',
      timestamp: '2026-10-27T12:18:00Z',
    },
    {
      time_utc: '12:24',
      title: 'Team update received',
      details: 'Radio liaison · team link then offline',
      timestamp: '2026-10-27T12:24:00Z',
    },
    {
      time_utc: '12:28',
      title: 'Candidate C-01 reviewed',
      details: 'Assigned for ground physical verification',
      timestamp: '2026-10-27T12:28:00Z',
    },
    {
      time_utc: '12:35',
      title: 'Mission closed and sealed',
      details: 'All 14 personnel and equipment accounted for',
      timestamp: '2026-10-27T12:35:00Z',
    },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#EDF2EF] overflow-y-auto hig-scroll-view">
      <StepHeader
        stepNumber="09 / 09"
        stepTitle="Completed Record & Audit"
        missionRef={rescue.mission_reference}
      />

      <div className="p-4 sm:p-6 hig-safe-area max-w-5xl mx-auto w-full space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono font-bold text-sm bg-[#E1ECE8] text-[#064E3B] px-2.5 py-0.5 rounded-md border border-[#A7C7BE]">
                {rescue.mission_reference}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#081820] tracking-tight">
                {isCompleted ? 'Mission Audit Record (Closed)' : 'Close Mission & Reconciliation'}
              </h1>
            </div>
            <p className="text-sm text-[#1E3831] mt-0.5">
              3-Year 2 C.F.R. § 200.334 Statutory Grant Compliance Log · Commander{' '}
              {rescue.commander_reference}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <SecondaryButton onClick={onBackToOperation} icon={<ArrowLeft size={16} />}>
              Back to Operation
            </SecondaryButton>
            <PrimaryButton onClick={() => setShowExportModal(true)} icon={<Download size={16} />}>
              Export Audit Package
            </PrimaryButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Closure Form & Reconciliation (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#CBD8D4] pb-3">
                <span className="text-base font-bold text-[#081820]">
                  Mission Outcome &amp; Debrief Notes
                </span>
                <StatusBadge
                  type={isCompleted ? 'green' : 'amber'}
                  label={isCompleted ? 'Locked & Sealed' : 'Draft Closeout'}
                />
              </div>

              <div>
                <label
                  htmlFor="outcome-select"
                  className="block text-sm font-bold text-[#081820] mb-1.5"
                >
                  Resolution Outcome
                </label>
                <select
                  id="outcome-select"
                  disabled={isCompleted}
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#8BA39B] text-[#081820] bg-[#F6F9F7] disabled:opacity-80"
                >
                  <option value="Subject located safe · transported to base">
                    Subject located safe · transported to base
                  </option>
                  <option value="Subject located · medical evacuation required">
                    Subject located · medical evacuation required
                  </option>
                  <option value="Subject self-evacuated safe">Subject self-evacuated safe</option>
                  <option value="Search suspended · subject not located">
                    Search suspended · subject not located
                  </option>
                  <option value="Training exercise completed successfully">
                    Training exercise completed successfully
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="debrief-notes"
                  className="block text-sm font-bold text-[#081820] mb-1.5"
                >
                  Commander Debrief &amp; Findings Notes
                </label>
                <textarea
                  id="debrief-notes"
                  rows={4}
                  disabled={isCompleted}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#8BA39B] text-[#081820] bg-[#F6F9F7] disabled:opacity-80 leading-relaxed"
                />
              </div>

              {/* Mandatory Personnel & Equipment Reconciliation Checklist (Row >= 44pt) */}
              <div className="pt-3 border-t border-[#CBD8D4] space-y-2.5">
                <span className="text-sm font-bold text-[#081820] block">
                  Mandatory Reconciliation Checklist (2 C.F.R. § 200)
                </span>

                <label className="min-h-[48px] flex items-center gap-3 p-3 rounded-xl bg-[#F6F9F7] border border-[#CBD8D4] cursor-pointer text-sm text-[#081820]">
                  <input
                    type="checkbox"
                    disabled={isCompleted}
                    checked={alphaReconciled}
                    onChange={(e) => setAlphaReconciled(e.target.checked)}
                    className="h-5 w-5 rounded accent-[#0B6758] shrink-0 cursor-pointer"
                  />
                  <span>Team Alpha (8 searchers) accounted for and stood down safely</span>
                </label>

                <label className="min-h-[48px] flex items-center gap-3 p-3 rounded-xl bg-[#F6F9F7] border border-[#CBD8D4] cursor-pointer text-sm text-[#081820]">
                  <input
                    type="checkbox"
                    disabled={isCompleted}
                    checked={bravoReconciled}
                    onChange={(e) => setBravoReconciled(e.target.checked)}
                    className="h-5 w-5 rounded accent-[#0B6758] shrink-0 cursor-pointer"
                  />
                  <span>Team Bravo (6 searchers) accounted for and stood down safely</span>
                </label>

                <label className="min-h-[48px] flex items-center gap-3 p-3 rounded-xl bg-[#F6F9F7] border border-[#CBD8D4] cursor-pointer text-sm text-[#081820]">
                  <input
                    type="checkbox"
                    disabled={isCompleted}
                    checked={equipmentReconciled}
                    onChange={(e) => setEquipmentReconciled(e.target.checked)}
                    className="h-5 w-5 rounded accent-[#0B6758] shrink-0 cursor-pointer"
                  />
                  <span>All radios, UAV airframes, batteries, and GPS units returned to armory</span>
                </label>
              </div>

              {/* Finalize Button */}
              <div className="pt-2">
                {!isCompleted ? (
                  <PrimaryButton
                    onClick={handleFinalize}
                    disabled={!canFinalize}
                    className="w-full"
                    icon={<FileCheck size={17} />}
                  >
                    Finalize, Seal &amp; Close Mission
                  </PrimaryButton>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm text-[#064E3B] font-semibold flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-[#0B6758]" />
                      <span>
                        Cryptographically sealed under Commander {rescue.commander_reference}
                      </span>
                    </span>
                    <SecondaryButton onClick={onReopen} icon={<RotateCcw size={15} />}>
                      Reopen Mission
                    </SecondaryButton>
                  </div>
                )}
              </div>
            </Card>

            <ComplianceNotice />
          </div>

          {/* Right Column: Chronological Audit Log (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#CBD8D4] pb-3">
                <span className="text-base font-bold text-[#081820] flex items-center gap-2">
                  <Clock size={17} className="text-[#0B6758]" />
                  <span>Chronological Audit Event Log</span>
                </span>
                <span className="text-xs font-mono font-semibold text-[#1E3831]">
                  UTC Timestamped
                </span>
              </div>

              <div className="divide-y divide-[#CBD8D4]">
                {auditEvents.map((evt, idx) => (
                  <div key={idx} className="hig-list-row py-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-[#081820]">{evt.title}</span>
                      <span className="font-mono text-xs font-bold text-[#064E3B] bg-[#E1ECE8] px-2 py-0.5 rounded-md tabular-nums shrink-0">
                        {evt.time_utc} UTC
                      </span>
                    </div>
                    <p className="text-xs text-[#1E3831] leading-relaxed">
                      {evt.details}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <div className="bg-[#081820] text-white rounded-2xl p-4 sm:p-5 space-y-2 border border-[#1B4D3E]">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#88C070]">
                <HardDrive size={15} />
                <span>DEVICE ABER-04 · ENCRYPTED FLASH</span>
              </div>
              <div className="text-xs text-[#E0F8D0] font-mono">
                SHA-256: 7f8a9d04...b12c8e39
              </div>
              <div className="text-xs text-[#E0F8D0]/80">
                Immutable audit block compliant with grant recordkeeping rules.
              </div>
            </div>
          </div>
        </div>

        {/* Modal Sheet: Export Audit Package (Explicit Dismissal, >= 44pt buttons) */}
        {showExportModal && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setShowExportModal(false)}
          >
            <div
              className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-[#B8C9C3]"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between border-b border-[#CBD8D4] pb-3">
                <div className="flex items-center gap-2">
                  <Download size={19} className="text-[#0B6758]" />
                  <h3 className="font-bold text-base text-[#081820]">
                    Export 2 C.F.R. § 200 Audit Package
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-[#1E3831] hover:bg-[#EDF2EF] cursor-pointer"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="text-sm text-[#1E3831] leading-relaxed">
                Download a tamper-evident audit manifest for mission{' '}
                <strong className="text-[#081820]">{rescue.mission_reference}</strong> (
                {rescue.mission_name}) containing all timestamped model inputs, radio logs, and
                personnel accounting records.
              </div>

              <div className="p-3.5 bg-[#F6F9F7] rounded-xl border border-[#CBD8D4] text-xs font-mono space-y-1 text-[#081820]">
                <div>File: {rescue.mission_reference}_2CFR200_Audit.json</div>
                <div>Size: ~14.8 KB</div>
                <div>Hash: SHA-256 Seal verified</div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-[#CBD8D4]">
                <SecondaryButton onClick={() => setShowExportModal(false)}>
                  Close
                </SecondaryButton>
                <SecondaryButton onClick={() => window.print()} icon={<Printer size={16} />}>
                  Print Report
                </SecondaryButton>
                <PrimaryButton onClick={handleDownloadJson} icon={<Download size={16} />}>
                  Download JSON
                </PrimaryButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
