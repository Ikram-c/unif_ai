import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Users,
  Compass,
  Mountain,
  Wind,
  Footprints,
  Wrench,
  X,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { CellCausalityReport, SearchCell, TacticalTeam } from '../types';
import { PrimaryButton, SecondaryButton, StatusBadge } from './Common';

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
        return 'text-[#0B6758] bg-[#E1ECE8] border-[#0B6758]';
      case 'DEGRADED':
        return 'text-[#9A690B] bg-[#FEF3DD] border-[#F3D794]';
      case 'RESTRICTED':
        return 'text-[#D97706] bg-[#FEF3DD] border-[#D97706]';
      case 'BLOCKED':
        return 'text-[#DC2626] bg-[#FEE2E2] border-[#F87171]';
      default:
        return 'text-[#5A706A] bg-[#F4F6F5] border-[#E2E8E5]';
    }
  };

  const getEquipmentStatusBadge = (status: string) => {
    switch (status) {
      case 'OPTIMAL':
        return <span className="text-[10px] font-bold text-[#0B6758] bg-[#E1ECE8] px-1.5 py-0.5 rounded">Optimal</span>;
      case 'USABLE':
        return <span className="text-[10px] font-bold text-[#1C2E2A] bg-[#F4F6F5] border border-[#E2E8E5] px-1.5 py-0.5 rounded">Usable</span>;
      case 'DEGRADED':
        return <span className="text-[10px] font-bold text-[#9A690B] bg-[#FEF3DD] px-1.5 py-0.5 rounded">Degraded</span>;
      case 'PROHIBITED':
        return <span className="text-[10px] font-bold text-[#DC2626] bg-[#FEE2E2] px-1.5 py-0.5 rounded">Prohibited</span>;
      default:
        return null;
    }
  };

  return (
    <div
      className={`bg-white border border-[#0B6758] rounded-xl shadow-lg p-4 space-y-4 text-xs ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#E2E8E5] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0B6758] text-white flex items-center justify-center font-bold">
            <Mountain size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-[#1C2E2A]">
                Hexagon {report.cell_id}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getViabilityColor(
                  report.viability
                )}`}
              >
                {report.viability} ({report.overall_score}%)
              </span>
            </div>
            <p className="text-[11px] text-[#5A706A] font-mono">
              Centre: {cell.centre.lat.toFixed(4)}° N, {Math.abs(cell.centre.lon).toFixed(4)}° W · {cell.area_km2.toFixed(2)} km²
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-[#5A706A] hover:bg-[#F4F6F5] hover:text-[#1C2E2A] transition-colors"
          title="Close inspector"
        >
          <X size={16} />
        </button>
      </div>

      {/* Terrain Parameters Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5]">
          <span className="text-[#5A706A] block text-[10px]">Elevation</span>
          <span className="font-bold text-[#1C2E2A] font-mono text-sm">
            {report.terrain.elevation_m} m <span className="text-[10px] text-[#5A706A] font-normal">ASL</span>
          </span>
        </div>
        <div className="p-2 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5]">
          <span className="text-[#5A706A] block text-[10px]">Slope Angle</span>
          <span className="font-bold text-[#1C2E2A] font-mono text-sm">
            {report.terrain.slope_deg}° <span className="text-[10px] text-[#5A706A] font-normal">({report.terrain.slope_category})</span>
          </span>
        </div>
        <div className="p-2 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5]">
          <span className="text-[#5A706A] block text-[10px]">Substrate</span>
          <span className="font-bold text-[#1C2E2A] text-sm">
            {report.terrain.substrate}
          </span>
        </div>
        <div className="p-2 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5]">
          <span className="text-[#5A706A] block text-[10px]">Exposure</span>
          <span className={`font-bold text-sm ${report.terrain.exposure_level === 'EXTREME' ? 'text-[#DC2626]' : 'text-[#1C2E2A]'}`}>
            {report.terrain.exposure_level}
          </span>
        </div>
      </div>

      {/* Active Hazards Callout if any */}
      {report.terrain.hazard_tags.length > 0 && (
        <div className="bg-[#FEF3DD] border border-[#F3D794] rounded-lg p-2.5 text-[11px] text-[#9A690B] space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle size={13} />
            <span>Terrain & Environmental Hazards Detected:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {report.terrain.hazard_tags.map((tag) => (
              <span
                key={tag}
                className="bg-white/80 px-2 py-0.5 rounded text-[10px] font-medium border border-[#F3D794]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Primary Causality Recommendation */}
      <div className="p-3 bg-[#E1ECE8] border border-[#0B6758]/30 rounded-lg space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B6758] flex items-center gap-1">
          <TrendingUp size={12} />
          <span>Causality Model Operational Guidance</span>
        </span>
        <p className="text-xs font-semibold text-[#07483D]">
          {report.primary_recommendation}
        </p>
      </div>

      {/* Team Viability Breakdown */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Users size={14} className="text-[#0B6758]" />
            <span>Team Feasibility & Efficacy</span>
          </span>
          <span className="text-[10px] font-mono text-[#5A706A]">
            {report.team_assessments.filter((t) => t.viable).length} of {report.team_assessments.length} Viable
          </span>
        </span>

        <div className="space-y-1.5">
          {report.team_assessments.map((team) => (
            <div
              key={team.team_id}
              className="p-2 rounded-lg bg-[#F4F6F5] border border-[#E2E8E5] flex items-start justify-between gap-2"
            >
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#1C2E2A] text-xs">Team {team.callsign}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getViabilityColor(
                      team.status
                    )}`}
                  >
                    {team.status}
                  </span>
                  {team.viable && (
                    <span className="text-[10px] font-mono text-[#5A706A]">
                      {team.speed_kmh} km/h · {team.pod_pct}% POD
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#5A706A] leading-tight">
                  {team.reason}
                </p>
              </div>

              {onAssignTeam && team.viable && (
                <button
                  type="button"
                  onClick={() => onAssignTeam(team.callsign, report.cell_id)}
                  className="px-2 py-1 rounded bg-white hover:bg-[#E1ECE8] text-[#0B6758] border border-[#E2E8E5] font-bold text-[10px] shrink-0 transition-colors"
                >
                  Task Here
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Equipment Viability Breakdown */}
      <div className="space-y-2 border-t border-[#E2E8E5] pt-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A] flex items-center gap-1.5">
          <Wrench size={14} className="text-[#0B6758]" />
          <span>Equipment Suitability</span>
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {report.equipment_assessments.map((eq) => (
            <div
              key={eq.equipment}
              className="p-2 rounded-lg bg-[#F4F6F5] border border-[#E2E8E5] space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] text-[#1C2E2A] truncate">
                  {eq.equipment}
                </span>
                {getEquipmentStatusBadge(eq.status)}
              </div>
              <p className="text-[10px] text-[#5A706A] leading-tight">
                {eq.reason}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8E5]">
        <SecondaryButton onClick={onClose}>
          Close
        </SecondaryButton>
      </div>
    </div>
  );
};
