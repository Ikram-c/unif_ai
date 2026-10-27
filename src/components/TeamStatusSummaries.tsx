import React, { useState } from 'react';
import {
  Users,
  Radio,
  Clock,
  Battery,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  Crosshair,
  Footprints,
  Plane,
  Dog,
  Anchor,
  Activity,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { CausalityViabilityLevel, TacticalTeam } from '../types';
import { StatusBadge } from './Common';

interface TeamStatusSummariesProps {
  teams: TacticalTeam[];
  selectedTeamId?: string | null;
  onSelectTeam?: (team: TacticalTeam) => void;
  onLocateTeam?: (team: TacticalTeam) => void;
  className?: string;
}

export const TeamStatusSummaries: React.FC<TeamStatusSummariesProps> = ({
  teams,
  selectedTeamId,
  onSelectTeam,
  onLocateTeam,
  className = '',
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  const getTeamIcon = (type: TacticalTeam['type']) => {
    switch (type) {
      case 'AIR_UAV':
        return <Plane size={15} />;
      case 'K9_UNIT':
        return <Dog size={15} />;
      case 'TECH_ROPE':
        return <Anchor size={15} />;
      case 'HELO':
        return <Plane size={15} className="rotate-45" />;
      default:
        return <Users size={15} />;
    }
  };

  const getViabilityBadge = (endurance: number, status: string) => {
    if (status === 'Ready') {
      return <StatusBadge type="green" label="Ready Standby" />;
    }
    if (endurance < 40) {
      return <StatusBadge type="amber" label="Fatigue Risk" />;
    }
    return <StatusBadge type="green" label="Active Ops" />;
  };

  const filteredTeams =
    filterType === 'ALL' ? teams : teams.filter((t) => t.type === filterType);

  return (
    <div
      className={`bg-white border border-[#E2E8E5] rounded-xl p-3 sm:p-4 shadow-xs space-y-3.5 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8E5] pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[#0B6758]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A]">
              Tactical Team Status & Asset Telemetry
            </h2>
          </div>
          <p className="text-[11px] text-[#5A706A]">
            Real-time readiness, assigned terrain sectors, radio channels, and gear status
          </p>
        </div>

        {/* Quick Filter */}
        <div className="flex items-center gap-1 text-[11px]">
          {['ALL', 'FOOT_HASTY', 'AIR_UAV', 'K9_UNIT', 'TECH_ROPE'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                filterType === type
                  ? 'bg-[#0B6758] text-white font-bold'
                  : 'bg-[#F4F6F5] text-[#5A706A] hover:bg-[#EAEFEA]'
              }`}
            >
              {type === 'ALL'
                ? 'All (6)'
                : type === 'FOOT_HASTY'
                ? 'Ground'
                : type === 'AIR_UAV'
                ? 'UAV'
                : type === 'K9_UNIT'
                ? 'K9'
                : 'Tech'}
            </button>
          ))}
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredTeams.map((team) => {
          const isSelected = selectedTeamId === team.id;
          return (
            <div
              key={team.id}
              onClick={() => onSelectTeam && onSelectTeam(team)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                isSelected
                  ? 'bg-[#E1ECE8]/60 border-[#0B6758] shadow-xs'
                  : 'bg-[#F4F6F5] border-[#E2E8E5] hover:bg-white hover:border-[#CBD8D4]'
              }`}
            >
              {/* Header: Callsign & Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#0B6758] text-white flex items-center justify-center shrink-0">
                    {getTeamIcon(team.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-[#1C2E2A]">
                        Team {team.callsign}
                      </span>
                      <span className="text-[10px] font-mono text-[#5A706A]">
                        ({team.personnel} {team.personnel === 1 ? 'op' : 'pers'})
                      </span>
                    </div>
                    <span className="text-[10px] text-[#5A706A] font-medium block">
                      {team.name}
                    </span>
                  </div>
                </div>

                {getViabilityBadge(team.endurancePct, team.status)}
              </div>

              {/* Sector & Task Details */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#5A706A]">Sector:</span>
                  <span className="font-bold text-[#1C2E2A] truncate max-w-[150px]">
                    {team.sector}
                  </span>
                </div>
                <div className="flex items-start justify-between text-[11px]">
                  <span className="text-[#5A706A]">Task:</span>
                  <span className="font-medium text-[#1C2E2A] text-right truncate max-w-[160px]">
                    {team.currentTask}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#5A706A] flex items-center gap-1">
                    <Radio size={11} className="text-[#0B6758]" />
                    <span>Radio:</span>
                  </span>
                  <span className="text-[#0B6758] font-bold">{team.radioChannel.split(' ')[0]} {team.radioChannel.split(' ')[1]}</span>
                </div>
              </div>

              {/* Endurance & Speed Bar */}
              <div className="space-y-1 pt-1 border-t border-[#E2E8E5]">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#5A706A] flex items-center gap-1">
                    <Activity size={11} className="text-[#0B6758]" />
                    <span>{team.batteryPct !== undefined ? 'Battery / Reserve' : 'Endurance'}</span>
                  </span>
                  <span className="font-mono font-bold text-[#1C2E2A]">
                    {team.batteryPct !== undefined ? `${team.batteryPct}%` : `${team.endurancePct}%`}
                  </span>
                </div>
                <div className="w-full bg-[#E2E8E5] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      (team.batteryPct || team.endurancePct) > 60
                        ? 'bg-[#0B6758]'
                        : (team.batteryPct || team.endurancePct) > 30
                        ? 'bg-[#F5A623]'
                        : 'bg-[#DC2626]'
                    }`}
                    style={{ width: `${team.batteryPct || team.endurancePct}%` }}
                  />
                </div>
              </div>

              {/* Equipment Tags */}
              <div className="flex flex-wrap gap-1">
                {team.carriedEquipment.slice(0, 2).map((eq) => (
                  <span
                    key={eq}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-white text-[#5A706A] border border-[#E2E8E5] truncate max-w-[130px]"
                  >
                    {eq}
                  </span>
                ))}
                {team.carriedEquipment.length > 2 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white text-[#5A706A] border border-[#E2E8E5]">
                    +{team.carriedEquipment.length - 2} more
                  </span>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between text-[10px] text-[#5A706A] pt-1">
                <span className="font-mono flex items-center gap-1">
                  <Clock size={10} />
                  <span>{team.lastCheckInUtc.split('(')[0]}</span>
                </span>
                {onLocateTeam && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLocateTeam(team);
                    }}
                    className="text-[#0B6758] font-bold hover:underline flex items-center gap-0.5"
                  >
                    <Crosshair size={10} />
                    <span>Center map</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
