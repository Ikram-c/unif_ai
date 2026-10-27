import React, { useState, useEffect } from 'react';
import {
  Layers,
  Compass,
  Camera,
  FileText,
  Settings as SettingsIcon,
  ShieldCheck,
  Radio,
  Plus,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Menu,
  X,
} from 'lucide-react';
import {
  AberTechBrand,
  DualStatusHeader,
  MobileBottomNav,
  PrimaryButton,
  SecondaryButton,
} from './components/Common';
import { MissionsScreen } from './screens/MissionsScreen';
import { NewIncidentScreen } from './screens/NewIncidentScreen';
import { LastKnownLocationScreen } from './screens/LastKnownLocationScreen';
import { SubjectLastSeenScreen } from './screens/SubjectLastSeenScreen';
import { SearchPlanScreen } from './screens/SearchPlanScreen';
import { ResourcesReviewScreen } from './screens/ResourcesReviewScreen';
import { ActiveOperationScreen } from './screens/ActiveOperationScreen';
import { EvidenceReviewScreen } from './screens/EvidenceReviewScreen';
import { CloseMissionScreen } from './screens/CloseMissionScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { GeoPosition, MissionClosure, Rescue, SubjectProfile, TravelMode } from './types';
import { rescueRepository } from './data/RescueRepository';
import { settingsStore } from './data/SettingsStore';
import { TimeFormat } from './core/TimeFormat';

export const App: React.FC = () => {
  const [rescues, setRescues] = useState<Rescue[]>(rescueRepository.allRescues);
  const [selectedRescueId, setSelectedRescueId] = useState<string>('SAR-026');
  const [currentStep, setCurrentStep] = useState<number>(1); // 1 through 9
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showLogObservationModal, setShowLogObservationModal] = useState<boolean>(false);
  const [isBuildingModel, setIsBuildingModel] = useState<boolean>(false);

  // New incident draft setup wizard state
  const [wizardDraft, setWizardDraft] = useState({
    mission_name: 'Bannau Brycheiniog',
    mission_reference: 'SAR-027',
    agency: 'Upland SAR · Example agency',
    commander_reference: 'C-01',
    subject_reference: 'Subject S-02',
    pin: { lat: 51.8685, lon: -3.48 },
    location_label: 'Storey Arms, Bannau Brycheiniog',
    uncertainty_m: 100,
    travel_mode: 'ON_FOOT' as TravelMode,
    date: '2026-10-27',
    time: '09:30',
    terrain_type: 'Moorland / upland paths',
    subject_context: 'S-02 · separated on summit track',
    subject: {
      name: 'Walker',
      age: 38,
      fitness: 'MEDIUM' as const,
      experience: 'INTERMEDIATE' as const,
      clothing: 'Red waterproof shell',
      notes: 'No bivvy equipment reported',
    },
  });

  // Observation modal state
  const [obsNote, setObsNote] = useState('');
  const [obsSector, setObsSector] = useState('Sector A');

  useEffect(() => {
    return rescueRepository.subscribeRescues((list) => {
      setRescues(list);
      // If active selection no longer exists, default to first
      if (list.length > 0 && !list.find((r) => r.id === selectedRescueId)) {
        setSelectedRescueId(list[0].id);
      }
    });
  }, [selectedRescueId]);

  const currentRescue = rescues.find((r) => r.id === selectedRescueId) || rescues[0];

  // Actions
  const handleOpenRescue = (id: string) => {
    setSelectedRescueId(id);
    const rescue = rescues.find((r) => r.id === id);
    if (rescue?.status === 'COMPLETED') {
      setCurrentStep(9);
    } else {
      setCurrentStep(7);
    }
  };

  const handleOpenAudit = (id: string) => {
    setSelectedRescueId(id);
    setCurrentStep(9);
  };

  const handleNewIncident = () => {
    const nextRefNum = rescues.length + 26;
    setWizardDraft((prev) => ({
      ...prev,
      mission_reference: `SAR-0${nextRefNum}`,
    }));
    setCurrentStep(2);
  };

  // Step 2 -> Step 3
  const handleStep2Next = (values: {
    mission_name: string;
    mission_reference: string;
    agency: string;
    commander_reference: string;
    subject_reference: string;
  }) => {
    setWizardDraft((prev) => ({ ...prev, ...values }));
    setCurrentStep(3);
  };

  // Step 3 -> Step 4
  const handleStep3Next = (pin: GeoPosition, label: string, uncertainty: number) => {
    setWizardDraft((prev) => ({
      ...prev,
      pin,
      location_label: label,
      uncertainty_m: uncertainty,
    }));
    setCurrentStep(4);
  };

  // Step 4 -> Build Model & Step 5
  const handleStep4Build = async (params: {
    travelMode: TravelMode;
    date: string;
    time: string;
    subject: SubjectProfile;
    terrain_type: string;
    subject_context: string;
  }) => {
    setIsBuildingModel(true);

    try {
      const [year, month, day] = params.date.split('-').map((v) => parseInt(v, 10));
      const [hour, min] = params.time.split(':').map((v) => parseInt(v, 10));
      const lastSeenDate = new Date(Date.UTC(year, month - 1, day, hour, min));
      const now = new Date();

      const newRescue: Rescue = {
        id: wizardDraft.mission_reference,
        mission_name: wizardDraft.mission_name,
        mission_reference: wizardDraft.mission_reference,
        agency: wizardDraft.agency,
        commander_reference: wizardDraft.commander_reference,
        subject_reference: wizardDraft.subject_reference,
        status: 'ONGOING',
        created_at_utc: TimeFormat.format(now),
        last_known_location: wizardDraft.pin,
        location_label: wizardDraft.location_label,
        travel_mode: params.travelMode,
        last_seen_utc: TimeFormat.format(lastSeenDate),
        time_zone: settingsStore.settings.timeZone || 'UTC',
        terrain_type: params.terrain_type,
        subject_context: params.subject_context,
        reported_uncertainty_m: wizardDraft.uncertainty_m,
        assumptions_reviewed: false,
        radio_allocations_confirmed: false,
        subject: params.subject,
        allocated_teams: [
          {
            id: 'alpha',
            name: 'Alpha',
            personnel: 8,
            sector: 'Sector A · northern path',
            task: 'Northern path sweep',
            status: 'In progress',
            radio_check: 'Just now',
          },
          {
            id: 'bravo',
            name: 'Bravo',
            personnel: 6,
            sector: 'Sector B · southern drainage',
            task: 'Drainage search',
            status: 'In progress',
            radio_check: 'Just now',
          },
        ],
        evidence_candidates: [
          {
            id: 'C-01',
            source: 'UAV',
            platform_id: 'UAV-01',
            frame_ref: 'F0184',
            captured_at_utc: now.toISOString(),
            position: {
              lat: wizardDraft.pin.lat + 0.0035,
              lon: wizardDraft.pin.lon + 0.0105,
            },
            distance_from_lkp_km: 0.82,
            bearing_from_lkp: 'NE',
            description: 'Ambiguous object beside trail. Visual anomaly flagged by detector.',
            status: 'unverified',
            reviewer: wizardDraft.commander_reference,
          },
        ],
        audit_events: [
          {
            time_utc: params.time,
            title: `Last seen near ${wizardDraft.location_label}`,
            details: `Witness uncertainty: ±${wizardDraft.uncertainty_m}m`,
            timestamp: lastSeenDate.toISOString(),
          },
          {
            time_utc: `${String(now.getUTCHours()).padStart(2, '0')}:${String(
              now.getUTCMinutes()
            ).padStart(2, '0')}`,
            title: 'Search plan v1 computed',
            details: `${params.travelMode} · ${params.terrain_type}`,
            timestamp: now.toISOString(),
          },
        ],
        closure: null,
      };

      const planned = await rescueRepository.runModel(newRescue, now);
      setSelectedRescueId(planned.id);
      setIsBuildingModel(false);
      setCurrentStep(5);
    } catch {
      setIsBuildingModel(false);
    }
  };

  // Step 6 Confirmation -> Deploy to Step 7
  const handleConfirmAndStart = async () => {
    if (!currentRescue) return;
    const now = new Date();
    const timeStr = `${String(now.getUTCHours()).padStart(2, '0')}:${String(
      now.getUTCMinutes()
    ).padStart(2, '0')}`;

    const updated: Rescue = {
      ...currentRescue,
      assumptions_reviewed: true,
      radio_allocations_confirmed: true,
      audit_events: [
        ...(currentRescue.audit_events || []),
        {
          time_utc: timeStr,
          title: 'Commander confirmed allocations',
          details: `${currentRescue.commander_reference} · Alpha 8 (Ch 1) / Bravo 6 (Ch 2)`,
          timestamp: now.toISOString(),
        },
      ],
    };

    await rescueRepository.save(updated);
    setCurrentStep(7);
  };

  // Step 8 Evidence actions
  const handleVerifyCandidate = async (candidateId: string, assignedTeam: string) => {
    if (!currentRescue) return;
    const now = new Date();
    const timeStr = `${String(now.getUTCHours()).padStart(2, '0')}:${String(
      now.getUTCMinutes()
    ).padStart(2, '0')}`;

    const updatedCandidates = (currentRescue.evidence_candidates || []).map((c) =>
      c.id === candidateId
        ? {
            ...c,
            status: 'marked_for_field_verification' as const,
            assigned_team: assignedTeam,
          }
        : c
    );

    const updated: Rescue = {
      ...currentRescue,
      evidence_candidates: updatedCandidates,
      audit_events: [
        ...(currentRescue.audit_events || []),
        {
          time_utc: timeStr,
          title: `Candidate ${candidateId} tasked for verification`,
          details: `Assigned to Team ${assignedTeam} for ground physical check`,
          timestamp: now.toISOString(),
        },
      ],
    };

    await rescueRepository.save(updated);
  };

  const handleRejectCandidate = async (candidateId: string, reason: string) => {
    if (!currentRescue) return;
    const now = new Date();
    const timeStr = `${String(now.getUTCHours()).padStart(2, '0')}:${String(
      now.getUTCMinutes()
    ).padStart(2, '0')}`;

    const updatedCandidates = (currentRescue.evidence_candidates || []).map((c) =>
      c.id === candidateId
        ? {
            ...c,
            status: 'rejected' as const,
          }
        : c
    );

    const updated: Rescue = {
      ...currentRescue,
      evidence_candidates: updatedCandidates,
      audit_events: [
        ...(currentRescue.audit_events || []),
        {
          time_utc: timeStr,
          title: `Candidate ${candidateId} rejected`,
          details: `Marked false positive: ${reason}`,
          timestamp: now.toISOString(),
        },
      ],
    };

    await rescueRepository.save(updated);
  };

  // Step 9 Close & Reopen
  const handleFinalizeClose = async (closure: MissionClosure) => {
    if (!currentRescue) return;
    const now = new Date();
    const timeStr = `${String(now.getUTCHours()).padStart(2, '0')}:${String(
      now.getUTCMinutes()
    ).padStart(2, '0')}`;

    const updated: Rescue = {
      ...currentRescue,
      status: 'COMPLETED',
      closure,
      audit_events: [
        ...(currentRescue.audit_events || []),
        {
          time_utc: timeStr,
          title: 'Mission closed and sealed',
          details: `${closure.outcome} · Reconciled by ${closure.closed_by}`,
          timestamp: now.toISOString(),
        },
      ],
    };

    await rescueRepository.save(updated);
  };

  const handleReopenMission = async () => {
    if (!currentRescue) return;
    const now = new Date();
    const timeStr = `${String(now.getUTCHours()).padStart(2, '0')}:${String(
      now.getUTCMinutes()
    ).padStart(2, '0')}`;

    const updated: Rescue = {
      ...currentRescue,
      status: 'ONGOING',
      closure: null,
      audit_events: [
        ...(currentRescue.audit_events || []),
        {
          time_utc: timeStr,
          title: 'Mission reopened',
          details: `Reopened for ongoing search operations by ${currentRescue.commander_reference}`,
          timestamp: now.toISOString(),
        },
      ],
    };

    await rescueRepository.save(updated);
    setCurrentStep(7);
  };

  // Add observation note
  const handleSaveObservation = async () => {
    if (!currentRescue || !obsNote.trim()) return;
    const now = new Date();
    const timeStr = `${String(now.getUTCHours()).padStart(2, '0')}:${String(
      now.getUTCMinutes()
    ).padStart(2, '0')}`;

    const updated: Rescue = {
      ...currentRescue,
      audit_events: [
        ...(currentRescue.audit_events || []),
        {
          time_utc: timeStr,
          title: `Observation (${obsSector})`,
          details: obsNote.trim(),
          timestamp: now.toISOString(),
        },
      ],
    };

    await rescueRepository.save(updated);
    setObsNote('');
    setShowLogObservationModal(false);
  };

  // Desktop Navigation items
  const navItems = [
    { step: 1, label: '01 Field Workspace', icon: <Layers size={17} /> },
    { step: 7, label: '07 Active Operation', icon: <Compass size={17} /> },
    { step: 8, label: '08 Evidence Review', icon: <Camera size={17} /> },
    { step: 9, label: '09 Audit Record & Close', icon: <FileText size={17} /> },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F4F6F5] text-[#1C2E2A] select-none">
      {/* 1. Desktop Persistent Left Sidebar (≥1024px, 264px width) */}
      <aside className="hidden lg:flex flex-col w-[264px] bg-white border-r border-[#E2E8E5] shrink-0 z-20">
        {/* Brand Header */}
        <div className="p-4 border-b border-[#E2E8E5]">
          <AberTechBrand />
        </div>

        {/* Primary Step Navigation */}
        <div className="p-3 space-y-1">
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[#5A706A]">
            Field Navigation
          </div>
          {navItems.map((item) => {
            const isActive = currentStep === item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setCurrentStep(item.step)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#E1ECE8] text-[#0B6758] shadow-2xs font-bold'
                    : 'text-[#1C2E2A] hover:bg-[#F4F6F5]'
                }`}
              >
                <span className={isActive ? 'text-[#0B6758]' : 'text-[#5A706A]'}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Setup Wizard Steps Sub-section (if in setup) */}
        {currentStep >= 2 && currentStep <= 6 && (
          <div className="p-3 border-t border-[#E2E8E5] bg-[#F4F6F5]/50 space-y-1">
            <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0B6758]">
              Setup Wizard
            </div>
            {[
              { s: 2, name: '02 Setup 1: Incident' },
              { s: 3, name: '03 Setup 2: Location' },
              { s: 4, name: '04 Setup 3: Window' },
              { s: 5, name: '05 Estimated Area' },
              { s: 6, name: '06 Commander Review' },
            ].map((stepItem) => (
              <button
                key={stepItem.s}
                type="button"
                onClick={() => setCurrentStep(stepItem.s)}
                className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                  currentStep === stepItem.s
                    ? 'font-bold text-[#0B6758] bg-[#E1ECE8]'
                    : 'text-[#5A706A] hover:text-[#1C2E2A]'
                }`}
              >
                {stepItem.name}
              </button>
            ))}
          </div>
        )}

        {/* Selected Mission Mini Card */}
        {currentRescue && (
          <div className="p-3 mx-3 my-2 bg-[#F4F6F5] rounded-xl border border-[#E2E8E5] space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-mono font-bold text-[#0B6758] bg-[#E1ECE8] px-1.5 py-0.5 rounded">
                {currentRescue.mission_reference}
              </span>
              <span className="text-[10px] text-[#5A706A] font-semibold">
                Cmdr {currentRescue.commander_reference}
              </span>
            </div>
            <div className="text-xs font-bold text-[#1C2E2A] truncate">
              {currentRescue.mission_name}
            </div>
            <div className="text-[11px] text-[#5A706A] truncate">
              {currentRescue.location_label}
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Hardware Tag & Statutory Retention */}
        <div className="p-3 border-t border-[#E2E8E5] space-y-2 bg-[#F4F6F5]/70">
          <div className="flex items-center justify-between text-[11px] text-[#5A706A]">
            <span className="font-mono">{settingsStore.settings.deviceTag}</span>
            <span className="text-[#0B6758] font-bold">Offline Ready</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#5A706A]">
            <ShieldCheck size={12} className="text-[#0B6758] shrink-0" />
            <span>3-Yr 2 CFR 200 Retention</span>
          </div>

          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="w-full mt-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8E5] bg-white hover:bg-[#F4F6F5] text-xs font-semibold text-[#1C2E2A] transition-colors"
          >
            <SettingsIcon size={14} className="text-[#5A706A]" />
            <span>Hardware & Settings</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Dual Status Header with Persistence and Radio state */}
        <div className="shrink-0">
          <DualStatusHeader />
        </div>

        {/* Mobile App Bar Header (<1024px) */}
        <div className="lg:hidden shrink-0 flex items-center justify-between px-3 py-2 bg-white border-b border-[#E2E8E5]">
          <AberTechBrand />
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded-lg text-[#5A706A] hover:bg-[#F4F6F5]"
            title="Settings"
          >
            <SettingsIcon size={18} />
          </button>
        </div>

        {/* Active Screen Container */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {showSettings ? (
            <SettingsScreen onBack={() => setShowSettings(false)} />
          ) : currentStep === 1 ? (
            <MissionsScreen
              rescues={rescues}
              onOpenRescue={handleOpenRescue}
              onNewIncident={handleNewIncident}
              onOpenAudit={handleOpenAudit}
            />
          ) : currentStep === 2 ? (
            <NewIncidentScreen
              initialValues={wizardDraft}
              onCancel={() => setCurrentStep(1)}
              onNext={handleStep2Next}
            />
          ) : currentStep === 3 ? (
            <LastKnownLocationScreen
              initialPin={wizardDraft.pin}
              initialLabel={wizardDraft.location_label}
              initialUncertainty={wizardDraft.uncertainty_m}
              missionRef={wizardDraft.mission_reference}
              onBack={() => setCurrentStep(2)}
              onNext={handleStep3Next}
            />
          ) : currentStep === 4 ? (
            <SubjectLastSeenScreen
              initialMode={wizardDraft.travel_mode}
              initialDate={wizardDraft.date}
              initialTime={wizardDraft.time}
              initialSubject={wizardDraft.subject}
              initialTerrain={wizardDraft.terrain_type}
              initialContext={wizardDraft.subject_context}
              missionRef={wizardDraft.mission_reference}
              onBack={() => setCurrentStep(3)}
              onBuildPlan={handleStep4Build}
              isBuilding={isBuildingModel}
            />
          ) : currentStep === 5 && currentRescue ? (
            <SearchPlanScreen
              rescue={currentRescue}
              onRevise={() => setCurrentStep(4)}
              onProceedToReview={() => setCurrentStep(6)}
            />
          ) : currentStep === 6 && currentRescue ? (
            <ResourcesReviewScreen
              rescue={currentRescue}
              onBack={() => setCurrentStep(5)}
              onConfirmAndStart={handleConfirmAndStart}
            />
          ) : currentStep === 7 && currentRescue ? (
            <ActiveOperationScreen
              rescue={currentRescue}
              onOpenEvidence={() => setCurrentStep(8)}
              onOpenCloseout={() => setCurrentStep(9)}
              onLogObservation={() => setShowLogObservationModal(true)}
            />
          ) : currentStep === 8 && currentRescue ? (
            <EvidenceReviewScreen
              rescue={currentRescue}
              onBackToOperation={() => setCurrentStep(7)}
              onVerifyCandidate={handleVerifyCandidate}
              onRejectCandidate={handleRejectCandidate}
            />
          ) : currentStep === 9 && currentRescue ? (
            <CloseMissionScreen
              rescue={currentRescue}
              onBackToOperation={() => setCurrentStep(7)}
              onFinalizeClose={handleFinalizeClose}
              onReopen={handleReopenMission}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-sm text-[#5A706A]">
              Loading incident...
            </div>
          )}
        </main>

        {/* Mobile Bottom Navigation (<1024px) */}
        {!showSettings && (
          <MobileBottomNav currentStep={currentStep} onNavigateStep={(step) => setCurrentStep(step)} />
        )}
      </div>

      {/* Modal: Log Observation / Field Note */}
      {showLogObservationModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-[#E2E8E5]">
            <div className="flex items-center justify-between border-b border-[#E2E8E5] pb-3">
              <h3 className="font-bold text-sm text-[#1C2E2A]">
                Log Field Observation / Radio Note
              </h3>
              <button
                type="button"
                onClick={() => setShowLogObservationModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C2E2A] mb-1">
                  Sector / Source
                </label>
                <select
                  value={obsSector}
                  onChange={(e) => setObsSector(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8E5] text-xs bg-[#F4F6F5]"
                >
                  <option value="Sector A (Alpha)">Sector A · Northern path (Team Alpha)</option>
                  <option value="Sector B (Bravo)">Sector B · Southern drainage (Team Bravo)</option>
                  <option value="Base Station">Base Station / Storey Arms HQ</option>
                  <option value="Witness Report">Incoming witness report</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C2E2A] mb-1">
                  Observation Entry
                </label>
                <textarea
                  rows={3}
                  value={obsNote}
                  onChange={(e) => setObsNote(e.target.value)}
                  placeholder="e.g. Footprints identified heading NE on ridge path; visibility dropping to 2km."
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8E5] text-xs bg-[#F4F6F5] leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8E5]">
              <SecondaryButton onClick={() => setShowLogObservationModal(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={handleSaveObservation} disabled={!obsNote.trim()}>
                Record in 2 C.F.R. § 200 Audit
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
