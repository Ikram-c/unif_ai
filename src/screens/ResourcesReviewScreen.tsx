import React, { useState } from 'react';
import {
  Users,
  Wind,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ShieldCheck,
  Radio,
  ArrowLeft,
  Compass,
  Clock,
  Layers,
  Plane,
  Dog,
  Anchor,
  Wrench,
  AlertTriangle,
} from 'lucide-react';
import {
  AreaPrecacheBanner,
  Card,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  StepHeader,
} from '../components/Common';
import { DetailedWeatherReport, Rescue, WeatherScenarioKey } from '../types';
import { QuickWeatherWidget } from '../components/QuickWeatherWidget';
import {
  DEFAULT_TACTICAL_TEAMS,
  evaluateCellViability,
  WEATHER_PRESETS,
} from '../core/CausalityModel';
import { areaPrecacheService } from '../core/AreaPrecacheService';

interface ResourcesReviewScreenProps {
  rescue: Rescue;
  onBack: () => void;
  onConfirmAndStart: () => void;
}

export const ResourcesReviewScreen: React.FC<ResourcesReviewScreenProps> = ({
  rescue,
  onBack,
  onConfirmAndStart,
}) => {
  const [assumptionsChecked, setAssumptionsChecked] = useState(rescue.assumptions_reviewed || false);
  const [radiosChecked, setRadiosChecked] = useState(rescue.radio_allocations_confirmed || false);
  const [weather, setWeather] = useState<DetailedWeatherReport>(WEATHER_PRESETS.BASELINE);

  const isConfirmed = assumptionsChecked && radiosChecked;

  // Evaluate causality on primary search cells
  const sampleCell = rescue.plan?.regions?.[0]?.cell || {
    cell_id: 'hex:0:0',
    centre: rescue.last_known_location,
    boundary: [],
    terrain: 'OPEN_MOORLAND' as const,
    area_km2: 1.2,
  };

  const causalityReport = evaluateCellViability(sampleCell, weather, DEFAULT_TACTICAL_TEAMS);

  const handleSelectScenario = (key: WeatherScenarioKey) => {
    setWeather(WEATHER_PRESETS[key]);
  };

  const handleUpdateWeather = (updated: DetailedWeatherReport) => {
    setWeather(updated);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F4F7F5] overflow-y-auto hig-scroll-view">
      <StepHeader
        stepNumber="06 / 09"
        stepTitle="COMMANDER CONFIRMATION"
        missionRef={rescue.mission_reference}
      />

      <div className="p-4 sm:p-6 pb-8 max-w-5xl mx-auto w-full space-y-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1C2E2A] tracking-tight">
            Resources & Causality Feasibility Sign-off
          </h1>
          <p className="text-xs text-[#5A706A] mt-0.5">
            Step 6 of 9 · Verify resource feasibility and confirm radio allocations using real-time causality model
          </p>
        </div>

        {/* Background Pre-Cache Status Banner */}
        <AreaPrecacheBanner rescue={rescue} />

        {/* Quick Weather Report & Live Atmospheric Constraints */}
        <QuickWeatherWidget
          weather={weather}
          onSelectScenario={handleSelectScenario}
          onUpdateWeather={handleUpdateWeather}
        />

        {/* Resource Allocation & Teams */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Column 1: Team Sizing & Allocation */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8E5] pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A] flex items-center gap-1.5">
                <Users size={16} className="text-[#0B6758]" />
                <span>Tactical Asset Viability (Causality Evaluated)</span>
              </span>
              <StatusBadge
                type={causalityReport.viability === 'VIABLE' ? 'green' : 'amber'}
                label={`${causalityReport.overall_score}% Viable`}
              />
            </div>

            <div className="space-y-2.5 text-xs">
              {causalityReport.team_assessments.slice(0, 5).map((team) => (
                <div
                  key={team.team_id}
                  className="p-3 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#1C2E2A]">
                      Team {team.callsign}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        team.status === 'VIABLE'
                          ? 'bg-[#E1ECE8] text-[#0B6758]'
                          : team.status === 'DEGRADED'
                          ? 'bg-[#FEF3DD] text-[#9A690B]'
                          : 'bg-[#FEE2E2] text-[#DC2626]'
                      }`}
                    >
                      {team.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#5A706A] leading-tight">
                    {team.reason}
                  </div>
                  {team.viable && (
                    <div className="text-[10px] text-[#0B6758] font-mono font-semibold pt-0.5">
                      Estimated rate: {team.speed_kmh} km/h · {team.pod_pct}% POD
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Column 2: Equipment Suitability Checks */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8E5] pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A] flex items-center gap-1.5">
                <Wrench size={16} className="text-[#0B6758]" />
                <span>Equipment Suitability Rules</span>
              </span>
              <span className="text-[11px] font-mono text-[#5A706A]">Real-Time Rules</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {causalityReport.equipment_assessments.map((eq) => (
                <div
                  key={eq.equipment}
                  className="p-2.5 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5] flex items-start justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-[#1C2E2A]">{eq.equipment}</div>
                    <div className="text-[11px] text-[#5A706A] leading-tight">{eq.reason}</div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      eq.status === 'OPTIMAL'
                        ? 'bg-[#E1ECE8] text-[#0B6758]'
                        : eq.status === 'USABLE'
                        ? 'bg-white text-[#1C2E2A] border border-[#E2E8E5]'
                        : eq.status === 'DEGRADED'
                        ? 'bg-[#FEF3DD] text-[#9A690B]'
                        : 'bg-[#FEE2E2] text-[#DC2626]'
                    }`}
                  >
                    {eq.status}
                  </span>
                </div>
              ))}

              <div className="p-3 bg-[#E1ECE8] rounded-lg border border-[#0B6758]/20 text-[11px] text-[#07483D] font-medium">
                <strong>Model Directive:</strong> {causalityReport.primary_recommendation}
              </div>
            </div>
          </Card>
        </div>

        {/* Mandatory Commander Review & Confirmation Checkboxes */}
        <Card className="border-[#0B6758] bg-[#F4F6F5] space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#0B6758]" />
            <h2 className="text-sm font-bold text-[#1C2E2A] uppercase tracking-wide">
              Commander Sign-off & Audit Seal
            </h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 bg-white rounded-lg border border-[#E2E8E5] cursor-pointer hover:border-[#0B6758] transition-colors">
              <input
                type="checkbox"
                checked={assumptionsChecked}
                onChange={(e) => setAssumptionsChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-[#0B6758]"
              />
              <div className="text-xs text-[#1C2E2A] leading-relaxed">
                <span className="font-bold block text-[#1C2E2A] mb-0.5">
                  I have reviewed the causality model assumptions and initial search area
                </span>
                Confirmed that the 3-hour window and on-foot wander parameters at Storey Arms form a
                sensible initial allocation without confirming target presence.
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-white rounded-lg border border-[#E2E8E5] cursor-pointer hover:border-[#0B6758] transition-colors">
              <input
                type="checkbox"
                checked={radiosChecked}
                onChange={(e) => setRadiosChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-[#0B6758]"
              />
              <div className="text-xs text-[#1C2E2A] leading-relaxed">
                <span className="font-bold block text-[#1C2E2A] mb-0.5">
                  Radio channel allocations & 30-minute fallback check-in confirmed
                </span>
                Team Alpha assigned VHF Ch 1 (Sector A) and Team Bravo assigned VHF Ch 2 (Sector B).
                Local encrypted log will retain commander ID{' '}
                <strong className="font-mono text-[#0B6758]">{rescue.commander_reference}</strong>.
              </div>
            </label>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <SecondaryButton onClick={onBack} icon={<ArrowLeft size={16} />}>
            Back to search plan
          </SecondaryButton>
          <PrimaryButton
            onClick={() => {
              areaPrecacheService.triggerAreaPrecache(rescue, {
                triggeredFrom: 'Step 06 Confirm & Start Operation',
              });
              onConfirmAndStart();
            }}
            disabled={!isConfirmed}
            icon={<Compass size={16} />}
          >
            Confirm and start operation
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};
