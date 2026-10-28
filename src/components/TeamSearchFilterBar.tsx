import React from 'react';
import {
  Search,
  X,
  Navigation,
  PauseCircle,
  BatteryWarning,
  ShieldAlert,
  Users,
  Plane,
  Dog,
  Anchor,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { TacticalTeam } from '../types';

export type TeamStatusFilter = 'ALL' | 'MOVING' | 'STATIONARY' | 'LOW_BATTERY' | 'BREACH';
export type TeamTypeFilter = 'ALL' | 'GROUND' | 'AIR' | 'K9' | 'TECH';

interface TeamSearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: TeamStatusFilter;
  onStatusFilterChange: (filter: TeamStatusFilter) => void;
  typeFilter: TeamTypeFilter;
  onTypeFilterChange: (type: TeamTypeFilter) => void;
  teams: TacticalTeam[];
  filteredCount: number;
  totalCount: number;
  onResetFilters: () => void;
  onToggleSimulateBatteryDrain?: () => void;
  isSimulatingLowBattery?: boolean;
  className?: string;
}

export const TeamSearchFilterBar: React.FC<TeamSearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  teams,
  filteredCount,
  totalCount,
  onResetFilters,
  onToggleSimulateBatteryDrain,
  isSimulatingLowBattery = false,
  className = '',
}) => {
  const movingCount = teams.filter((t) => t.speedKmh > 0 && t.status !== 'Ready').length;
  const stationaryCount = teams.filter(
    (t) => t.speedKmh === 0 || t.status === 'Ready' || t.status === 'Holding'
  ).length;
  const lowBatteryCount = teams.filter(
    (t) =>
      (t.batteryPct !== undefined && t.batteryPct <= 50) ||
      (t.endurancePct !== undefined && t.endurancePct <= 50)
  ).length;
  const criticalBatteryCount = teams.filter(
    (t) => (t.batteryPct !== undefined ? t.batteryPct : t.endurancePct) < 20
  ).length;
  const breachCount = teams.filter((t) => Boolean(t.isDrifted)).length;

  const isFiltered =
    searchQuery.trim().length > 0 || statusFilter !== 'ALL' || typeFilter !== 'ALL';

  return (
    <div
      className={`bg-[#F6F9F7] border border-[#CBD8D4] rounded-xl p-3.5 sm:p-4 space-y-3.5 ${className}`}
    >
      {/* Search Input Row & Filter Summary (Apple HIG Text Fields: Height >= 44pt, font-size: 17px) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1E3831]">
            <Search size={18} />
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search team by name, callsign, sector, or gear (e.g. Alpha, Bravo, UAV)..."
            aria-label="Search tactical teams"
            className="w-full pl-10 pr-11 py-2.5 min-h-[44px] bg-white border border-[#8BA39B] focus:border-[#0B6758] rounded-xl text-[#081820] placeholder:text-[#4A665E] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#1E3831] hover:text-[#081820] transition-colors cursor-pointer"
              title="Clear search query"
              aria-label="Clear search query"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Counters & Reset Actions (Targets >= 44px) */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5 shrink-0">
          <div className="text-sm text-[#1E3831] flex items-center gap-1.5 px-2">
            <span className="font-medium">Showing</span>
            <span className="font-mono font-bold text-[#064E3B] bg-[#E1ECE8] px-2.5 py-0.5 rounded-md border border-[#A7C7BE] tabular-nums">
              {filteredCount} / {totalCount}
            </span>
            <span className="hidden sm:inline text-xs font-medium">units</span>
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="min-h-[44px] px-3.5 py-2 text-xs text-[#081820] font-bold flex items-center gap-1.5 bg-white hover:bg-[#E1ECE8] border border-[#8BA39B] rounded-xl transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw size={15} />
              <span>Reset Filters</span>
            </button>
          )}

          {onToggleSimulateBatteryDrain && (
            <button
              type="button"
              onClick={onToggleSimulateBatteryDrain}
              className={`min-h-[44px] px-3.5 py-2 text-xs font-mono font-bold rounded-full border flex items-center gap-1.5 transition-all cursor-pointer ${
                isSimulatingLowBattery || criticalBatteryCount > 0
                  ? 'bg-[#DC2626] text-white border-[#991B1B] animate-pulse'
                  : 'bg-white text-[#081820] border-[#8BA39B] hover:bg-[#FEF3DD]'
              }`}
              title="Simulate <20% critical battery pulse warning on Alpha"
            >
              <Zap
                size={15}
                className={
                  isSimulatingLowBattery || criticalBatteryCount > 0
                    ? 'text-[#FACC15]'
                    : 'text-[#D97706]'
                }
              />
              <span>
                {isSimulatingLowBattery
                  ? 'Critical Batt <20% Active (Alpha 18%)'
                  : 'Test <20% Battery Alert'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Selection Pills Bar (Apple HIG Selection: r >= 14pt / border-radius: 999px, min-h-[44px]) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pt-3 border-t border-[#CBD8D4]">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filter teams by status">
          <span className="text-xs font-bold text-[#1E3831] mr-1">
            Status:
          </span>

          <button
            type="button"
            onClick={() => onStatusFilterChange('ALL')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              statusFilter === 'ALL'
                ? 'bg-[#0B6758] text-white border-[#085446]'
                : 'bg-white text-[#081820] border-[#B8C9C3] hover:bg-[#E1ECE8]'
            }`}
          >
            <span>All Units</span>
            <span
              className={`text-xs px-1.5 py-0.2 rounded-full font-mono tabular-nums ${
                statusFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-[#EDF2EF] text-[#081820]'
              }`}
            >
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange('MOVING')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              statusFilter === 'MOVING'
                ? 'bg-[#0B6758] text-white border-[#085446]'
                : 'bg-white text-[#081820] border-[#B8C9C3] hover:bg-[#E1ECE8]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#16A34A] shrink-0" />
            <Navigation size={14} className="shrink-0" />
            <span>Moving</span>
            <span
              className={`text-xs px-1.5 py-0.2 rounded-full font-mono tabular-nums ${
                statusFilter === 'MOVING' ? 'bg-white/20 text-white' : 'bg-[#EDF2EF] text-[#081820]'
              }`}
            >
              {movingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange('STATIONARY')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              statusFilter === 'STATIONARY'
                ? 'bg-[#0B6758] text-white border-[#085446]'
                : 'bg-white text-[#081820] border-[#B8C9C3] hover:bg-[#E1ECE8]'
            }`}
          >
            <PauseCircle size={14} className="shrink-0" />
            <span>Stationary</span>
            <span
              className={`text-xs px-1.5 py-0.2 rounded-full font-mono tabular-nums ${
                statusFilter === 'STATIONARY' ? 'bg-white/20 text-white' : 'bg-[#EDF2EF] text-[#081820]'
              }`}
            >
              {stationaryCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange('LOW_BATTERY')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              statusFilter === 'LOW_BATTERY'
                ? 'bg-[#DC2626] text-white border-[#991B1B]'
                : criticalBatteryCount > 0
                ? 'bg-[#FEE2E2] text-[#991B1B] border-[#DC2626] animate-pulse'
                : lowBatteryCount > 0
                ? 'bg-[#FEF3DD] text-[#78350F] border-[#D97706] hover:bg-[#FDE68A]'
                : 'bg-white text-[#081820] border-[#B8C9C3] hover:bg-[#EDF2EF]'
            }`}
          >
            <BatteryWarning size={14} className="shrink-0" />
            <span>{criticalBatteryCount > 0 ? 'Critical Battery (<20%)' : 'Low Battery (≤50%)'}</span>
            <span
              className={`text-xs px-1.5 py-0.2 rounded-full font-mono tabular-nums ${
                statusFilter === 'LOW_BATTERY'
                  ? 'bg-white/20 text-white'
                  : criticalBatteryCount > 0
                  ? 'bg-[#DC2626] text-white'
                  : 'bg-white/80 text-[#081820]'
              }`}
            >
              {lowBatteryCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange('BREACH')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              statusFilter === 'BREACH'
                ? 'bg-[#DC2626] text-white border-[#991B1B]'
                : breachCount > 0
                ? 'bg-[#FEE2E2] text-[#991B1B] border-[#DC2626] animate-pulse'
                : 'bg-white text-[#081820] border-[#B8C9C3] hover:bg-[#EDF2EF]'
            }`}
          >
            <ShieldAlert size={14} className="shrink-0" />
            <span>Sector Breach</span>
            <span
              className={`text-xs px-1.5 py-0.2 rounded-full font-mono tabular-nums ${
                statusFilter === 'BREACH' ? 'bg-white/20 text-white' : 'bg-[#EDF2EF] text-[#081820]'
              }`}
            >
              {breachCount}
            </span>
          </button>
        </div>

        {/* Asset Type Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Filter teams by asset type">
          <span className="text-xs font-bold text-[#1E3831] mr-1">
            Type:
          </span>
          {(
            [
              { id: 'ALL', label: 'All', icon: null },
              { id: 'GROUND', label: 'Ground', icon: <Users size={13} /> },
              { id: 'AIR', label: 'Air / UAV', icon: <Plane size={13} /> },
              { id: 'K9', label: 'K9', icon: <Dog size={13} /> },
              { id: 'TECH', label: 'Rope Tech', icon: <Anchor size={13} /> },
            ] as const
          ).map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => onTypeFilterChange(u.id)}
              className={`min-h-[38px] px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                typeFilter === u.id
                  ? 'bg-[#081820] text-white border-[#081820]'
                  : 'bg-white text-[#081820] border-[#B8C9C3] hover:bg-[#E1ECE8]'
              }`}
            >
              {u.icon}
              <span>{u.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
