import React, { useState } from 'react';
import {
  FileCheck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Download,
  Printer,
  RotateCcw,
  ArrowLeft,
  Users,
  HardDrive,
  FileText,
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

  const canFinalize = alphaReconciled && bravoReconciled && equipmentReconciled && outcome.trim().length > 0;

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
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(rescue, null, 2));
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
    <div className="flex-1 flex flex-col bg-[#F4F6F5] overflow-y-auto">
      <StepHeader
        stepNumber="09 / 09"
        stepTitle="COMPLETED RECORD & AUDIT"
        missionRef={rescue.mission_reference}
      />

      <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm bg-[#E1ECE8] text-[#0B6758] px-2 py-0.5 rounded">
                {rescue.mission_reference}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-[#1C2E2A] tracking-tight">
                {isCompleted ? 'Mission Audit Record (Closed)' : 'Close Mission & Reconciliation'}
              </h1>
            </div>
            <p className="text-xs text-[#5A706A] mt-0.5">
              3-Year 2 C.F.R. § 200.334 Statutory Grant Compliance Log · Commander {rescue.commander_reference}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <SecondaryButton onClick={onBackToOperation} icon={<ArrowLeft size={16} />}>
              Back to operation
            </SecondaryButton>
            <PrimaryButton onClick={() => setShowExportModal(true)} icon={<Download size={15} />}>
              Export audit package
            </PrimaryButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Closure Form & Reconciliation (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8E5] pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A]">
                  Mission Outcome & Debrief Notes
                </span>
                <StatusBadge
                  type={isCompleted ? 'green' : 'amber'}
                  label={isCompleted ? 'Locked & Sealed' : 'Draft closeout'}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C2E2A] mb-1.5">
                  Resolution Outcome
                </label>
                <select
                  disabled={isCompleted}
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8E5] text-sm text-[#1C2E2A] focus:outline-none focus:border-[#0B6758] bg-[#F4F6F5] disabled:opacity-80"
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
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C2E2A] mb-1.5">
                  Commander Debrief & Findings Notes
                </label>
                <textarea
                  rows={4}
                  disabled={isCompleted}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8E5] text-xs text-[#1C2E2A] focus:outline-none focus:border-[#0B6758] bg-[#F4F6F5] disabled:opacity-80 leading-relaxed"
                />
              </div>

              {/* Mandatory Personnel & Equipment Reconciliation Checklist */}
              <div className="pt-2 border-t border-[#E2E8E5] space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A] block">
                  Mandatory Reconciliation Checklist (2 C.F.R. § 200)
                </span>

                <label className="flex items-center gap-3 p-2.5 rounded-lg bg-[#F4F6F5] border border-[#E2E8E5] cursor-pointer text-xs text-[#1C2E2A]">
                  <input
                    type="checkbox"
                    disabled={isCompleted}
                    checked={alphaReconciled}
                    onChange={(e) => setAlphaReconciled(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#0B6758]"
                  />
                  <span>Team Alpha (8 searchers) accounted for and stood down safely</span>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-lg bg-[#F4F6F5] border border-[#E2E8E5] cursor-pointer text-xs text-[#1C2E2A]">
                  <input
                    type="checkbox"
                    disabled={isCompleted}
                    checked={bravoReconciled}
                    onChange={(e) => setBravoReconciled(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#0B6758]"
                  />
                  <span>Team Bravo (6 searchers) accounted for and stood down safely</span>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-lg bg-[#F4F6F5] border border-[#E2E8E5] cursor-pointer text-xs text-[#1C2E2A]">
                  <input
                    type="checkbox"
                    disabled={isCompleted}
                    checked={equipmentReconciled}
                    onChange={(e) => setEquipmentReconciled(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#0B6758]"
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
                    className="w-full py-3"
                    icon={<FileCheck size={16} />}
                  >
                    Finalize, seal & close mission
                  </PrimaryButton>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#0B6758] font-semibold flex items-center gap-1.5">
                      <CheckCircle2 size={16} />
                      <span>Cryptographically sealed under Commander {rescue.commander_reference}</span>
                    </span>
                    <SecondaryButton onClick={onReopen} icon={<RotateCcw size={14} />}>
                      Reopen mission
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
              <div className="flex items-center justify-between border-b border-[#E2E8E5] pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A] flex items-center gap-1.5">
                  <Clock size={15} className="text-[#0B6758]" />
                  <span>Chronological Audit Event Log</span>
                </span>
                <span className="text-[11px] font-mono text-[#5A706A]">UTC Timestamped</span>
              </div>

              <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8E5]">
                {auditEvents.map((evt, idx) => (
                  <div key={idx} className="relative text-xs">
                    {/* Circle marker */}
                    <span className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-[#0B6758] ring-4 ring-white" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1C2E2A]">{evt.title}</span>
                      <span className="font-mono text-[11px] font-semibold text-[#0B6758] bg-[#E1ECE8] px-1.5 py-0.5 rounded">
                        {evt.time_utc} UTC
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5A706A] mt-0.5 leading-relaxed">
                      {evt.details}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-[#1C2E2A] text-white p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-[#57BCAE]">
                <HardDrive size={14} />
                <span>DEVICE ABER-04 · ENCRYPTED FLASH</span>
              </div>
              <div className="text-[11px] text-gray-300 font-mono leading-tight">
                SHA-256: 7f8a9d04...b12c8e39
              </div>
              <div className="text-[10px] text-gray-400">
                Immutable audit block compliant with grant recordkeeping rules.
              </div>
            </Card>
          </div>
        </div>

        {/* Modal: Export Audit Package */}
        {showExportModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl border border-[#E2E8E5]">
              <div className="flex items-center justify-between border-b border-[#E2E8E5] pb-3">
                <div className="flex items-center gap-2">
                  <Download size={18} className="text-[#0B6758]" />
                  <h3 className="font-bold text-sm text-[#1C2E2A]">
                    Export 2 C.F.R. § 200 Audit Package
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-lg font-bold"
                >
                  ×
                </button>
              </div>

              <div className="text-xs text-[#5A706A] leading-relaxed">
                Download a tamper-evident audit manifest for mission{' '}
                <strong className="text-[#1C2E2A]">{rescue.mission_reference}</strong> ({rescue.mission_name})
                containing all timestamped model inputs, radio logs, and personnel accounting records.
              </div>

              <div className="p-3 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5] text-xs font-mono space-y-1">
                <div>File: {rescue.mission_reference}_2CFR200_Audit.json</div>
                <div>Size: ~14.8 KB</div>
                <div>Hash: SHA-256 Seal verified</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8E5]">
                <SecondaryButton onClick={() => setShowExportModal(false)}>
                  Close
                </SecondaryButton>
                <SecondaryButton
                  onClick={() => window.print()}
                  icon={<Printer size={15} />}
                >
                  Print report
                </SecondaryButton>
                <PrimaryButton onClick={handleDownloadJson} icon={<Download size={15} />}>
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
