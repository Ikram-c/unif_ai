import React, { useState } from 'react';
import {
  Compass,
  ShieldCheck,
  Radio,
  CloudDownload,
  Layers,
  MapPin,
  Wind,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Activity,
  Lock,
  FileCheck,
  Plus,
  Play,
  Users,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Card, PrimaryButton, SecondaryButton, StatusBadge } from '../components/Common';
import { Rescue } from '../types';

interface LandingPageProps {
  activeRescue?: Rescue;
  completedCount: number;
  onEnterWorkspace: () => void;
  onResumeActiveOperation: () => void;
  onStartNewIncident: () => void;
  onNavigateToStep: (step: number) => void;
}

type LandingSubScreen = 'HERO' | 'CAPABILITIES' | 'WORKFLOW' | 'COMPLIANCE';

export const LandingPage: React.FC<LandingPageProps> = ({
  activeRescue,
  completedCount,
  onEnterWorkspace,
  onResumeActiveOperation,
  onStartNewIncident,
  onNavigateToStep,
}) => {
  const [subScreen, setSubScreen] = useState<LandingSubScreen>('HERO');
  const [selectedCapabilityIdx, setSelectedCapabilityIdx] = useState<number>(0);

  const subScreens: {
    id: LandingSubScreen;
    num: string;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'HERO',
      num: '01',
      label: 'Welcome & Quick Launch',
      shortLabel: 'Welcome',
      icon: <Compass size={16} />,
    },
    {
      id: 'CAPABILITIES',
      num: '02',
      label: 'Core Capabilities',
      shortLabel: 'Capabilities',
      icon: <Layers size={16} />,
    },
    {
      id: 'WORKFLOW',
      num: '03',
      label: 'Step-by-Step Guide',
      shortLabel: 'Workflow',
      icon: <Activity size={16} />,
    },
    {
      id: 'COMPLIANCE',
      num: '04',
      label: 'Privacy & Audit Specs',
      shortLabel: 'Privacy & Audit',
      icon: <ShieldCheck size={16} />,
    },
  ];

  const capabilities = [
    {
      id: 'spatial-hex',
      badge: 'Pillar 01',
      title: 'Probability Contours & Hexagonal Sectors',
      summary:
        'Calculates 50%, 75%, and 90% subject reach rings from the Last Known Point (LKP) and divides terrain into manageable hexagonal search sectors.',
      metrics: [
        { label: 'Contour Rings', value: '50% · 75% · 90% POA' },
        { label: 'Grid System', value: 'H3 Hexagonal Cells' },
        { label: 'Terrain Aware', value: 'Slope & Moorland Weighted' },
      ],
      bullets: [
        'Automatically adjusts travel speed for steep uplands, river valleys, and trail networks.',
        'Ranks sectors A, B, and C so incident commanders can assign ground teams immediately.',
        'Displays clear planning disclaimers to distinguish probability models from confirmed sightings.',
      ],
      targetStep: 5,
      ctaLabel: 'Open Search Plan & Contours',
      icon: <MapPin size={20} />,
      iconBg: 'bg-[#007AFF]',
    },
    {
      id: 'weather-causality',
      badge: 'Pillar 02',
      title: 'Live Weather & Asset Viability',
      summary:
        'Evaluates wind gusts, cloud ceiling, visibility, and precipitation against safety thresholds for foot teams, K9 units, UAVs, and helicopters.',
      metrics: [
        { label: 'UAV Wind Limit', value: '32 kts Gusts / 600m Ceiling' },
        { label: 'K9 Scent Model', value: 'Wind & Rain Adjusted' },
        { label: 'Battery Alerts', value: '>50% Green · <20% Red' },
      ],
      bullets: [
        'Instant weather presets (Baseline, Summit Gale, Dense Fog, Freezing Night) plus fine-grained sliders.',
        'Automatically flags when high winds ground UAVs or reduce K9 scent-tracking effectiveness.',
        'Real-time battery pills alert commanders when any unit drops below 20%.',
      ],
      targetStep: 6,
      ctaLabel: 'Inspect Resource & Weather Checks',
      icon: <Wind size={20} />,
      iconBg: 'bg-[#FF9500]',
    },
    {
      id: 'proximity-geofence',
      badge: 'Pillar 03',
      title: 'Boundary Drift & Proximity Alerts',
      summary:
        'Monitors live GPS positions for every deployed team and triggers a clear visual alert if a unit drifts outside its assigned search sector.',
      metrics: [
        { label: 'Warning Zone', value: '< 100m to Sector Edge' },
        { label: 'Breach Alert', value: 'Out-of-Bounds Vector' },
        { label: 'Quick Dispatch', value: '1-Tap Map Waypoint' },
      ],
      bullets: [
        'Calculates real-time distance and bearing back to the assigned sector boundary.',
        'One-tap radio check and corrective waypoint dispatch directly on the tactical map.',
        'Interactive simulation controls let commanders test boundary drift and UAV thermal detections.',
      ],
      targetStep: 7,
      ctaLabel: 'Open Active Tactical Map',
      icon: <Radio size={20} />,
      iconBg: 'bg-[#34C759]',
    },
    {
      id: 'offline-audit',
      badge: 'Pillar 04',
      title: 'Offline Area Cache & 3-Year Audit Trail',
      summary:
        'Pre-caches topographic map tiles and localized weather in the background and records an immutable 2 C.F.R. § 200.334 compliance log.',
      metrics: [
        { label: 'Offline Cache', value: '48 Map Tiles · 18 Wx Sectors' },
        { label: 'Audit Retention', value: '3 Years (2 C.F.R. § 200.334)' },
        { label: 'Privacy', value: '100% Local Device Storage' },
      ],
      bullets: [
        'Automatically caches Z11–Z14 topographic tiles around the search area for zero-signal valleys.',
        'Requires human ground verification for all UAV thermal candidates before closing a sector.',
        'Exports a complete, timestamped JSON audit package upon mission reconciliation.',
      ],
      targetStep: 9,
      ctaLabel: 'Open Audit & Closeout Record',
      icon: <CloudDownload size={20} />,
      iconBg: 'bg-[#5856D6]',
    },
  ];

  const workflowPhases = [
    {
      phase: 'Phase 1',
      title: 'Incident Setup & Anchor',
      description: 'Create the incident file, plot the Last Known Point (LKP), and record subject mobility.',
      steps: [
        {
          step: 1,
          code: '01',
          name: 'Field Workspace',
          desc: 'Review active and archived missions or start a new incident.',
        },
        {
          step: 2,
          code: '02',
          name: 'Incident Identity',
          desc: 'Assign mission reference, lead agency, commander ID, and subject tag.',
        },
        {
          step: 3,
          code: '03',
          name: 'Last-Known Location',
          desc: 'Anchor WGS84 coordinates on the map and select terrain profile.',
        },
        {
          step: 4,
          code: '04',
          name: 'Subject Profile',
          desc: 'Log time elapsed since last seen and movement mode.',
        },
      ],
    },
    {
      phase: 'Phase 2',
      title: 'Search Planning & Sign-Off',
      description: 'Generate probability contours, pre-cache offline maps, and verify weather viability.',
      steps: [
        {
          step: 5,
          code: '05',
          name: 'Search Plan & Contours',
          desc: 'Inspect 50%/75%/90% probability rings and H3 hexagonal sectors.',
        },
        {
          step: 6,
          code: '06',
          name: 'Commander Sign-Off',
          desc: 'Check weather impact on teams and confirm VHF radio channels.',
        },
      ],
    },
    {
      phase: 'Phase 3',
      title: 'Active Command & Closeout',
      description: 'Track units in real time, verify aerial anomalies, and seal the final audit record.',
      steps: [
        {
          step: 7,
          code: '07',
          name: 'Active Operation',
          desc: 'Monitor live map, unit telemetry, weather changes, and geofence alerts.',
        },
        {
          step: 8,
          code: '08',
          name: 'Evidence Review',
          desc: 'Review UAV thermal detections and assign ground teams to verify.',
        },
        {
          step: 9,
          code: '09',
          name: 'Mission Closeout',
          desc: 'Account for all personnel and export the 2 C.F.R. § 200 audit file.',
        },
      ],
    },
  ];

  const currentIdx = subScreens.findIndex((s) => s.id === subScreen);
  const activeCap = capabilities[selectedCapabilityIdx];

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F2F2F7] overflow-y-auto hig-scroll-view">
      {/* Apple HIG Sticky Navigation Bar with Segmented Control */}
      <div className="shrink-0 bg-white/95 backdrop-blur-md border-b border-[#D1D1D6] px-4 sm:px-6 py-3 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 hig-app-icon bg-[#007AFF] text-white flex items-center justify-center shrink-0">
              <Compass size={17} strokeWidth={2.25} />
            </div>
            <div>
              <span className="text-sm font-bold text-[#1C1C1E] block leading-none">
                Overview &amp; Quick Start
              </span>
              <span className="text-xs text-[#636366] font-medium">
                Screen {currentIdx + 1} of {subScreens.length} · {subScreens[currentIdx].label}
              </span>
            </div>
          </div>

          {/* Apple HIG Segmented Control */}
          <div
            className="hig-segmented-control overflow-x-auto no-scrollbar max-w-full"
            role="tablist"
            aria-label="Landing Page Sections"
          >
            {subScreens.map((tab) => {
              const active = tab.id === subScreen;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSubScreen(tab.id)}
                  className={`hig-segment-btn inline-flex items-center gap-1.5 whitespace-nowrap ${
                    active ? 'active' : ''
                  }`}
                >
                  {tab.icon}
                  <span>{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area — Clean Apple HIG Grouped Layout */}
      <div className="flex-1 p-4 sm:p-6 pb-10 hig-safe-area max-w-5xl mx-auto w-full flex flex-col justify-between gap-6">
        {/* =================================================================
            SUB-SCREEN 01: WELCOME & QUICK LAUNCH
            ================================================================= */}
        {subScreen === 'HERO' && (
          <div className="space-y-6">
            {/* Clean Apple HIG Hero Card (Vector Icons Only — Zero Background Art) */}
            <Card className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F2FF] text-[#0062CC] text-xs font-semibold">
                  <Sparkles size={14} />
                  <span>Offline-First Mountain Rescue Command</span>
                </div>
                <StatusBadge
                  type="green"
                  label="All Map & Weather Systems Ready"
                  icon={<CheckCircle2 size={13} />}
                />
              </div>

              <div className="space-y-3 max-w-3xl">
                <h1 className="text-2xl sm:text-4xl font-bold text-[#1C1C1E] tracking-tight leading-tight">
                  Clear, reliable search &amp; rescue coordination for field commanders.
                </h1>
                <p className="text-sm sm:text-base text-[#3A3A3C] leading-relaxed">
                  Plan probability contours, monitor live team GPS and battery health, evaluate
                  weather limits, and maintain a complete offline audit log—organized into calm,
                  focused screens.
                </p>
              </div>

              {/* Primary Action Bar */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {activeRescue && (
                  <PrimaryButton
                    onClick={onResumeActiveOperation}
                    icon={<Play size={16} />}
                  >
                    Resume {activeRescue.mission_reference} ({activeRescue.mission_name})
                  </PrimaryButton>
                )}

                <SecondaryButton
                  onClick={onEnterWorkspace}
                  icon={<Layers size={16} />}
                >
                  Open Field Workspace
                </SecondaryButton>

                <SecondaryButton
                  onClick={onStartNewIncident}
                  icon={<Plus size={16} />}
                >
                  New Incident Setup
                </SecondaryButton>
              </div>
            </Card>

            {/* Apple HIG Inset Grouped Quick Access List */}
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#636366] px-1">
                Quick Actions &amp; Live Status
              </h2>
              <div className="hig-inset-group divide-y divide-[#D1D1D6]">
                {activeRescue && (
                  <button
                    type="button"
                    onClick={onResumeActiveOperation}
                    className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-[#F2F2F7]/70 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 hig-app-icon bg-[#34C759] text-white flex items-center justify-center shrink-0">
                        <Compass size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm sm:text-base text-[#1C1C1E]">
                            Active Incident: {activeRescue.mission_name}
                          </span>
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-[#E8F8EE] text-[#15803D]">
                            {activeRescue.mission_reference}
                          </span>
                        </div>
                        <p className="text-xs text-[#636366] mt-0.5 truncate">
                          LKP: {activeRescue.location_label} · 6 field units deployed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#007AFF] shrink-0">
                      <span className="hidden sm:inline">Open Map</span>
                      <ChevronRight size={18} className="text-[#8E8E93]" />
                    </div>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSubScreen('CAPABILITIES')}
                  className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-[#F2F2F7]/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 hig-app-icon bg-[#007AFF] text-white flex items-center justify-center shrink-0">
                      <Layers size={20} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-sm sm:text-base text-[#1C1C1E] block">
                        Explore 4 Core System Capabilities
                      </span>
                      <span className="text-xs text-[#636366] block mt-0.5">
                        Probability contours, weather causality, boundary alerts, and offline caching
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-[#8E8E93] shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => setSubScreen('WORKFLOW')}
                  className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-[#F2F2F7]/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 hig-app-icon bg-[#FF9500] text-white flex items-center justify-center shrink-0">
                      <Activity size={20} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-sm sm:text-base text-[#1C1C1E] block">
                        View 9-Step Incident Workflow
                      </span>
                      <span className="text-xs text-[#636366] block mt-0.5">
                        Jump directly to any stage from initial LKP anchor to final audit sign-off
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-[#8E8E93] shrink-0" />
                </button>
              </div>
            </div>

            {/* Summary Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#636366]">
                  <span>Offline Area Cache</span>
                  <CloudDownload size={16} className="text-[#007AFF]" />
                </div>
                <div className="text-lg font-bold text-[#1C1C1E]">
                  Z11–Z14 Topo &amp; Weather
                </div>
                <p className="text-xs text-[#636366]">
                  48 map tiles and 18 sector weather cells cached locally.
                </p>
              </Card>

              <Card className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#636366]">
                  <span>Deployed Field Units</span>
                  <Users size={16} className="text-[#34C759]" />
                </div>
                <div className="text-lg font-bold text-[#1C1C1E]">
                  6 Tactical Units
                </div>
                <p className="text-xs text-[#636366]">
                  Live GPS tracking, battery health pills, and sector drift alerts.
                </p>
              </Card>

              <Card className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#636366]">
                  <span>Statutory Compliance</span>
                  <ShieldCheck size={16} className="text-[#5856D6]" />
                </div>
                <div className="text-lg font-bold text-[#1C1C1E]">
                  2 C.F.R. § 200.334
                </div>
                <p className="text-xs text-[#636366]">
                  {completedCount} archived missions sealed with 3-year local retention.
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* =================================================================
            SUB-SCREEN 02: CORE CAPABILITIES
            ================================================================= */}
        {subScreen === 'CAPABILITIES' && (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1C1C1E] tracking-tight">
                Core Operational Capabilities
              </h1>
              <p className="text-xs sm:text-sm text-[#636366] mt-0.5">
                Select any capability below to inspect how it supports field decision-making.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left 5 Cols: Apple HIG Inset Grouped Selector */}
              <div className="lg:col-span-5 hig-inset-group divide-y divide-[#D1D1D6]">
                {capabilities.map((cap, idx) => {
                  const selected = idx === selectedCapabilityIdx;
                  return (
                    <button
                      key={cap.id}
                      type="button"
                      onClick={() => setSelectedCapabilityIdx(idx)}
                      className={`w-full text-left p-4 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                        selected ? 'bg-[#E8F2FF]/70' : 'hover:bg-[#F2F2F7]/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 hig-app-icon ${cap.iconBg} text-white flex items-center justify-center shrink-0`}
                        >
                          {cap.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#007AFF]">
                            {cap.badge}
                          </div>
                          <div className="text-sm font-bold text-[#1C1C1E] truncate">
                            {cap.title}
                          </div>
                        </div>
                      </div>
                      <ChevronRight
                        size={18}
                        className={selected ? 'text-[#007AFF] shrink-0' : 'text-[#C7C7CC] shrink-0'}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Right 7 Cols: Focused Capability Detail Card */}
              <div className="lg:col-span-7">
                <Card className="p-5 sm:p-6 space-y-5">
                  <div className="flex items-start justify-between gap-3 border-b border-[#D1D1D6] pb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 hig-app-icon ${activeCap.iconBg} text-white flex items-center justify-center shrink-0`}
                      >
                        {activeCap.icon}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-[#007AFF]">
                          {activeCap.badge}
                        </span>
                        <h2 className="text-lg sm:text-xl font-bold text-[#1C1C1E]">
                          {activeCap.title}
                        </h2>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-[#3A3A3C] leading-relaxed">
                    {activeCap.summary}
                  </p>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {activeCap.metrics.map((m) => (
                      <div
                        key={m.label}
                        className="p-3 rounded-xl bg-[#F2F2F7] border border-[#D1D1D6]"
                      >
                        <span className="text-[11px] font-medium text-[#636366] block">
                          {m.label}
                        </span>
                        <span className="font-mono font-bold text-xs sm:text-sm text-[#1C1C1E] mt-0.5 block">
                          {m.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Bullet Points */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#636366] block">
                      Key Highlights
                    </span>
                    {activeCap.bullets.map((b, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F2F2F7]/60 text-xs sm:text-sm text-[#1C1C1E]"
                      >
                        <CheckCircle2 size={16} className="text-[#34C759] shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-[#D1D1D6] flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-xs text-[#636366]">
                      Available in Step 0{activeCap.targetStep} of the workflow
                    </span>
                    <PrimaryButton
                      onClick={() => onNavigateToStep(activeCap.targetStep)}
                      icon={<ArrowRight size={15} />}
                    >
                      {activeCap.ctaLabel}
                    </PrimaryButton>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            SUB-SCREEN 03: 9-STEP WORKFLOW
            ================================================================= */}
        {subScreen === 'WORKFLOW' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#1C1C1E] tracking-tight">
                  9-Step Incident Workflow
                </h1>
                <p className="text-xs sm:text-sm text-[#636366] mt-0.5">
                  Organized into 3 clear phases. Tap any step to jump straight to that screen.
                </p>
              </div>
              <PrimaryButton onClick={onStartNewIncident} icon={<Plus size={16} />}>
                Start Step 02 (New Incident)
              </PrimaryButton>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {workflowPhases.map((phase) => (
                <div key={phase.phase} className="space-y-2.5 flex flex-col">
                  <div className="px-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#007AFF]">
                      {phase.phase}
                    </span>
                    <h2 className="text-base font-bold text-[#1C1C1E]">{phase.title}</h2>
                    <p className="text-xs text-[#636366] mt-0.5">{phase.description}</p>
                  </div>

                  <div className="hig-inset-group divide-y divide-[#D1D1D6] flex-1">
                    {phase.steps.map((st) => (
                      <button
                        key={st.step}
                        type="button"
                        onClick={() => onNavigateToStep(st.step)}
                        className="w-full text-left p-4 hover:bg-[#F2F2F7]/70 transition-colors cursor-pointer flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="font-mono text-xs font-bold px-2 py-1 rounded-lg bg-[#E8F2FF] text-[#0062CC] shrink-0 mt-0.5">
                            {st.code}
                          </span>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm text-[#1C1C1E]">
                              {st.name}
                            </div>
                            <p className="text-xs text-[#636366] mt-0.5 leading-relaxed">
                              {st.desc}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-[#C7C7CC] shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================
            SUB-SCREEN 04: PRIVACY, ACCESSIBILITY & AUDIT SPECS
            ================================================================= */}
        {subScreen === 'COMPLIANCE' && (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1C1C1E] tracking-tight">
                Apple HIG Usability, Privacy &amp; Compliance
              </h1>
              <p className="text-xs sm:text-sm text-[#636366] mt-0.5">
                Designed for high readability, one-handed field operation, and statutory audit compliance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Card className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-3 border-b border-[#D1D1D6] pb-3">
                  <div className="w-10 h-10 hig-app-icon bg-[#007AFF] text-white flex items-center justify-center shrink-0">
                    <Compass size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1C1C1E]">
                      Human Interface Design Standards
                    </h2>
                    <span className="text-xs text-[#636366]">
                      Built for clarity in rain, mist, and low light
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm text-[#3A3A3C]">
                  <div className="p-3 rounded-xl bg-[#F2F2F7] flex items-center justify-between">
                    <span className="font-medium text-[#1C1C1E]">Minimum Touch Targets</span>
                    <span className="font-mono font-semibold text-[#0062CC]">44 × 44 pt</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F2F2F7] flex items-center justify-between">
                    <span className="font-medium text-[#1C1C1E]">Dynamic Type Scaling</span>
                    <span className="font-mono font-semibold text-[#0062CC]">100% · 115% · 130%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F2F2F7] flex items-center justify-between">
                    <span className="font-medium text-[#1C1C1E]">Contrast Ratio</span>
                    <span className="font-mono font-semibold text-[#15803D]">WCAG AAA / ≥ 4.5:1</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F2F2F7] flex items-center justify-between">
                    <span className="font-medium text-[#1C1C1E]">Appearance Modes</span>
                    <span className="font-mono font-semibold text-[#1C1C1E]">Light · High Contrast · Dark</span>
                  </div>
                </div>
              </Card>

              <Card className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-3 border-b border-[#D1D1D6] pb-3">
                  <div className="w-10 h-10 hig-app-icon bg-[#34C759] text-white flex items-center justify-center shrink-0">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1C1C1E]">
                      Zero-Cloud Privacy &amp; 2 C.F.R. § 200.334
                    </h2>
                    <span className="text-xs text-[#636366]">
                      Local-first storage with tamper-evident export
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm text-[#3A3A3C]">
                  <div className="p-3 rounded-xl bg-[#F2F2F7] space-y-1">
                    <div className="font-semibold text-[#1C1C1E] flex items-center gap-1.5">
                      <FileCheck size={15} className="text-[#007AFF]" />
                      <span>3-Year Statutory Retention</span>
                    </div>
                    <p className="text-xs text-[#636366]">
                      Every coordinate anchor, weather snapshot, radio log, and team sign-off is retained on-device.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F2F2F7] space-y-1">
                    <div className="font-semibold text-[#1C1C1E] flex items-center gap-1.5">
                      <ShieldCheck size={15} className="text-[#34C759]" />
                      <span>Human-in-the-Loop Verification</span>
                    </div>
                    <p className="text-xs text-[#636366]">
                      Probabilistic contours and UAV thermal detections require human ground team confirmation.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-2.5">
                  <PrimaryButton onClick={onEnterWorkspace} icon={<Layers size={16} />}>
                    Enter Field Workspace
                  </PrimaryButton>
                  <SecondaryButton onClick={() => onNavigateToStep(9)} icon={<FileCheck size={16} />}>
                    View Audit Log
                  </SecondaryButton>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Bottom Stepper Footer */}
        <div className="pt-4 border-t border-[#D1D1D6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {subScreens.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSubScreen(s.id)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  s.id === subScreen
                    ? 'w-7 bg-[#007AFF]'
                    : 'w-2 bg-[#C7C7CC] hover:bg-[#8E8E93]'
                }`}
                aria-label={`Go to ${s.label}`}
              />
            ))}
            <span className="text-xs font-medium text-[#636366] ml-2">
              {currentIdx + 1} of {subScreens.length}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {currentIdx > 0 && (
              <SecondaryButton
                onClick={() => setSubScreen(subScreens[currentIdx - 1].id)}
                icon={<ArrowLeft size={15} />}
              >
                Previous
              </SecondaryButton>
            )}
            {currentIdx < subScreens.length - 1 ? (
              <PrimaryButton
                onClick={() => setSubScreen(subScreens[currentIdx + 1].id)}
                icon={<ArrowRight size={15} />}
              >
                Next: {subScreens[currentIdx + 1].shortLabel}
              </PrimaryButton>
            ) : (
              <PrimaryButton
                onClick={onResumeActiveOperation}
                icon={<Play size={15} />}
              >
                Launch Active Operation
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
