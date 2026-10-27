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
} from 'lucide-react';
import { Card, PrimaryButton, SecondaryButton, StatusBadge, StepHeader } from '../components/Common';
import { Rescue } from '../types';

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

  const weather = rescue.plan?.weather || {
    wind_ms: 11.2,
    gust_ms: 15.4,
    precipitation_mm_h: 0.8,
    visibility_m: 3200,
    temperature_c: 8.5,
    cloud_cover_pct: 65,
    daylight: true,
    source: 'Bannau station telemetry',
  };

  const isConfirmed = assumptionsChecked && radiosChecked;

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F5] overflow-y-auto">
      <StepHeader
        stepNumber="06 / 09"
        stepTitle="COMMANDER CONFIRMATION"
        missionRef={rescue.mission_reference}
      />

      <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1C2E2A] tracking-tight">
            Resources & commander confirmation
          </h1>
          <p className="text-xs text-[#5A706A] mt-0.5">
            Step 6 of 9 · Verify resource feasibility and confirm radio allocations before deploying teams
          </p>
        </div>

        {/* Live Weather Telemetry Banner */}
        <Card className="bg-white border-[#E2E8E5]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8E5] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Wind size={18} className="text-[#0B6758]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A]">
                Field Weather Telemetry (Storey Arms Station)
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#5A706A]">
              Updated 12:25 UTC · Daylight active
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5]">
              <span className="text-[#5A706A] block text-[11px]">Sustained Wind / Gust</span>
              <span className="font-bold text-[#1C2E2A] text-sm mt-0.5 block font-mono">
                {weather.wind_ms} m/s <span className="text-[#9A690B]">({weather.gust_ms} g)</span>
              </span>
            </div>
            <div className="p-2.5 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5]">
              <span className="text-[#5A706A] block text-[11px]">Visibility</span>
              <span className="font-bold text-[#1C2E2A] text-sm mt-0.5 block font-mono">
                {weather.visibility_m.toLocaleString()} m
              </span>
            </div>
            <div className="p-2.5 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5]">
              <span className="text-[#5A706A] block text-[11px]">Temperature</span>
              <span className="font-bold text-[#1C2E2A] text-sm mt-0.5 block font-mono">
                {weather.temperature_c}°C
              </span>
            </div>
            <div className="p-2.5 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5]">
              <span className="text-[#5A706A] block text-[11px]">Cloud Ceiling</span>
              <span className="font-bold text-[#1C2E2A] text-sm mt-0.5 block font-mono">
                {weather.cloud_cover_pct}%
              </span>
            </div>
          </div>
        </Card>

        {/* Resource Allocation & Teams */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Column 1: Team Sizing & Allocation */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8E5] pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A] flex items-center gap-1.5">
                <Users size={16} className="text-[#0B6758]" />
                <span>Recommended Team Allocation</span>
              </span>
              <StatusBadge type="green" label="14 personnel" />
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1C2E2A]">Team Alpha · 8 Searchers</span>
                  <span className="text-[11px] font-mono text-[#0B6758] font-bold">VHF Ch 1</span>
                </div>
                <div className="text-xs text-[#5A706A] mt-1">
                  Sector A · Northern path hasty sweep towards Corn Du
                </div>
                <div className="text-[11px] text-[#5A706A] mt-1 font-mono">
                  Target speed: 1.2 km/h · 4h endurance
                </div>
              </div>

              <div className="p-3 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1C2E2A]">Team Bravo · 6 Searchers</span>
                  <span className="text-[11px] font-mono text-[#0B6758] font-bold">VHF Ch 2</span>
                </div>
                <div className="text-xs text-[#5A706A] mt-1">
                  Sector B · Southern drainage search line
                </div>
                <div className="text-[11px] text-[#5A706A] mt-1 font-mono">
                  Target speed: 0.8 km/h · 4h endurance
                </div>
              </div>
            </div>
          </Card>

          {/* Column 2: Equipment Viability Rules */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8E5] pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A] flex items-center gap-1.5">
                <Radio size={16} className="text-[#0B6758]" />
                <span>Equipment Viability Checks</span>
              </span>
              <span className="text-[11px] text-[#5A706A]">Automated Rule Evaluator</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5] flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-[#1C2E2A]">Ground Foot Teams</div>
                  <div className="text-[11px] text-[#5A706A]">14 searchers available with VHF radios</div>
                </div>
                <StatusBadge type="green" label="Ready" icon={<CheckCircle2 size={12} />} />
              </div>

              <div className="p-2.5 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5] flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-[#1C2E2A]">UAV Recon (Visual / Thermal)</div>
                  <div className="text-[11px] text-[#5A706A]">Wind 11.2 m/s near 12 m/s airframe limit</div>
                </div>
                <StatusBadge type="amber" label="Conditional" icon={<AlertCircle size={12} />} />
              </div>

              <div className="p-2.5 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5] flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-[#1C2E2A]">SARDA Trailing Dog Team</div>
                  <div className="text-[11px] text-[#5A706A]">Scent age {Math.round(weather.temperature_c > 15 ? 12 : 36)}h cutoff; scree terrain blocked</div>
                </div>
                <StatusBadge type="red" label="Blocked" icon={<XCircle size={12} />} />
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
                  I have reviewed the model assumptions and initial search area
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
            onClick={onConfirmAndStart}
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
