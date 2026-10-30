import React, { useState } from 'react';
import {
  Anchor,
  Battery,
  BatteryWarning,
  Clock,
  Crosshair,
  Dog,
  MoreHorizontal,
  Navigation,
  PauseCircle,
  Plane,
  Radio,
  RotateCcw,
  Search,
  ShieldAlert,
  Terminal,
  Users,
  Zap,
} from 'lucide-react';
import { LivePositionEvent, TacticalTeam, TacticalTeamStatus } from '../types';
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
  onUpdateTeamStatus?: (teamId: string, status: TacticalTeamStatus) => void;
  onPingTeamRadio?: (teamId: string) => void;
  onVectorTeamOnMap?: (team: TacticalTeam) => void;
  liveEvents?: LivePositionEvent[];
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

const TEAM_STATUS_CHOICES: TacticalTeamStatus[] = [
  'In progress',
  'Ready',
  'Holding',
  'Returning',
  'SOS / Assist',
];

export interface TeamBatteryPillProps {
  percentage: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

/**
 * Dedicated battery status pill component for Active Operation team status cards.
 * Conditional color coding (WCAG >= 4.5:1 contrast):
 * - Green: > 50%
 * - Amber: 20% - 50% (inclusive)
 * - Red: < 20% (with critical pulse warning)
 */
export const TeamBatteryPill: React.FC<TeamBatteryPillProps> = ({
  percentage,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  const isRed = clamped < 20;
  const isAmber = clamped >= 20 && clamped <= 50;

  const colorClasses = isRed
    ? 'bg-[#FF3B30] text-white border-[#D70015] animate-pulse'
    : isAmber
    ? 'bg-[#FFF8E6] text-[#9A690B] border-[#FF9500]/60'
    : 'bg-[#E8F8EE] text-[#15803D] border-[#34C759]/60';

  const dotClasses = isRed
    ? 'bg-[#FACC15] animate-ping'
    : isAmber
    ? 'bg-[#FF9500]'
    : 'bg-[#34C759]';

  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-0.5 text-xs gap-1.5'
      : 'px-3 py-1 text-xs gap-1.5';

  const tierLabel = isRed ? 'CRITICAL' : isAmber ? 'CAUTION' : 'OPTIMAL';

  return (
    <span
      data-testid="team-battery-pill"
      data-battery-tier={isRed ? 'red' : isAmber ? 'amber' : 'green'}
      className={`inline-flex items-center rounded-full border font-mono font-bold tabular-nums tracking-tight shrink-0 ${colorClasses} ${sizeClasses} ${className}`}
      title={`Battery Level: ${clamped}% (${
        isRed ? '<20% Critical Red' : isAmber ? '20-50% Caution Amber' : '>50% Optimal Green'
      })`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${dotClasses}`} />
      {isRed ? (
        <BatteryWarning
          size={size === 'sm' ? 13 : 14}
          className="text-[#FACC15] shrink-0"
        />
      ) : (
        <Battery
          size={size === 'sm' ? 13 : 14}
          className={
            isAmber ? 'text-[#B45309] shrink-0' : 'text-[#15803D] shrink-0'
          }
        />
      )}
      <span>{clamped}%</span>
      {showLabel && (
        <span
          className={`text-[11px] uppercase font-bold tracking-wide ${
            isRed
              ? 'text-[#FEF08A]'
              : isAmber
              ? 'text-[#9A690B]'
              : 'text-[#15803D]'
          }`}
        >
          {tierLabel}
        </span>
      )}
    </span>
  );
};

export const TeamStatusSummaries: React.FC<TeamStatusSummariesProps> = ({
  teams,
  selectedTeamId,
  onSelectTeam,
  onLocateTeam,
  onUpdateTeamStatus,
  onPingTeamRadio,
  onVectorTeamOnMap,
  liveEvents = [],
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
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [localStatusFilter, setLocalStatusFilter] = useState<TeamStatusFilter>('ALL');
  const [localTypeFilter, setLocalTypeFilter] = useState<TeamTypeFilter>('ALL');
  const [openContextMenuTeamId, setOpenContextMenuTeamId] = useState<string | null>(null);

  const searchQuery =
    controlledSearchQuery !== undefined ? controlledSearchQuery : localSearchQuery;
  const setSearchQuery = controlledOnSearchChange || setLocalSearchQuery;

  const statusFilter =
    controlledStatusFilter !== undefined ? controlledStatusFilter : localStatusFilter;
  const setStatusFilter = controlledOnStatusFilterChange || setLocalStatusFilter;

  const typeFilter =
    controlledTypeFilter !== undefined ? controlledTypeFilter : localTypeFilter;
  const setTypeFilter = controlledOnTypeFilterChange || setLocalTypeFilter;

  const getTeamIcon = (type: TacticalTeam['type']) => {
    switch (type) {
      case 'AIR_UAV':
        return <Plane size={18} />;
      case 'K9_UNIT':
        return <Dog size={18} />;
      case 'TECH_ROPE':
        return <Anchor size={18} />;
      case 'HELO':
        return <Plane size={18} className="rotate-45" />;
      default:
        return <Users size={18} />;
    }
  };

  // Filter evaluation logic
  const filteredTeams = teams.filter((team) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = team.name.toLowerCase().includes(q);
      const matchCallsign = team.callsign.toLowerCase().includes(q);
      const matchSector = team.sector.toLowerCase().includes(q);
      const matchTask = team.currentTask.toLowerCase().includes(q);
      const matchEquipment = team.carriedEquipment.some((eq) =>
        eq.toLowerCase().includes(q)
      );
      const matchRadio = team.radioChannel.toLowerCase().includes(q);
      const matchGrid = team.telematics?.osGridRef?.toLowerCase().includes(q);

      if (
        !matchName &&
        !matchCallsign &&
        !matchSector &&
        !matchTask &&
        !matchEquipment &&
        !matchRadio &&
        !matchGrid
      ) {
        return false;
      }
    }

    if (statusFilter === 'MOVING') {
      const isMoving =
        team.speedKmh > 0 &&
        (team.status === 'In progress' || team.status === 'Returning');
      if (!isMoving) return false;
    } else if (statusFilter === 'STATIONARY') {
      const isStationary =
        team.speedKmh === 0 ||
        team.status === 'Ready' ||
        team.status === 'Holding';
      if (!isStationary) return false;
    } else if (statusFilter === 'LOW_BATTERY') {
      const isLowBattery =
        (team.batteryPct !== undefined && team.batteryPct <= 50) ||
        team.endurancePct <= 50;
      if (!isLowBattery) return false;
    } else if (statusFilter === 'BREACH') {
      if (!team.isDrifted && team.status !== 'SOS / Assist') return false;
    }

    if (typeFilter !== 'ALL') {
      if (
        typeFilter === 'GROUND' &&
        team.type !== 'FOOT_HASTY' &&
        team.type !== 'FOOT_GRID'
      )
        return false;
      if (typeFilter === 'AIR' && team.type !== 'AIR_UAV' && team.type !== 'HELO')
        return false;
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

  // Overall fleet status summary metrics
  const activeMovingCount = teams.filter(
    (t) => t.speedKmh > 0 && (t.status === 'In progress' || t.status === 'Returning')
  ).length;
  const standbyCount = teams.filter(
    (t) => t.status === 'Ready' || t.status === 'Holding'
  ).length;
  const criticalBatteryTeams = teams.filter(
    (t) => (t.batteryPct !== undefined ? t.batteryPct : t.endurancePct) < 20
  );
  const alertCount = teams.filter(
    (t) =>
      t.isDrifted ||
      t.status === 'SOS / Assist' ||
      (t.batteryPct !== undefined ? t.batteryPct : t.endurancePct) < 20
  ).length;
  const totalPersonnel = teams.reduce((sum, t) => sum + t.personnel, 0);

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Header, 6-Series Fleet Power Chart, and Integrated Search & Filter Controls */}
      <div className="tactical-card rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#CBD8D4] pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <Users size={18} className="text-[#0B6758]" />
              <h2 className="text-base font-bold text-[#081820]">
                Team Status &amp; Position Tracking Roster
              </h2>
            </div>
            <p className="text-xs text-[#1E3831] mt-0.5">
              Live OSGB36 / WGS84 coordinates, operational state controls, radio check-ins, and battery reserve telemetry
            </p>
          </div>

          {/* Tabular Fleet Telemetry Summary */}
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-mono tabular-nums text-[#081820]">
            <span>
              <strong className="text-[#0B6758]">{activeMovingCount}</strong> Moving
            </span>
            <span className="text-[#8BA39B]">·</span>
            <span>
              <strong>{standbyCount}</strong> Standby
            </span>
            <span className="text-[#8BA39B]">·</span>
            <span
              className={
                criticalBatteryTeams.length > 0
                  ? 'text-[#DC2626] font-bold animate-pulse flex items-center gap-1'
                  : ''
              }
            >
              {criticalBatteryTeams.length > 0 && <BatteryWarning size={14} />}
              <strong>{criticalBatteryTeams.length}</strong> Batt &lt;20%
            </span>
            <span className="text-[#8BA39B]">·</span>
            <span className={alertCount > 0 ? 'text-[#DC2626] font-bold' : ''}>
              <strong>{alertCount}</strong> Alerts
            </span>
            <span className="text-[#8BA39B]">·</span>
            <span>
              <strong>{totalPersonnel}</strong> Personnel
            </span>
          </div>
        </div>

        {/* Apple HIG Charting Data (Series <= 6, gap: 2px; display: flex) — Glanceable 6-Unit Power & Endurance Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#1E3831]">
            <span className="font-semibold">Fleet Power &amp; Endurance Overview (6 Units)</span>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" /> &gt;50% Optimal
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#D97706]" /> 20–50% Caution
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#DC2626]" /> &lt;20% Critical
              </span>
            </div>
          </div>
          <div className="flex gap-[2px] h-3 w-full rounded-lg overflow-hidden bg-[#DCE6E2] p-0.5">
            {teams.slice(0, 6).map((tm) => {
              const pct = tm.batteryPct !== undefined ? tm.batteryPct : tm.endurancePct;
              const barColor =
                pct < 20 ? 'bg-[#DC2626]' : pct <= 50 ? 'bg-[#D97706]' : 'bg-[#16A34A]';
              return (
                <div
                  key={`series-${tm.id}`}
                  className="flex-1 bg-white/60 relative overflow-hidden first:rounded-l-md last:rounded-r-md"
                  title={`${tm.callsign}: ${pct}%`}
                >
                  <div
                    className={`h-full ${barColor} transition-all duration-300`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Critical <20% Battery Visual Warning Banner */}
        {criticalBatteryTeams.length > 0 && (
          <div className="bg-[#FEF2F2] text-[#7F1D1D] border-2 border-[#DC2626] rounded-xl p-4 animate-battery-warning flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 hig-app-icon bg-[#DC2626] text-white flex items-center justify-center shrink-0 animate-pulse">
                <BatteryWarning size={22} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#DC2626] text-white">
                    Critical Power Warning (&lt;20%)
                  </span>
                  <span className="text-sm font-bold text-[#7F1D1D]">
                    {criticalBatteryTeams.length}{' '}
                    {criticalBatteryTeams.length === 1 ? 'Unit' : 'Units'} Below 20% Reserve Threshold
                  </span>
                </div>
                <p className="text-xs font-mono text-[#991B1B] mt-1">
                  {criticalBatteryTeams
                    .map((t) => {
                      const val =
                        t.batteryPct !== undefined ? t.batteryPct : t.endurancePct;
                      return `${t.callsign} (${t.name}: ${val}% · ${
                        t.telematics?.batteryVoltage || 19.6
                      }V)`;
                    })
                    .join(' · ')}{' '}
                  — Immediate RTB or battery swap advised.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {onUpdateTeamStatus &&
                criticalBatteryTeams.map((t) =>
                  t.status !== 'Returning' ? (
                    <button
                      key={`rtb-${t.id}`}
                      type="button"
                      onClick={() => onUpdateTeamStatus(t.id, 'Returning')}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Order {t.callsign} RTB
                    </button>
                  ) : null
                )}
              {onToggleBatteryDrain && (
                <button
                  type="button"
                  onClick={() => onToggleBatteryDrain(criticalBatteryTeams[0].id)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-[#EDF2EF] text-[#081820] font-bold text-xs border border-[#8BA39B] transition-colors cursor-pointer"
                >
                  Restore {criticalBatteryTeams[0].callsign} Power (88%)
                </button>
              )}
            </div>
          </div>
        )}

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
        <div className="tactical-card rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 hig-app-icon bg-[#EDF2EF] text-[#0B6758] flex items-center justify-center mx-auto border border-[#B8C9C3]">
            <Search size={22} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#081820]">No matching tactical teams</h3>
            <p className="text-sm text-[#1E3831] max-w-md mx-auto">
              No deployed units match query &ldquo;{searchQuery}&rdquo; with status filter{' '}
              <strong>{statusFilter}</strong> and unit filter <strong>{typeFilter}</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 bg-[#0B6758] text-white rounded-xl text-sm font-bold hover:bg-[#085446] transition-colors cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>Reset filters ({teams.length} teams)</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team) => {
            const isSelected = selectedTeamId === team.id;
            const isSos = team.status === 'SOS / Assist';
            const isMoving =
              team.speedKmh > 0 &&
              (team.status === 'In progress' || team.status === 'Returning');
            const currentBatteryVal =
              team.batteryPct !== undefined ? team.batteryPct : team.endurancePct;
            const isBatteryCritical = currentBatteryVal < 20;
            const isBatteryAmber =
              currentBatteryVal >= 20 && currentBatteryVal <= 50;
            const isContextOpen = openContextMenuTeamId === team.id;

            return (
              <div
                key={team.id}
                onClick={() => onSelectTeam && onSelectTeam(team)}
                className={`relative p-4 rounded-2xl transition-all cursor-pointer flex flex-col justify-between space-y-3.5 ${
                  isBatteryCritical
                    ? 'bg-[#FEF2F2] border-2 border-[#DC2626] animate-battery-warning'
                    : isSelected
                    ? 'bg-white border-2 border-[#0B6758] ring-2 ring-[#0B6758]/15'
                    : isSos || team.isDrifted
                    ? 'bg-[#FEF2F2] border-2 border-[#DC2626]'
                    : isBatteryAmber
                    ? 'bg-white border-[1.5px] border-[#D97706]'
                    : 'tactical-card hover:border-[#0B6758]'
                }`}
              >
                {/* Header: App Icon Squircle, Callsign, Dedicated Battery Pill & Context Menu Trigger */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 hig-app-icon flex items-center justify-center shrink-0 ${
                        isSos || team.isDrifted || isBatteryCritical
                          ? 'bg-[#DC2626] text-white animate-pulse'
                          : isSelected
                          ? 'bg-[#0B6758] text-white'
                          : 'bg-[#E1ECE8] text-[#064E3B]'
                      }`}
                    >
                      {isBatteryCritical ? (
                        <BatteryWarning size={20} />
                      ) : (
                        getTeamIcon(team.type)
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-base text-[#081820]">
                          {team.callsign}
                        </span>
                        <span className="text-xs font-mono text-[#1E3831] tabular-nums">
                          · {team.personnel} {team.personnel === 1 ? 'op' : 'pers'}
                        </span>
                        <TeamBatteryPill
                          percentage={currentBatteryVal}
                          size="sm"
                          showLabel={false}
                        />
                      </div>
                      <span className="text-xs text-[#1E3831] font-medium block truncate mt-0.5">
                        {team.name}
                      </span>
                    </div>
                  </div>

                  {/* Apple HIG Context Menu Button (Area >= 44x44pt, Offset >= 12pt, position: absolute; z-index: 50) */}
                  <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenContextMenuTeamId(isContextOpen ? null : team.id)
                      }
                      aria-expanded={isContextOpen}
                      aria-label={`More actions for Team ${team.callsign}`}
                      title="Open unit quick actions menu"
                      className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-[#CBD8D4] bg-white hover:bg-[#EDF2EF] text-[#081820] transition-colors cursor-pointer"
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    {isContextOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 top-full mt-3 z-50 w-56 rounded-2xl bg-white border border-[#8BA39B] shadow-xl p-1.5 space-y-1 text-xs"
                      >
                        <div className="px-3 py-1.5 text-[11px] font-bold text-[#1E3831] border-b border-[#CBD8D4]">
                          Unit {team.callsign} Shortcuts
                        </div>
                        {onLocateTeam && (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              onLocateTeam(team);
                              setOpenContextMenuTeamId(null);
                            }}
                            className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left font-semibold text-[#081820] hover:bg-[#EDF2EF] flex items-center gap-2 cursor-pointer"
                          >
                            <Crosshair size={15} className="text-[#0B6758]" />
                            <span>Center on Tactical Map</span>
                          </button>
                        )}
                        {onPingTeamRadio && (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              onPingTeamRadio(team.id);
                              setOpenContextMenuTeamId(null);
                            }}
                            className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left font-semibold text-[#081820] hover:bg-[#EDF2EF] flex items-center gap-2 cursor-pointer"
                          >
                            <Radio size={15} className="text-[#0B6758]" />
                            <span>Transmit VHF Radio Check</span>
                          </button>
                        )}
                        {onToggleBatteryDrain && (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              onToggleBatteryDrain(team.id);
                              setOpenContextMenuTeamId(null);
                            }}
                            className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left font-semibold text-[#991B1B] hover:bg-[#FEE2E2] flex items-center gap-2 cursor-pointer"
                          >
                            <Zap size={15} className="text-[#DC2626]" />
                            <span>
                              {isBatteryCritical
                                ? 'Restore Battery Reserve (88%)'
                                : 'Simulate <20% Battery Alert'}
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Critical Battery Warning Banner inside Card when < 20% */}
                {isBatteryCritical && (
                  <div
                    className="bg-[#DC2626] text-white px-3 py-2 rounded-xl flex items-center justify-between gap-2 animate-pulse"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2 font-mono text-xs font-bold">
                      <BatteryWarning size={15} className="text-[#FACC15] shrink-0" />
                      <span>
                        CRITICAL BATTERY: {currentBatteryVal}% (&lt;20% ·{' '}
                        {team.telematics?.batteryVoltage || 19.6}V)
                      </span>
                    </div>
                    {onUpdateTeamStatus && team.status !== 'Returning' && (
                      <button
                        type="button"
                        onClick={() => onUpdateTeamStatus(team.id, 'Returning')}
                        className="min-h-[36px] px-3 py-1 bg-[#FACC15] text-[#081820] rounded-lg font-mono font-bold text-xs hover:bg-white transition-colors cursor-pointer shrink-0"
                      >
                        Order RTB
                      </button>
                    )}
                  </div>
                )}

                {/* Clean Coordinate & Kinematic Readout */}
                <div className="bg-[#F6F9F7] text-[#081820] p-3 rounded-xl border border-[#CBD8D4] font-mono text-xs tabular-nums space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#064E3B] flex items-center gap-1.5">
                      {isMoving ? (
                        <Navigation size={14} className="text-[#0B6758]" />
                      ) : (
                        <PauseCircle size={14} className="text-[#1E3831]" />
                      )}
                      <span>{team.telematics?.osGridRef || 'SN 9864 2138'}</span>
                    </span>
                    <span className="text-[#081820] font-semibold">
                      {team.position.lat.toFixed(4)}°N, {Math.abs(team.position.lon).toFixed(4)}°W
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#1E3831] pt-1 border-t border-[#CBD8D4]">
                    <span>
                      {isMoving ? `${team.speedKmh.toFixed(1)} km/h` : '0.0 km/h'} · Hdg {team.telematics?.headingDeg ?? 0}° {team.telematics?.headingCardinal || 'N'}
                    </span>
                    <span>
                      Alt {team.telematics?.altitudeM || 640}m ASL
                    </span>
                  </div>
                </div>

                {/* Sector & Current Task Details */}
                <div className="space-y-1.5 text-xs px-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#1E3831] font-medium">Assigned Sector:</span>
                    <span className="font-bold text-[#081820] truncate">
                      {team.sector}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[#1E3831] font-medium shrink-0">Current Task:</span>
                    <span
                      className={`font-semibold text-right line-clamp-1 ${
                        isSos || team.isDrifted || isBatteryCritical
                          ? 'text-[#DC2626] font-bold'
                          : isBatteryAmber
                          ? 'text-[#B45309]'
                          : 'text-[#081820]'
                      }`}
                      title={team.currentTask}
                    >
                      {team.currentTask}
                    </span>
                  </div>
                </div>

                {/* Dedicated Battery Pill & Progress Bar */}
                <div
                  className={`space-y-2 p-3 rounded-xl border ${
                    isBatteryCritical
                      ? 'bg-red-100/80 border-[#DC2626]'
                      : isBatteryAmber
                      ? 'bg-[#FEF3DD]/60 border-[#D97706]'
                      : 'bg-[#F6F9F7] border-[#CBD8D4]'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between text-xs font-mono tabular-nums gap-2">
                    <span className="font-bold text-[#081820]">
                      {team.batteryPct !== undefined ? 'Battery Reserve' : 'Endurance Reserve'}
                    </span>
                    <TeamBatteryPill
                      percentage={currentBatteryVal}
                      size="sm"
                      showLabel={true}
                    />
                  </div>

                  {/* Clean Progress Bar with 20% and 50% Markers */}
                  <div className="relative w-full bg-[#DCE6E2] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 bottom-0 w-[1.5px] bg-[#DC2626]/70 z-10"
                      style={{ left: '20%' }}
                      title="20% Critical Red Battery Threshold"
                    />
                    <div
                      className="absolute top-0 bottom-0 w-[1.5px] bg-[#D97706]/70 z-10"
                      style={{ left: '50%' }}
                      title="50% Caution Amber Battery Threshold"
                    />
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isBatteryCritical
                          ? 'bg-[#DC2626] animate-battery-bar-pulse'
                          : isBatteryAmber
                          ? 'bg-[#D97706]'
                          : 'bg-[#16A34A]'
                      }`}
                      style={{ width: `${currentBatteryVal}%` }}
                    />
                  </div>
                </div>

                {/* Operational Status Select & Primary Touch Targets (>= 44pt height) */}
                <div
                  className="pt-2 border-t border-[#CBD8D4] space-y-2.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {onUpdateTeamStatus && (
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor={`status-select-${team.id}`}
                        className="text-xs font-bold text-[#1E3831] shrink-0"
                      >
                        Status:
                      </label>
                      <select
                        id={`status-select-${team.id}`}
                        value={team.status}
                        onChange={(e) =>
                          onUpdateTeamStatus(team.id, e.target.value as TacticalTeamStatus)
                        }
                        className="flex-1 min-h-[44px] px-3 py-1.5 rounded-xl border border-[#8BA39B] bg-white text-[#081820] font-semibold"
                      >
                        {TEAM_STATUS_CHOICES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    {onPingTeamRadio && (
                      <button
                        type="button"
                        onClick={() => onPingTeamRadio(team.id)}
                        className="min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-bold text-[#081820] bg-[#EDF2EF] hover:bg-[#DCE6E2] border border-[#B8C9C3] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title="Send immediate radio status ping"
                      >
                        <Radio size={14} className="text-[#0B6758]" />
                        <span>Ping</span>
                      </button>
                    )}
                    {onVectorTeamOnMap && (
                      <button
                        type="button"
                        onClick={() => onVectorTeamOnMap(team)}
                        className="min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-bold text-[#081820] bg-white hover:bg-[#FEF3DD] border border-[#8BA39B] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title="Click on tactical map to set waypoint for this team"
                      >
                        <Navigation size={14} className="text-[#D97706]" />
                        <span>Vector</span>
                      </button>
                    )}
                    {onLocateTeam && (
                      <button
                        type="button"
                        onClick={() => onLocateTeam(team)}
                        className="min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-bold text-white bg-[#0B6758] hover:bg-[#085446] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title="Center tactical map on team's live coordinates"
                      >
                        <Crosshair size={14} />
                        <span>Track</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#1E3831] font-mono tabular-nums pt-0.5">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-[#0B6758]" />
                      <span>Check-in: {team.lastCheckInUtc}</span>
                    </span>
                    <span>{team.radioChannel.split('(')[0]}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Live Position & Team Status Telemetry Stream Log (Apple HIG Lists & Tables: Row >= 44pt, no nested same-axis scroll trap) */}
      {liveEvents.length > 0 && (
        <div className="tactical-card rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#CBD8D4] pb-3">
            <div className="flex items-center gap-2">
              <Terminal size={17} className="text-[#0B6758]" />
              <span className="text-sm font-bold text-[#081820]">
                Live Position &amp; Status Telemetry Log
              </span>
            </div>
            <span className="text-xs font-mono font-semibold text-[#1E3831] tabular-nums">
              Showing latest {Math.min(6, liveEvents.length)} of {liveEvents.length} packets · 2 C.F.R. § 200 indexed
            </span>
          </div>

          <div className="divide-y divide-[#CBD8D4] font-mono text-xs tabular-nums">
            {liveEvents.slice(0, 6).map((ev) => (
              <div
                key={ev.id}
                className="hig-list-row py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
              >
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[#1E3831] font-semibold shrink-0">{ev.timestampUtc}</span>
                  <span className="text-[#064E3B] bg-[#E1ECE8] px-2 py-0.5 rounded font-bold shrink-0">
                    {ev.callsign}
                  </span>
                  <span className="text-[#081820] font-sans font-medium">{ev.summary}</span>
                </div>
                <span className="text-[#1E3831] text-xs shrink-0">{ev.coordinates}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
