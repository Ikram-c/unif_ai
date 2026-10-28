import React, { useState, useEffect } from 'react';
import {
  Layers,
  Compass,
  Camera,
  FileText,
  Settings as SettingsIcon,
  ShieldCheck,
  X,
  Globe,
  Loader2,
} from 'lucide-react';
import {
  AberTechBrand,
  ActivityRing,
  DualStatusHeader,
  MobileBottomNav,
  PrimaryButton,
  SecondaryButton,
} from './components/Common';
import { LandingPage } from './screens/LandingPage';
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
  const [currentStep, setCurrentStep] = useState<number>(7); // Default to 07 Active Operation (Live Position Tracking & Team Status)
  const [isLandingPage, setIsLandingPage] = useState<boolean>(false);
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
  const [obsSector, setObsSector] = useState('Sector A (Alpha)');

  useEffect(() => {
    return rescueRepository.subscribeRescues((list) => {
      setRescues(list);
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

  // Desktop Navigation items — Clear hierarchy & >= 44pt tap targets
  const navItems = [
    { step: 1, label: '01 Field Workspace', icon: <Layers size={19} /> },
    { step: 7, label: '07 Active Operation', icon: <Compass size={19} /> },
    { step: 8, label: '08 Evidence Review', icon: <Camera size={19} /> },
    { step: 9, label: '09 Audit & Closure', icon: <FileText size={19} /> },
  ];

  return (
    <div className="h-screen w-full overflow-hidden bg-[#EDF2EF] text-[#081820] flex lg:grid lg:grid-cols-[minmax(268px,296px)_1fr]">
      {/* 1. Desktop Sidebar (Apple HIG Sidebars: W = 260-320pt, grid-template-columns: minmax(260px, 320px) 1fr) */}
      <aside className="hidden lg:flex flex-col bg-white border-r border-[#CBD8D4] shrink-0 z-20 overflow-y-auto">
        {/* Brand Header */}
        <div className="p-4 border-b border-[#CBD8D4]">
          <AberTechBrand />
        </div>

        {/* Landing Page & Pitch Highlight Button */}
        <div className="p-3.5 pb-2 border-b border-[#CBD8D4]/70">
          <button
            type="button"
            onClick={() => setIsLandingPage(true)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 min-h-[46px] rounded-xl text-sm font-bold transition-colors border cursor-pointer ${
              isLandingPage
                ? 'bg-[#0B6758] text-white border-[#085446]'
                : 'bg-[#081820] text-white border-[#081820] hover:bg-[#1B4D3E]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Globe size={18} className="text-[#88C070]" />
              <span>Overview &amp; Pitch</span>
            </div>
            <span className="text-xs bg-[#88C070] text-[#081820] px-2 py-0.5 rounded-md font-mono font-bold">
              MVP
            </span>
          </button>
        </div>

        {/* Primary Step Navigation */}
        <div className="p-3.5 space-y-1.5">
          <div className="px-2.5 py-1 text-xs font-bold text-[#1E3831]">
            Mission Workflow
          </div>
          {navItems.map((item) => {
            const isActive = !isLandingPage && !showSettings && currentStep === item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => {
                  setIsLandingPage(false);
                  setShowSettings(false);
                  setCurrentStep(item.step);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 min-h-[46px] rounded-xl text-sm font-semibold transition-colors cursor-pointer border ${
                  isActive
                    ? 'bg-[#E1ECE8] text-[#064E3B] border-[#0B6758] font-bold'
                    : 'bg-transparent text-[#081820] border-transparent hover:bg-[#EDF2EF]'
                }`}
              >
                <span className={isActive ? 'text-[#0B6758]' : 'text-[#1E3831]'}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Setup Wizard Steps Sub-section (if in setup) */}
        {currentStep >= 2 && currentStep <= 6 && !isLandingPage && !showSettings && (
          <div className="p-3.5 border-t border-[#CBD8D4] bg-[#F6F9F7] space-y-1">
            <div className="px-2.5 py-1 text-xs font-bold text-[#0B6758]">
              Incident Setup Steps
            </div>
            {[
              { s: 2, name: '02 Incident Details' },
              { s: 3, name: '03 Last Known Point' },
              { s: 4, name: '04 Subject & Window' },
              { s: 5, name: '05 Search Plan Area' },
              { s: 6, name: '06 Resource Review' },
            ].map((stepItem) => (
              <button
                key={stepItem.s}
                type="button"
                onClick={() => setCurrentStep(stepItem.s)}
                className={`w-full text-left px-3.5 py-2 min-h-[44px] rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  currentStep === stepItem.s
                    ? 'font-bold text-white bg-[#0B6758]'
                    : 'text-[#081820] hover:bg-[#E1ECE8]/60'
                }`}
              >
                {stepItem.name}
              </button>
            ))}
          </div>
        )}

        {/* Selected Mission Summary Card with Activity Ring */}
        {currentRescue && (
          <div className="p-3.5 mx-3.5 my-2 bg-[#F6F9F7] text-[#081820] rounded-xl border border-[#B8C9C3] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-[#064E3B] bg-[#E1ECE8] px-2 py-0.5 rounded border border-[#A7C7BE] tabular-nums">
                {currentRescue.mission_reference}
              </span>
              <span className="text-xs text-[#1E3831] font-mono font-semibold">
                Cmdr {currentRescue.commander_reference}
              </span>
            </div>
            <div>
              <div className="text-sm font-bold text-[#081820] truncate">
                {currentRescue.mission_name}
              </div>
              <div className="text-xs text-[#1E3831] truncate">
                {currentRescue.location_label}
              </div>
            </div>
            <div className="pt-2 border-t border-[#CBD8D4] flex items-center justify-between">
              <ActivityRing percentage={68} size={36} strokeWidth={4} label="Sector Sweep" />
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Hardware Tag & Settings */}
        <div className="p-3.5 border-t border-[#CBD8D4] space-y-2.5 bg-[#F6F9F7]">
          <div className="flex items-center justify-between text-xs font-semibold text-[#1E3831]">
            <span className="font-mono font-bold bg-white px-2.5 py-1 rounded-md border border-[#CBD8D4] text-[#081820]">
              {settingsStore.settings.deviceTag}
            </span>
            <span className="text-[#0B6758] font-bold">Offline Ready</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#1E3831]">
            <ShieldCheck size={16} className="text-[#0B6758] shrink-0" />
            <span>3-Year 2 CFR 200 Retention</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsLandingPage(false);
              setShowSettings(true);
            }}
            className={`w-full flex items-center justify-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl border text-sm font-bold transition-colors cursor-pointer ${
              showSettings
                ? 'bg-[#0B6758] text-white border-[#085446]'
                : 'bg-white hover:bg-[#E1ECE8] text-[#081820] border-[#8BA39B]'
            }`}
          >
            <SettingsIcon size={17} />
            <span>Display &amp; Accessibility</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Dual Status Header with Persistence, Radio state, Dynamic Type Scale, and Pitch Toggle */}
        <div className="shrink-0 flex items-center justify-between bg-[#EDF2EF] border-b border-[#CBD8D4] pr-4">
          <div className="flex-1 min-w-0">
            <DualStatusHeader />
          </div>
          <button
            type="button"
            onClick={() => setIsLandingPage(!isLandingPage)}
            className={`hidden sm:inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl text-xs font-bold transition-colors border shrink-0 cursor-pointer ${
              isLandingPage
                ? 'bg-[#0B6758] text-white border-[#085446] hover:bg-[#085446]'
                : 'bg-white hover:bg-[#E1ECE8] text-[#081820] border-[#8BA39B]'
            }`}
          >
            <Globe size={16} className="text-[#0B6758]" />
            <span>{isLandingPage ? 'Return to SAR Portal' : 'Overview & Pitch'}</span>
          </button>
        </div>

        {/* Mobile App Bar Header (<1024px) */}
        <div className="lg:hidden shrink-0 flex items-center justify-between px-4 py-2.5 bg-white border-b border-[#CBD8D4]">
          <AberTechBrand />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLandingPage(!isLandingPage)}
              className="px-3.5 py-2 min-h-[44px] min-w-[44px] rounded-xl text-xs font-bold bg-[#081820] text-white cursor-pointer"
            >
              {isLandingPage ? 'Portal' : 'Overview'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLandingPage(false);
                setShowSettings(!showSettings);
              }}
              className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#081820] bg-[#EDF2EF] border border-[#B8C9C3] hover:bg-[#E1ECE8] cursor-pointer"
              title="Display & Accessibility Settings"
              aria-label="Display and Accessibility Settings"
            >
              <SettingsIcon size={20} />
            </button>
          </div>
        </div>

        {/* Active Screen Container (Scroll View with overscroll-behavior: contain) */}
        <main className="flex-1 flex flex-col overflow-hidden relative hig-scroll-view">
          {isLandingPage ? (
            <LandingPage
              onLaunchOperation={() => {
                setIsLandingPage(false);
                setCurrentStep(7);
              }}
              onStartNewMission={() => {
                setIsLandingPage(false);
                setCurrentStep(2);
              }}
              onOpenStep={(step) => {
                setIsLandingPage(false);
                setCurrentStep(step);
              }}
            />
          ) : showSettings ? (
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
            <div className="flex-1 flex items-center justify-center gap-2.5 p-6 text-base font-medium text-[#1E3831]">
              <Loader2 size={20} className="animate-spin text-[#0B6758]" />
              <span>Loading incident workspace...</span>
            </div>
          )}
        </main>

        {/* Mobile Bottom Tab Bar (<1024px) */}
        {!showSettings && !isLandingPage && (
          <MobileBottomNav currentStep={currentStep} onNavigateStep={(step) => setCurrentStep(step)} />
        )}
      </div>

      {/* Modal Sheet: Log Observation / Field Note (Apple HIG Alerts & Sheets: explicit dismissal, 44pt inputs, 17px font) */}
      {showLogObservationModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowLogObservationModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-5 shadow-2xl border border-[#B8C9C3]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="log-obs-modal-title"
          >
            <div className="flex items-center justify-between border-b border-[#CBD8D4] pb-3">
              <h3 id="log-obs-modal-title" className="font-bold text-base text-[#081820]">
                Log Field Observation / Radio Note
              </h3>
              <button
                type="button"
                onClick={() => setShowLogObservationModal(false)}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-[#1E3831] hover:bg-[#EDF2EF] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="obs-sector-select"
                  className="block text-sm font-bold text-[#081820] mb-1.5"
                >
                  Sector / Source
                </label>
                <select
                  id="obs-sector-select"
                  value={obsSector}
                  onChange={(e) => setObsSector(e.target.value)}
                  className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#8BA39B] text-[#081820] bg-[#F6F9F7] focus:bg-white"
                >
                  <option value="Sector A (Alpha)">Sector A · Northern path (Team Alpha)</option>
                  <option value="Sector B (Bravo)">Sector B · Southern drainage (Team Bravo)</option>
                  <option value="Base Station">Base Station / Storey Arms HQ</option>
                  <option value="Witness Report">Incoming witness report</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="obs-entry-textarea"
                  className="block text-sm font-bold text-[#081820] mb-1.5"
                >
                  Observation Entry
                </label>
                <textarea
                  id="obs-entry-textarea"
                  rows={3}
                  value={obsNote}
                  onChange={(e) => setObsNote(e.target.value)}
                  placeholder="e.g. Footprints identified heading NE on ridge path; visibility dropping to 2km."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#8BA39B] text-[#081820] bg-[#F6F9F7] focus:bg-white leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#CBD8D4]">
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
