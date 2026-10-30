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
  MountainHorizonCard,
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
import { areaPrecacheService } from './core/AreaPrecacheService';
import { TimeFormat } from './core/TimeFormat';

export const App: React.FC = () => {
  const [rescues, setRescues] = useState<Rescue[]>(rescueRepository.allRescues);
  const [selectedRescueId, setSelectedRescueId] = useState<string>('SAR-026');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLandingPage, setIsLandingPage] = useState<boolean>(true);
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
          title: 'Commander confirmed allocations & pre-cached search area',
          details: `${currentRescue.commander_reference} · Alpha 8 (Ch 1) / Bravo 6 (Ch 2) · Z11-Z14 tiles & weather pre-cached`,
          timestamp: now.toISOString(),
        },
      ],
    };

    areaPrecacheService.triggerAreaPrecache(updated, {
      triggeredFrom: 'Search Plan → Active Operation Transition',
    });
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

  // Desktop Navigation items grouped clearly
  const navItems = [
    { step: 1, label: '01 Field Workspace', icon: <Layers size={18} /> },
    { step: 5, label: '05 Search Plan & Area', icon: <Globe size={18} /> },
    { step: 7, label: '07 Active Operation', icon: <Compass size={18} /> },
    { step: 8, label: '08 Evidence Review', icon: <Camera size={18} /> },
    { step: 9, label: '09 Audit & Closure', icon: <FileText size={18} /> },
  ];

  return (
    <div className="h-dvh w-full overflow-hidden bg-[#F2F2F7] text-[#1C1C1E] flex lg:grid lg:grid-cols-[minmax(272px,296px)_1fr]">
      {/* 1. Desktop Sidebar — Apple HIG System Grouped Sidebar */}
      <aside className="hidden lg:flex flex-col bg-[#F2F2F7] text-[#1C1C1E] border-r border-[#D1D1D6] shrink-0 z-20 overflow-y-auto">
        {/* Brand Header */}
        <div className="p-4 border-b border-[#D1D1D6] bg-white/80 backdrop-blur-md">
          <AberTechBrand subtitle="Field · SR Portal" />
        </div>

        {/* Landing Page & Overview Highlight Button */}
        <div className="p-3.5 pb-2">
          <button
            type="button"
            onClick={() => {
              setShowSettings(false);
              setIsLandingPage(!isLandingPage);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 min-h-[44px] rounded-xl text-[14px] font-semibold transition-all border cursor-pointer ${
              isLandingPage
                ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-xs'
                : 'bg-white text-[#1C1C1E] border-[#D1D1D6] hover:bg-[#E5E5EA]/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Globe size={17} className={isLandingPage ? 'text-white' : 'text-[#007AFF]'} />
              <span>{isLandingPage ? '00 Overview Guide' : '00 Home & Guide'}</span>
            </div>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-md font-mono font-semibold ${
                isLandingPage ? 'bg-white/20 text-white' : 'bg-[#F2F2F7] text-[#6C6C70]'
              }`}
            >
              GUIDE
            </span>
          </button>
        </div>

        {/* Primary Step Navigation — Apple HIG Sidebar List */}
        <div className="px-3.5 py-2 space-y-1">
          <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#6C6C70]">
            Primary Screens
          </div>
          <div className="bg-white rounded-2xl border border-[#D1D1D6] p-1.5 space-y-0.5">
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-xl text-[14px] transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#007AFF]/12 text-[#007AFF] font-semibold'
                      : 'bg-transparent text-[#1C1C1E] font-medium hover:bg-[#F2F2F7]'
                  }`}
                >
                  <span className={isActive ? 'text-[#007AFF]' : 'text-[#6C6C70]'}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Setup Wizard Steps Sub-section */}
        <div className="px-3.5 py-2 space-y-1">
          <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#6C6C70]">
            Setup &amp; Planning Steps
          </div>
          <div className="bg-white rounded-2xl border border-[#D1D1D6] p-1.5 space-y-0.5">
            {[
              { s: 2, name: '02 Incident Details' },
              { s: 3, name: '03 Last Known Point' },
              { s: 4, name: '04 Subject & Window' },
              { s: 5, name: '05 Search Plan Area' },
              { s: 6, name: '06 Resource Review' },
            ].map((stepItem) => {
              const active = !isLandingPage && !showSettings && currentStep === stepItem.s;
              return (
                <button
                  key={stepItem.s}
                  type="button"
                  onClick={() => {
                    setIsLandingPage(false);
                    setShowSettings(false);
                    setCurrentStep(stepItem.s);
                  }}
                  className={`w-full text-left px-3 py-2 min-h-[40px] rounded-xl text-[13px] transition-colors cursor-pointer ${
                    active
                      ? 'font-semibold text-[#007AFF] bg-[#007AFF]/12'
                      : 'font-medium text-[#3C3C43] hover:bg-[#F2F2F7]'
                  }`}
                >
                  {stepItem.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Mission Summary Card — Clean Apple HIG Grouped Widget */}
        {currentRescue && (
          <MountainHorizonCard
            onClick={() => {
              setIsLandingPage(false);
              setShowSettings(false);
              setCurrentStep(7);
            }}
            className="mx-3.5 my-2 p-4 space-y-2.5 bg-white border-[#D1D1D6] hover:border-[#007AFF]"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-semibold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-0.5 rounded-md tabular-nums">
                {currentRescue.mission_reference}
              </span>
              <span className="text-xs text-[#6C6C70] font-mono font-medium">
                Cmdr {currentRescue.commander_reference}
              </span>
            </div>
            <div>
              <div className="text-[15px] font-semibold text-[#1C1C1E] truncate">
                {currentRescue.mission_name}
              </div>
              <div className="text-xs text-[#6C6C70] truncate">
                {currentRescue.location_label}
              </div>
            </div>
            <div className="pt-2 border-t border-[#E5E5EA] flex items-center justify-between">
              <ActivityRing
                percentage={68}
                size={34}
                strokeWidth={4}
                color="#34C759"
                label="Sector Sweep"
              />
              <span className="text-[12px] font-semibold px-2.5 py-1 rounded-lg bg-[#007AFF]/10 text-[#007AFF]">
                Open →
              </span>
            </div>
          </MountainHorizonCard>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Hardware Tag & Settings */}
        <div className="p-3.5 border-t border-[#D1D1D6] space-y-2.5 bg-white/80">
          <div className="flex items-center justify-between text-xs font-medium text-[#6C6C70]">
            <span className="font-mono font-semibold bg-[#F2F2F7] px-2.5 py-1 rounded-md border border-[#D1D1D6] text-[#1C1C1E]">
              {settingsStore.settings.deviceTag}
            </span>
            <span className="text-[#248A3D] font-mono font-semibold">Offline Ready</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#6C6C70]">
            <ShieldCheck size={15} className="text-[#007AFF] shrink-0" />
            <span>3-Year 2 CFR 200 Retention</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsLandingPage(false);
              setShowSettings(true);
            }}
            className={`w-full flex items-center justify-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl border text-[13px] font-semibold transition-colors cursor-pointer ${
              showSettings
                ? 'bg-[#007AFF] text-white border-[#007AFF]'
                : 'bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] border-[#D1D1D6]'
            }`}
          >
            <SettingsIcon size={16} />
            <span>Display &amp; Settings</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden min-w-0">
        {/* Top Dual Status Header */}
        <div className="shrink-0">
          <DualStatusHeader />
        </div>

        {/* Mobile App Bar Header (<1024px) — Apple HIG Translucent Navigation Bar */}
        <div className="lg:hidden shrink-0 flex items-center justify-between px-4 py-2.5 bg-white/90 backdrop-blur-md text-[#1C1C1E] border-b border-[#D1D1D6]">
          <AberTechBrand />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLandingPage(!isLandingPage)}
              className={`px-3.5 py-1.5 min-h-[38px] rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                isLandingPage
                  ? 'bg-[#007AFF] text-white border-[#007AFF]'
                  : 'bg-[#F2F2F7] text-[#007AFF] border-[#D1D1D6] hover:bg-[#E5E5EA]'
              }`}
            >
              {isLandingPage ? 'Workspace' : 'Guide'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLandingPage(false);
                setShowSettings(!showSettings);
              }}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#007AFF] hover:bg-[#F2F2F7] cursor-pointer"
              title="Display & Accessibility Settings"
              aria-label="Display and Accessibility Settings"
            >
              <SettingsIcon size={20} />
            </button>
          </div>
        </div>

        {/* Active Screen Container (min-h-0 ensures flex child scrolls properly on mobile & desktop) */}
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden relative hig-scroll-view">
          {isLandingPage ? (
            <LandingPage
              activeRescue={currentRescue}
              completedCount={rescues.filter((r) => r.status === 'COMPLETED').length}
              onResumeActiveOperation={() => {
                setIsLandingPage(false);
                setCurrentStep(7);
              }}
              onEnterWorkspace={() => {
                setIsLandingPage(false);
                setCurrentStep(1);
              }}
              onStartNewIncident={() => {
                setIsLandingPage(false);
                setCurrentStep(2);
              }}
              onNavigateToStep={(step: number) => {
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
              onOpenEvidence={() => setCurrentStep(8)}
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
              onProceedToReview={() => {
                areaPrecacheService.triggerAreaPrecache(currentRescue, {
                  triggeredFrom: 'Search Plan → Commander Confirmation',
                });
                setCurrentStep(6);
              }}
              onLaunchActiveOperation={() => {
                areaPrecacheService.triggerAreaPrecache(currentRescue, {
                  triggeredFrom: 'Search Plan → Active Operation Direct Launch',
                  force: true,
                });
                setCurrentStep(7);
              }}
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
            <div className="flex-1 flex items-center justify-center gap-2.5 p-6 text-base font-medium text-[#4A635D]">
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

      {/* Modal Sheet: Log Observation / Field Note */}
      {showLogObservationModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowLogObservationModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-5 shadow-2xl border border-[#DCE5E1]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="log-obs-modal-title"
          >
            <div className="flex items-center justify-between border-b border-[#DCE5E1] pb-3">
              <h3 id="log-obs-modal-title" className="font-bold text-base text-[#1C2E2A]">
                Log Field Observation / Radio Note
              </h3>
              <button
                type="button"
                onClick={() => setShowLogObservationModal(false)}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-[#4A635D] hover:bg-[#F4F7F5] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="obs-sector-select"
                  className="block text-sm font-bold text-[#1C2E2A] mb-1.5"
                >
                  Sector / Source
                </label>
                <select
                  id="obs-sector-select"
                  value={obsSector}
                  onChange={(e) => setObsSector(e.target.value)}
                  className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#CBD8D4] text-[#1C2E2A] bg-[#F4F7F5] focus:bg-white"
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
                  className="block text-sm font-bold text-[#1C2E2A] mb-1.5"
                >
                  Observation Entry
                </label>
                <textarea
                  id="obs-entry-textarea"
                  rows={3}
                  value={obsNote}
                  onChange={(e) => setObsNote(e.target.value)}
                  placeholder="e.g. Footprints identified heading NE on ridge path; visibility dropping to 2km."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD8D4] text-[#1C2E2A] bg-[#F4F7F5] focus:bg-white leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#DCE5E1]">
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
