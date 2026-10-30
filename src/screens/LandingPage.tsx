import React, { useState } from 'react';
import {
  Compass,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Layers,
  ArrowRight,
  Zap,
  Clock,
  DollarSign,
  Mountain,
  Users,
  Camera,
  FileText,
  CheckCircle2,
  ExternalLink,
  Award,
  Terminal,
  Cpu,
  ChevronRight,
  Info,
  X,
  Play,
  Heart,
  Globe,
} from 'lucide-react';
import { AberTechBrand, PrimaryButton, SecondaryButton, StatusBadge } from '../components/Common';

interface LandingPageProps {
  onLaunchOperation: () => void;
  onStartNewMission: () => void;
  onOpenStep: (stepNumber: number) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchOperation,
  onStartNewMission,
  onOpenStep,
}) => {
  const [showAboutModal, setShowAboutModal] = useState(false);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F4F7F5] overflow-y-auto hig-scroll-view">
      {/* Top Navigation Header for Landing Page */}
      <header className="sticky top-0 z-30 bg-[#1C2E2A] text-white border-b border-[#0B6758]/40 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/abertech_hex_logo.svg"
              alt="AberTech Hexagonal Mountain & Lake Logo"
              className="w-10 h-10 object-contain bg-transparent select-none shrink-0"
            />
            <span className="font-extrabold text-white text-base tracking-tight">AberTech</span>
          </div>
          <div className="hidden sm:block h-5 w-px bg-white/20" />
          <span className="hidden sm:inline font-mono text-xs text-[#A4D0C8] font-medium">
            Search &amp; Rescue Autonomous Orchestration
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setShowAboutModal(true)}
            className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold text-[#A4D0C8] hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Info size={14} />
            <span>About Me &amp; AberTech</span>
          </button>

          <PrimaryButton
            onClick={onLaunchOperation}
            className="text-xs py-1.5 px-3.5 bg-[#0B6758] hover:bg-[#07483D] text-white"
            icon={<Play size={14} />}
          >
            Launch Live MVP (SAR-026)
          </PrimaryButton>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-dither-dark text-[#E0F8D0] px-4 sm:px-8 py-12 sm:py-20 border-b border-[#0B6758]/40 overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10 space-y-6 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#081820] border border-[#88C070]/60 text-[#FACC15] text-xs font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-[#88C070] animate-ping" />
            <span>OPERATIONAL MVP · BANNAU BRYCHEINIOG DEMONSTRATION</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight max-w-4xl text-white">
            Compressing <span className="text-[#88C070]">500 km²</span> blind wilderness searches into{' '}
            <span className="text-[#FACC15]">1 km²</span> targeted extractions within ten minutes.
          </h1>

          <p className="text-sm sm:text-lg text-[#E0F8D0]/90 max-w-3xl leading-relaxed">
            The mission orchestration platform engineered for Mountain Rescue and Austere Emergency Services.
            Uniting kinematic wander-radius probability contours, real-time terrain-weather causality modeling,
            live GPS position tracking, sub-second proximity geofencing, and automated 2 C.F.R. § 200 grant audit trails.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <PrimaryButton
              onClick={onLaunchOperation}
              className="text-sm py-2.5 px-5 bg-[#FACC15] hover:bg-[#EAB308] text-[#081820] font-extrabold"
              icon={<Play size={16} />}
            >
              Launch Live Operational Portal (Step 07)
            </PrimaryButton>

            <SecondaryButton
              onClick={() => setShowAboutModal(true)}
              className="text-sm py-2.5 px-4 bg-[#081820] hover:bg-[#1B4D3E] text-[#E0F8D0] border-[#88C070]/60"
              icon={<Info size={15} />}
            >
              Read &ldquo;About Me&rdquo; &amp; AberTech
            </SecondaryButton>

            <button
              type="button"
              onClick={onStartNewMission}
              className="min-h-[44px] text-xs font-semibold text-[#88C070] hover:underline px-3 py-2 flex items-center gap-1 cursor-pointer"
            >
              <span>Or begin new incident setup (Step 01)</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left font-mono tabular-nums">
            <div className="bg-[#081820] border border-[#88C070]/50 rounded-xl p-3.5">
              <div className="text-xl sm:text-2xl font-black text-[#88C070]">10 MIN</div>
              <div className="text-xs text-[#E0F8D0]/85 mt-0.5 font-sans">Time to 1 km² convergence</div>
            </div>
            <div className="bg-[#081820] border border-[#88C070]/50 rounded-xl p-3.5">
              <div className="text-xl sm:text-2xl font-black text-white">&lt;$5 / HR</div>
              <div className="text-xs text-[#E0F8D0]/85 mt-0.5 font-sans">Variable compute vs $10k/hr helo</div>
            </div>
            <div className="bg-[#FACC15] border border-[#CA8A04] rounded-xl p-3.5 text-[#081820]">
              <div className="text-xl sm:text-2xl font-black">70.4%</div>
              <div className="text-xs font-bold mt-0.5 font-sans">Demand error eliminated</div>
            </div>
            <div className="bg-[#081820] border border-[#88C070]/50 rounded-xl p-3.5">
              <div className="text-xl sm:text-2xl font-black text-[#8ED0FF]">ZERO CLOUD</div>
              <div className="text-xs text-[#E0F8D0]/85 mt-0.5 font-sans">Offline edge on legacy laptops</div>
            </div>
          </div>
        </div>
      </section>

      {/* The Macro Problem & The Value AberTech Brings */}
      <section className="px-4 sm:px-8 py-12 max-w-6xl mx-auto w-full space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0B6758] font-mono">
            The Push of Struggle · Why 500 km² Searches Fail
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#1C2E2A]">
            The Cost-Speed-Coverage Asymmetry in Search &amp; Rescue
          </h2>
          <p className="text-sm text-[#5A706A]">
            Surging upland footfall (+51%) meets frozen municipal park budgets and volunteer burnout.
            75% to 85% of technical tools fail adoption because they ignore the incident commander&apos;s operational reality.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Pillar 1: Kinematic Saturation vs Blind Helo Sorties */}
          <div className="bg-white rounded-xl border border-[#E2E8E5] p-5 shadow-xs hover:border-[#0B6758] transition-all space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#E1ECE8] flex items-center justify-center text-[#0B6758]">
              <Clock size={20} />
            </div>
            <h3 className="text-lg font-bold text-[#1C2E2A]">
              1. Kinematic Saturation vs. $10,000/hr Blind Sorties
            </h3>
            <p className="text-xs text-[#5A706A] leading-relaxed">
              Responders face a brutal <strong>48–72 hour deprivation clock</strong> before subject mortality spikes.
              Helicopters burn $3,000–$10,000/hr (€8,000/hr in Europe) with strict 4-hour fuel limits, while ground searchers cover only 0.5–1 acre/hr.
              Unbounded searches produce a <strong>70.4% demand error</strong>.
            </p>
            <div className="bg-[#F4F6F5] p-2.5 rounded-lg border border-[#E2E8E5] text-xs font-mono text-[#0B6758]">
              <strong>AberTech Solution:</strong> Bayesian on-foot saturation model (d₅₀ = 3,000m, τ = 6.0h) creating 50%, 75%, and 95% H3 probability rings within minutes.
            </div>
          </div>

          {/* Pillar 2: Real-Time Causality & Hexagonal Terrain Viability */}
          <div className="bg-white rounded-xl border border-[#E2E8E5] p-5 shadow-xs hover:border-[#0B6758] transition-all space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#E1ECE8] flex items-center justify-center text-[#0B6758]">
              <Layers size={20} />
            </div>
            <h3 className="text-lg font-bold text-[#1C2E2A]">
              2. Real-Time Causality & Terrain-Weather Viability
            </h3>
            <p className="text-xs text-[#5A706A] leading-relaxed">
              Mountain weather shifts without warning. When summit gusts exceed 16.5 m/s, drone airframes destabilize and must be grounded;
              when temperatures drop, hypothermia accelerates; and dog scent cones disperse above 13.0 m/s.
            </p>
            <div className="bg-[#F4F6F5] p-2.5 rounded-lg border border-[#E2E8E5] text-xs font-mono text-[#0B6758]">
              <strong>AberTech Solution:</strong> Real-time Causality Engine continuously checks environmental telemetry against team and equipment envelopes across 18 hex sectors.
            </div>
          </div>

          {/* Pillar 3: Proximity Geofencing & Boundary Drift Alerts */}
          <div className="bg-white rounded-xl border border-[#E2E8E5] p-5 shadow-xs hover:border-[#0B6758] transition-all space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#FEF2F2] flex items-center justify-center text-[#DC2626]">
              <ShieldAlert size={20} />
            </div>
            <h3 className="text-lg font-bold text-[#1C2E2A]">
              3. Proximity Geofencing & Responders Safety
            </h3>
            <p className="text-xs text-[#5A706A] leading-relaxed">
              Searchers navigating dense mist or steep cwms experience spatial disorientation. Drifting outside assigned sectors creates fatal blind spots
              and exposes personnel to sheer crag drop-offs (e.g., Craig Cwm Llwch 45° scarps).
            </p>
            <div className="bg-[#FEF2F2] p-2.5 rounded-lg border border-red-200 text-xs font-mono text-[#991B1B]">
              <strong>AberTech Solution:</strong> Automated sub-second proximity alerts flash with distance breached, immediate terrain hazard alerts, and one-click VHF radio re-vectoring.
            </div>
          </div>

          {/* Pillar 4: Zero-Cloud Edge & 2 CFR 200 Audit Compliance */}
          <div className="bg-white rounded-xl border border-[#E2E8E5] p-5 shadow-xs hover:border-[#0B6758] transition-all space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#E1ECE8] flex items-center justify-center text-[#0B6758]">
              <FileText size={20} />
            </div>
            <h3 className="text-lg font-bold text-[#1C2E2A]">
              4. Zero-Cloud Edge & 2 C.F.R. § 200 Audit Compliance
            </h3>
            <p className="text-xs text-[#5A706A] leading-relaxed">
              Cloud AI fails completely in cellular dead zones. Streaming gigabytes of video over satellite is unfeasible.
              Meanwhile, <strong>$13.5B in FEMA relief</strong> has been clawed back from public safety agencies due to missing 2 C.F.R. § 200 log retention.
            </p>
            <div className="bg-[#F4F6F5] p-2.5 rounded-lg border border-[#E2E8E5] text-xs font-mono text-[#0B6758]">
              <strong>AberTech Solution:</strong> Pure Kotlin and C++17 local execution on rugged laptops, with turnkey 3-year automated audit logs reducing procurement overhead by 29%.
            </div>
          </div>
        </div>

        {/* 9-Step Unified Workflow Ribbon */}
        <div className="bg-[#1C2E2A] text-white rounded-2xl p-6 sm:p-8 space-y-4 shadow-lg border border-[#0B6758]/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2D4540] pb-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-[#A4D0C8] font-bold">
                Unified 9-Step Architecture
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                From Emergency Call to Reconciled Audit Trail
              </h3>
            </div>
            <PrimaryButton
              onClick={onLaunchOperation}
              className="text-xs bg-[#0B6758] hover:bg-[#07483D] text-white shrink-0 self-start sm:self-center"
              icon={<ArrowRight size={14} />}
            >
              Open Active Mission (07 / 09)
            </PrimaryButton>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-9 gap-2 text-xs">
            {[
              { num: '01', title: 'Missions', desc: 'Audit Register' },
              { num: '02', title: 'Incident', desc: 'Metadata Draft' },
              { num: '03', title: 'LKP Pin', desc: 'Storey Arms' },
              { num: '04', title: 'Last Seen', desc: 'Subject Profile' },
              { num: '05', title: 'Search Plan', desc: 'H3 Hex Tiling' },
              { num: '06', title: 'Resources', desc: 'Causality Model' },
              { num: '07', title: 'Active Ops', desc: 'Proximity Alert' },
              { num: '08', title: 'Evidence', desc: 'FLIR Candidates' },
              { num: '09', title: 'Closeout', desc: '2 CFR 200 Audit' },
            ].map((step, idx) => (
              <button
                key={step.num}
                type="button"
                onClick={() => onOpenStep(idx + 1)}
                className={`p-2.5 rounded-xl border text-left transition-all group ${
                  idx + 1 === 7
                    ? 'bg-[#0B6758] border-[#86EFAC] text-white shadow-md'
                    : 'bg-[#142320] border-[#2D4540] text-gray-300 hover:border-[#0B6758]'
                }`}
              >
                <div className="font-mono text-[10px] opacity-75 font-bold">STEP {step.num}</div>
                <div className="font-bold text-white text-xs mt-0.5 group-hover:text-[#86EFAC]">
                  {step.title}
                </div>
                <div className="text-[10px] text-gray-400 truncate mt-0.5">{step.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Live CTA Section */}
        <div className="bg-[#E1ECE8] border border-[#0B6758]/30 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl font-bold text-[#1C2E2A]">
              Experience the Bannau Brycheiniog (Brecon Beacons) Live Incident
            </h3>
            <p className="text-xs text-[#5A706A] max-w-xl">
              Inspect live hexagonal sectors, trigger boundary drift proximity alerts for Team Bravo, ground UAV-01 under summit gales, and review FLIR thermal candidate frames.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <SecondaryButton
              onClick={() => setShowAboutModal(true)}
              className="text-xs bg-white text-[#1C2E2A]"
            >
              About the Project
            </SecondaryButton>
            <PrimaryButton
              onClick={onLaunchOperation}
              className="text-xs bg-[#0B6758] text-white"
              icon={<Play size={14} />}
            >
              Launch Live Portal
            </PrimaryButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-[#142320] text-gray-400 text-xs py-6 px-4 sm:px-8 border-t border-[#0B6758]/30">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AberTechBrand />
            <span className="text-[11px] text-gray-500">· Search & Rescue Systems · Bannau Brycheiniog</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              type="button"
              onClick={() => setShowAboutModal(true)}
              className="hover:text-white transition-colors underline"
            >
              About the Author & AberTech
            </button>
            <span>2 C.F.R. § 200.334 Verified</span>
            <span>UK National Grid OS GB36</span>
          </div>
        </div>
      </footer>

      {/* Modal: About Me / About the Project & Company */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E2E8E5] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#1C2E2A] text-white p-5 rounded-t-2xl flex items-center justify-between border-b border-[#0B6758]/40">
              <div className="flex items-center gap-2.5">
                <img
                  src="/assets/aistudio/abertech_hex_logo.svg"
                  alt="AberTech Hexagonal Mountain & Lake Logo"
                  className="w-9 h-9 object-contain bg-transparent select-none shrink-0"
                />
                <div>
                  <h3 className="font-bold text-base text-white">About Me & AberTech</h3>
                  <p className="text-xs text-[#A4D0C8]">The Founder, Mission, and Problems Solved</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-xs text-[#1C2E2A] leading-relaxed">
              {/* Founder Profile */}
              <div className="space-y-2 border-b border-[#E2E8E5] pb-4">
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-[#0B6758]" />
                  <h4 className="font-bold text-sm uppercase tracking-wide text-[#1C2E2A]">
                    About the Author · Ikram Choudhury
                  </h4>
                </div>
                <p className="text-[#5A706A]">
                  <strong>Founder & Chief Architect</strong> of AberTech. Senior software engineer and spatial systems researcher with deep technical pedigree across mission-critical aviation and telemetry pipelines:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[#5A706A]">
                  <li>
                    <strong>ICES Journal Research (Feb 2026):</strong> Published author on cloud OME-Zarr telemetry architecture; presented 2,000-specimen OpenCL edge CV pipelines at ICES 2024.
                  </li>
                  <li>
                    <strong>Fleet & Aviation Telemetry:</strong> Deployed vessel monitoring patches with <strong>Cefas</strong> (Centre for Environment, Fisheries and Aquaculture Science) and engineered AWS cloud telemetry infrastructure for <strong>British Airways</strong>.
                  </li>
                  <li>
                    <strong>First-Hand Upland Field Testing:</strong> Validated sensor drift, canopy interference, and mountain weather extremes through rigorous fieldwork across Bannau Brycheiniog (Brecon Beacons), Welsh Waterfall Country, and sub-zero Iceland snowstorms.
                  </li>
                </ul>
              </div>

              {/* Company Vision */}
              <div className="space-y-2 border-b border-[#E2E8E5] pb-4">
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-[#0B6758]" />
                  <h4 className="font-bold text-sm uppercase tracking-wide text-[#1C2E2A]">
                    About AberTech & The Company Vision
                  </h4>
                </div>
                <p className="text-[#5A706A]">
                  <strong>AberTech</strong> is building the mission operating system for wilderness search and rescue and austere emergency services. Our mission is to <strong>compress 500 km² blind searches into 1 km² targeted extractions within the first ten minutes</strong>.
                </p>
                <p className="text-[#5A706A]">
                  Search and rescue operations in mountainous terrain are hamstrung by outdated manual maps, high false-alarm rates from ungrounded drone analytics, and zero cellular connectivity. AberTech bridges the gap with zero-cloud edge processing, bringing military-grade spatio-temporal modeling to volunteer teams on their existing laptops.
                </p>
              </div>

              {/* The Problems Solved */}
              <div className="space-y-2 border-b border-[#E2E8E5] pb-4">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-[#0B6758]" />
                  <h4 className="font-bold text-sm uppercase tracking-wide text-[#1C2E2A]">
                    The Value It Brings Through Problems Solved
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="bg-[#F4F6F5] p-2.5 rounded-lg border border-[#E2E8E5]">
                    <strong className="text-[#0B6758] block mb-0.5">Golden Hour Preservation</strong>
                    <span className="text-[#5A706A]">
                      Prevents the 70.4% searcher demand error by defining kinematic probability rings before boots leave the rendezvous.
                    </span>
                  </div>
                  <div className="bg-[#F4F6F5] p-2.5 rounded-lg border border-[#E2E8E5]">
                    <strong className="text-[#0B6758] block mb-0.5">Terrain-Weather Causality</strong>
                    <span className="text-[#5A706A]">
                      Dynamically checks slope angles (&gt;35° scarp) and wind speeds against UAV and K9 scent envelopes so commanders make viable taskings.
                    </span>
                  </div>
                  <div className="bg-[#F4F6F5] p-2.5 rounded-lg border border-[#E2E8E5]">
                    <strong className="text-[#0B6758] block mb-0.5">Responder Geofencing</strong>
                    <span className="text-[#5A706A]">
                      Sub-second proximity alerts alert commanders when a team drifts into hazardous scarp perimeters, preventing searcher loss.
                    </span>
                  </div>
                  <div className="bg-[#F4F6F5] p-2.5 rounded-lg border border-[#E2E8E5]">
                    <strong className="text-[#0B6758] block mb-0.5">2 C.F.R. § 200 Audit Defense</strong>
                    <span className="text-[#5A706A]">
                      Eliminates paper logs and secures FEMA/DRRA grant compliance, protecting rescue agencies from clawbacks.
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] text-[#5A706A] font-mono">
                  AberTech Search & Rescue Systems · Bannau Brycheiniog MVP
                </span>

                <div className="flex items-center gap-2">
                  <SecondaryButton onClick={() => setShowAboutModal(false)}>
                    Close
                  </SecondaryButton>
                  <PrimaryButton
                    onClick={() => {
                      setShowAboutModal(false);
                      onLaunchOperation();
                    }}
                    icon={<Play size={14} />}
                  >
                    Launch Live MVP
                  </PrimaryButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
