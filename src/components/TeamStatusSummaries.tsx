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
  Navigation,
  PauseCircle,
  BatteryWarning,
  ShieldAlert,
  Search,
  RotateCcw,
} from 'lucide-react';
import { CausalityViabilityLevel, TacticalTeam } from '../types';
import { StatusBadge } from './Common';
import {
  TeamSearchFilterBar,
  TeamStatusFilter,
  TeamTypeFilter,
} from './TeamSearchFilterBar';

interface TeamStatusSummariesProps {
  teams: TacticalTeam[];
  selectedTeamId?: string | null;
  onSelectTeam?: (team: TacticalTeam) => void;
  onLocateTeam?: (team: TacticalTeam) => void;
  onToggleBatteryDrain?: (teamId: string) => void;
  isSimulatingLowBattery?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  statusFilter?: TeamStatusFilter;
  onStatusFilterChange?: (filter: TeamStatusFilter) => void;
  typeFilter?: TeamTypeFilter;
  onTypeFilterChange?: (type: TeamTypeFilter) => void;
  className?: string;
}

export const TeamStatusSummaries: React.FC<TeamStatusSummariesProps> = ({
  teams,
  selectedTeamId,
  onSelectTeam,
  onLocateTeam,
  onToggleBatteryDrain,
  isSimulatingLowBattery = false,
  searchQuery: controlledSearchQuery,
  onSearchChange: controlledOnSearchChange,
  statusFilter: controlledStatusFilter,
  onStatusFilterChange: controlledOnStatusFilterChange,
  typeFilter: controlledTypeFilter,
  onTypeFilterChange: controlledOnTypeFilterChange,
  className = '',
}) => {
  // Uncontrolled state fallbacks if not provided by parent
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [localStatusFilter, setLocalStatusFilter] = useState<TeamStatusFilter>('ALL');
  const [localTypeFilter, setLocalTypeFilter] = useState<TeamTypeFilter>('ALL');

  const searchQuery = controlledSearchQuery !== undefined ? controlledSearchQuery : localSearchQuery;
  const setSearchQuery = controlledOnSearchChange || setLocalSearchQuery;

  const statusFilter = controlledStatusFilter !== undefined ? controlledStatusFilter : localStatusFilter;
  const setStatusFilter = controlledOnStatusFilterChange || setLocalStatusFilter;

  const typeFilter = controlledTypeFilter !== undefined ? controlledTypeFilter : localTypeFilter;
  const setTypeFilter = controlledOnTypeFilterChange || setLocalTypeFilter;

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

  const getViabilityBadge = (endurance: number, status: string, battery?: number, isDrifted?: boolean) => {
    if (isDrifted) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300 animate-pulse">
          <ShieldAlert size={10} />
          <span>Sector Breach</span>
        </span>
      );
    }
    if ((battery !== undefined && battery <= 25) || endurance <= 25) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
          <BatteryWarning size={10} />
          <span>Low Battery</span>
        </span>
      );
    }
    if (status === 'Ready') {
      return <StatusBadge type="green" label="Ready Standby" />;
    }
    if (endurance < 40) {
      return <StatusBadge type="amber" label="Fatigue Risk" />;
    }
    return <StatusBadge type="green" label="Active Ops" />;
  };

  // Filter evaluation logic
  const filteredTeams = teams.filter((team) => {
    // 1. Text Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = team.name.toLowerCase().includes(q);
      const matchCallsign = team.callsign.toLowerCase().includes(q);
      const matchSector = team.sector.toLowerCase().includes(q);
      const matchTask = team.currentTask.toLowerCase().includes(q);
      const matchEquipment = team.carriedEquipment.some((eq) => eq.toLowerCase().includes(q));
      const matchRadio = team.radioChannel.toLowerCase().includes(q);
      const matchGrid = team.telematics?.osGridRef?.toLowerCase().includes(q);

      if (!matchName && !matchCallsign && !matchSector && !matchTask && !matchEquipment && !matchRadio && !matchGrid) {
        return false;
      }
    }

    // 2. Status Filter
    if (statusFilter === 'MOVING') {
      const isMoving = team.speedKmh > 0 && team.status !== 'Ready';
      if (!isMoving) return false;
    } else if (statusFilter === 'STATIONARY') {
      const isStationary = team.speedKmh === 0 || team.status === 'Ready' || team.status === 'Holding';
      if (!isStationary) return false;
    } else if (statusFilter === 'LOW_BATTERY') {
      const isLowBattery = (team.batteryPct !== undefined && team.batteryPct <= 25) || team.endurancePct <= 25;
      if (!isLowBattery) return false;
    } else if (statusFilter === 'BREACH') {
      if (!team.isDrifted) return false;
    }

    // 3. Unit Type Filter
    if (typeFilter !== 'ALL') {
      if (typeFilter === 'GROUND' && team.type !== 'FOOT_HASTY' && team.type !== 'FOOT_GRID') return false;
      if (typeFilter === 'AIR' && team.type !== 'AIR_UAV' && team.type !== 'HELO') return false;
      if (typeFilter === 'K9' && team.type !== 'K9_UNIT') return false;
      if (typeFilter === 'TECH' && team.type !== 'TECH_ROPE') return false;
    }

    return true;
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setTypeFilter('ALL');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header and Integrated Search & Filter Controls */}
      <div className="bg-white border border-[#E2E8E5] rounded-xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8E5] pb-2.5">
          <div>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[#0B6758]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A]">
                Tactical Team Roster & Telematics Control
              </h2>
            </div>
            <p className="text-[11px] text-[#5A706A]">
              Search and filter mountain rescue assets by callsign, movement dynamics, battery state, or radio channel
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <TeamSearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          teams={teams}
          filteredCount={filteredTeams.length}
          totalCount={teams.length}
          onResetFilters={handleResetFilters}
          onToggleSimulateBatteryDrain={
            onToggleBatteryDrain ? () => onToggleBatteryDrain('team-alpha') : undefined
          }
          isSimulatingLowBattery={isSimulatingLowBattery}
        />
      </div>

      {/* Teams Grid / Empty State */}
      {filteredTeams.length === 0 ? (
        <div className="bg-white border border-[#E2E8E5] rounded-xl p-8 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#F4F6F5] text-[#5A706A] flex items-center justify-center mx-auto">
            <Search size={22} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#1C2E2A]">
              No tactical teams found
            </h3>
            <p className="text-xs text-[#5A706A] max-w-md mx-auto">
              No deployed teams match your current query "{searchQuery}" with status filter{' '}
              <strong>{statusFilter}</strong> and type <strong>{typeFilter}</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B6758] text-white rounded-lg text-xs font-bold hover:bg-[#07483D] transition-colors"
          >
            <RotateCcw size={13} />
            <span>Clear search & show all ({teams.length}) teams</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTeams.map((team) => {
            const isSelected = selectedTeamId === team.id;
            const isMoving = team.speedKmh > 0 && team.status !== 'Ready';
            const isLowBattery =
              (team.batteryPct !== undefined && team.batteryPct <= 25) || team.endurancePct <= 25;
            const currentBatteryVal = team.batteryPct !== undefined ? team.batteryPct : team.endurancePct;

            return (
              <div
                key={team.id}
                onClick={() => onSelectTeam && onSelectTeam(team)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                  isSelected
                    ? 'bg-[#E1ECE8]/60 border-[#0B6758] shadow-xs ring-1 ring-[#0B6758]'
                    : team.isDrifted
                    ? 'bg-red-50/50 border-red-300 hover:border-red-400'
                    : isLowBattery
                    ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                    : 'bg-white border-[#E2E8E5] hover:border-[#CBD8D4] hover:shadow-xs'
                }`}
              >
                {/* Header: Callsign, Movement Status, & Viability */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        team.isDrifted
                          ? 'bg-[#DC2626] text-white animate-pulse'
                          : team.type === 'AIR_UAV'
                          ? 'bg-[#16A34A] text-white'
                          : team.type === 'K9_UNIT'
                          ? 'bg-[#9A690B] text-white'
                          : team.type === 'HELO'
                          ? 'bg-[#0369A1] text-white'
                          : 'bg-[#0B6758] text-white'
                      }`}
                    >
                      {getTeamIcon(team.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-[#1C2E2A]">
                          Team {team.callsign}
                        </span>
                        <span className="text-[10px] font-mono text-[#5A706A]">
                          ({team.personnel} {team.personnel === 1 ? 'operator' : 'pers'})
                        </span>
                      </div>
                      <span className="text-[10px] text-[#5A706A] font-medium block">
                        {team.name}
                      </span>
                    </div>
                  </div>

                  {getViabilityBadge(team.endurancePct, team.status, team.batteryPct, team.isDrifted)}
                </div>

                {/* Tactical Status Pills: Movement dynamics & telemetry */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Movement Status Badge */}
                  {isMoving ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <Navigation size={10} />
                      <span>Moving · {team.speedKmh.toFixed(1)} km/h</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono font-medium">
                      <PauseCircle size={10} className="text-slate-500" />
                      <span>Stationary · Standby</span>
                    </span>
                  )}

                  {/* OS Grid Reference */}
                  {team.telematics?.osGridRef && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F4F6F5] text-[#1C2E2A] border border-[#CBD8D4] text-[10px] font-mono">
                      <span>{team.telematics.osGridRef}</span>
                    </span>
                  )}

                  {/* Heading & Altitude */}
                  {team.telematics && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F4F6F5] text-[#5A706A] text-[10px] font-mono">
                      <span>{team.telematics.headingCardinal} · {team.telematics.altitudeM}m</span>
                    </span>
                  )}
                </div>

                {/* Sector & Task Details */}
                <div className="space-y-1 text-xs bg-[#F4F6F5]/80 p-2 rounded-lg border border-[#E2E8E5]/70">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#5A706A]">Assigned Sector:</span>
                    <span className="font-bold text-[#1C2E2A] truncate max-w-[155px]">
                      {team.sector}
                    </span>
                  </div>
                  <div className="flex items-start justify-between text-[11px]">
                    <span className="text-[#5A706A]">Current Task:</span>
                    <span
                      className={`font-medium text-right truncate max-w-[170px] ${
                        team.isDrifted
                          ? 'text-red-700 font-bold'
                          : isLowBattery
                          ? 'text-amber-800'
                          : 'text-[#1C2E2A]'
                      }`}
                      title={team.currentTask}
                    >
                      {team.currentTask}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#5A706A] flex items-center gap-1">
                      <Radio size={11} className="text-[#0B6758]" />
                      <span>Radio Frequency:</span>
                    </span>
                    <span className="text-[#0B6758] font-bold">
                      {team.radioChannel.split('(')[0]}
                    </span>
                  </div>
                </div>

                {/* Battery / Endurance Indicator */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#5A706A] flex items-center gap-1">
                      {isLowBattery ? (
                        <BatteryWarning size={12} className="text-amber-600" />
                      ) : (
                        <Battery size={12} className="text-[#0B6758]" />
                      )}
                      <span>
                        {team.batteryPct !== undefined ? 'Battery Level' : 'Personnel Endurance'}
                      </span>
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        isLowBattery
                          ? 'text-[#DC2626]'
                          : currentBatteryVal > 60
                          ? 'text-[#0B6758]'
                          : 'text-[#D97706]'
                      }`}
                    >
                      {currentBatteryVal}%
                      {isLowBattery && ' (LOW)'}
                    </span>
                  </div>
                  <div className="w-full bg-[#E2E8E5] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        currentBatteryVal <= 25
                          ? 'bg-[#DC2626]'
                          : currentBatteryVal <= 50
                          ? 'bg-[#F5A623]'
                          : 'bg-[#0B6758]'
                      }`}
                      style={{ width: `${currentBatteryVal}%` }}
                    />
                  </div>
                </div>

                {/* Carried Equipment Tags */}
                <div className="flex flex-wrap gap-1">
                  {team.carriedEquipment.slice(0, 3).map((eq) => (
                    <span
                      key={eq}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-white text-[#5A706A] border border-[#CBD8D4] truncate max-w-[130px]"
                      title={eq}
                    >
                      {eq}
                    </span>
                  ))}
                  {team.carriedEquipment.length > 3 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white text-[#5A706A] border border-[#CBD8D4]">
                      +{team.carriedEquipment.length - 3} more
                    </span>
                  )}
                </div>

                {/* Footer Actions: Last Check-In & Center Map Button */}
                <div className="flex items-center justify-between text-[10px] text-[#5A706A] pt-1 border-t border-[#E2E8E5]">
                  <span className="font-mono flex items-center gap-1">
                    <Clock size={10} />
                    <span>{team.lastCheckInUtc.split('(')[0]}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {onLocateTeam && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLocateTeam(team);
                        }}
                        className="text-[#0B6758] font-bold hover:underline flex items-center gap-1 bg-[#E1ECE8] hover:bg-[#D0E2DC] px-2 py-0.5 rounded transition-colors"
                        title="Center and pan tactical map to this team's live coordinates"
                      >
                        <Crosshair size={11} />
                        <span>Center Map</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
