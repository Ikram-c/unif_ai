import React from 'react';
import {
  AlertTriangle,
  Users,
  Mountain,
  Wrench,
  X,
  TrendingUp,
} from 'lucide-react';
import { CellCausalityReport, SearchCell } from '../types';
import { SecondaryButton } from './Common';

interface CellCausalityInspectorProps {
  cell: SearchCell;
  report: CellCausalityReport;
  onClose: () => void;
  onAssignTeam?: (teamCallsign: string, cellId: string) => void;
  className?: string;
}

export const CellCausalityInspector: React.FC<CellCausalityInspectorProps> = ({
  cell,
  report,
  onClose,
  onAssignTeam,
  className = '',
}) => {
  const getViabilityColor = (level: string) => {
    switch (level) {
      case 'VIABLE':
        return 'text-[#064E3B] bg-[#E1ECE8] border-[#0B6758]';
      case 'DEGRADED':
        return 'text-[#78350F] bg-[#FEF3DD] border-[#D97706]';
      case 'RESTRICTED':
        return 'text-[#78350F] bg-[#FEF3DD] border-[#D97706]';
      case 'BLOCKED':
        return 'text-[#991B1B] bg-[#FEE2E2] border-[#DC2626]';
      default:
        return 'text-[#1E3831] bg-[#EDF2EF] border-[#B8C9C3]';
    }
  };

  const getEquipmentStatusBadge = (status: string) => {
    switch (status) {
      case 'OPTIMAL':
        return (
          <span className="text-xs font-bold text-[#064E3B] bg-[#E1ECE8] px-2 py-0.5 rounded-full border border-[#A7C7BE]">
            Optimal
          </span>
        );
      case 'USABLE':
        return (
          <span className="text-xs font-bold text-[#081820] bg-white border border-[#B8C9C3] px-2 py-0.5 rounded-full">
            Usable
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="text-xs font-bold text-[#78350F] bg-[#FEF3DD] border border-[#D97706] px-2 py-0.5 rounded-full">
            Degraded
          </span>
        );
      case 'PROHIBITED':
        return (
          <span className="text-xs font-bold text-[#991B1B] bg-[#FEE2E2] border border-[#DC2626] px-2 py-0.5 rounded-full">
            Prohibited
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`tactical-card rounded-2xl p-4 sm:p-5 space-y-4 text-xs ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#CBD8D4] pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 hig-app-icon bg-[#0B6758] text-white flex items-center justify-center font-bold shrink-0">
            <Mountain size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-base text-[#081820]">
                Hexagon {report.cell_id}
              </span>
              <span
                className={`text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full border ${getViabilityColor(
                  report.viability
                )}`}
              >
                {report.viability} ({report.overall_score}%)
              </span>
            </div>
            <p className="text-xs text-[#1E3831] font-mono tabular-nums mt-0.5">
              Centre: {cell.centre.lat.toFixed(4)}°N, {Math.abs(cell.centre.lon).toFixed(4)}°W ·{' '}
              {cell.area_km2.toFixed(2)} km²
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-[#1E3831] hover:bg-[#EDF2EF] hover:text-[#081820] transition-colors cursor-pointer"
          title="Close inspector"
          aria-label="Close causality inspector"
        >
          <X size={20} />
        </button>
      </div>

      {/* Terrain Parameters Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-2.5 bg-[#F6F9F7] rounded-xl border border-[#CBD8D4]">
          <span className="text-[#1E3831] font-medium block">Elevation</span>
          <span className="font-bold text-[#081820] font-mono text-sm tabular-nums">
            {report.terrain.elevation_m} m ASL
          </span>
        </div>
        <div className="p-2.5 bg-[#F6F9F7] rounded-xl border border-[#CBD8D4]">
          <span className="text-[#1E3831] font-medium block">Slope Angle</span>
          <span className="font-bold text-[#081820] font-mono text-sm tabular-nums">
            {report.terrain.slope_deg}° ({report.terrain.slope_category})
          </span>
        </div>
        <div className="p-2.5 bg-[#F6F9F7] rounded-xl border border-[#CBD8D4]">
          <span className="text-[#1E3831] font-medium block">Substrate</span>
          <span className="font-bold text-[#081820] text-sm">
            {report.terrain.substrate}
          </span>
        </div>
        <div className="p-2.5 bg-[#F6F9F7] rounded-xl border border-[#CBD8D4]">
          <span className="text-[#1E3831] font-medium block">Exposure</span>
          <span
            className={`font-bold text-sm ${
              report.terrain.exposure_level === 'EXTREME' ? 'text-[#DC2626]' : 'text-[#081820]'
            }`}
          >
            {report.terrain.exposure_level}
          </span>
        </div>
      </div>

      {/* Active Hazards Callout if any */}
      {report.terrain.hazard_tags.length > 0 && (
        <div className="bg-[#FEF3DD] border border-[#D97706] rounded-xl p-3 text-xs text-[#78350F] space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-[#081820]">
            <AlertTriangle size={15} className="text-[#B45309]" />
            <span>Terrain &amp; Environmental Hazards Detected:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {report.terrain.hazard_tags.map((tag) => (
              <span
                key={tag}
                className="bg-white px-2.5 py-0.5 rounded-full text-xs font-semibold border border-[#D97706]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Primary Causality Recommendation */}
      <div className="p-3.5 bg-[#E1ECE8] border border-[#0B6758]/40 rounded-xl space-y-1">
        <span className="text-xs font-bold text-[#064E3B] flex items-center gap-1.5">
          <TrendingUp size={15} />
          <span>Causality Model Operational Guidance</span>
        </span>
        <p className="text-sm font-semibold text-[#081820]">
          {report.primary_recommendation}
        </p>
      </div>

      {/* Team Viability Breakdown (Lists & Tables: Row >= 44pt) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-[#081820] flex items-center gap-1.5">
            <Users size={16} className="text-[#0B6758]" />
            <span>Team Feasibility &amp; Efficacy</span>
          </span>
          <span className="text-xs font-mono font-semibold text-[#1E3831]">
            {report.team_assessments.filter((t) => t.viable).length} of{' '}
            {report.team_assessments.length} Viable
          </span>
        </div>

        <div className="divide-y divide-[#CBD8D4] border border-[#CBD8D4] rounded-xl overflow-hidden bg-[#F6F9F7]">
          {report.team_assessments.map((team) => (
            <div
              key={team.team_id}
              className="hig-list-row p-3 flex items-center justify-between gap-3"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[#081820] text-sm">Team {team.callsign}</span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getViabilityColor(
                      team.status
                    )}`}
                  >
                    {team.status}
                  </span>
                  {team.viable && (
                    <span className="text-xs font-mono text-[#1E3831] tabular-nums">
                      {team.speed_kmh} km/h · {team.pod_pct}% POD
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#1E3831] leading-snug">
                  {team.reason}
                </p>
              </div>

              {onAssignTeam && team.viable && (
                <button
                  type="button"
                  onClick={() => onAssignTeam(team.callsign, report.cell_id)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#0B6758] hover:bg-[#085446] text-white font-bold text-xs shrink-0 transition-colors cursor-pointer"
                >
                  Task Here
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Equipment Viability Breakdown */}
      <div className="space-y-2.5 border-t border-[#CBD8D4] pt-3.5">
        <span className="text-sm font-bold text-[#081820] flex items-center gap-1.5">
          <Wrench size={16} className="text-[#0B6758]" />
          <span>Equipment Suitability</span>
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {report.equipment_assessments.map((eq) => (
            <div
              key={eq.equipment}
              className="p-3 rounded-xl bg-[#F6F9F7] border border-[#CBD8D4] space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-xs text-[#081820] truncate">
                  {eq.equipment}
                </span>
                {getEquipmentStatusBadge(eq.status)}
              </div>
              <p className="text-xs text-[#1E3831] leading-snug">
                {eq.reason}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#CBD8D4]">
        <SecondaryButton onClick={onClose}>
          Close Inspector
        </SecondaryButton>
      </div>
    </div>
  );
};
