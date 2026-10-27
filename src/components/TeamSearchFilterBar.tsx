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
  // Count teams in each category
  const movingCount = teams.filter((t) => t.speedKmh > 0 && t.status !== 'Ready').length;
  const stationaryCount = teams.filter((t) => t.speedKmh === 0 || t.status === 'Ready' || t.status === 'Holding').length;
  const lowBatteryCount = teams.filter(
    (t) => (t.batteryPct !== undefined && t.batteryPct <= 25) || (t.endurancePct !== undefined && t.endurancePct <= 25)
  ).length;
  const breachCount = teams.filter((t) => Boolean(t.isDrifted)).length;

  const isFiltered = searchQuery.trim().length > 0 || statusFilter !== 'ALL' || typeFilter !== 'ALL';

  return (
    <div className={`bg-white border border-[#E2E8E5] rounded-xl p-3 shadow-xs space-y-3 ${className}`}>
      {/* Search Input Row & Filter Summary */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        {/* Search Input Field */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5A706A]">
            <Search size={15} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search team by name, callsign, sector, or gear (e.g. 'Alpha', 'Bravo', 'UAV', 'FLIR')..."
            className="w-full pl-9 pr-9 py-2 bg-[#F4F6F5] border border-[#CBD8D4] focus:border-[#0B6758] focus:bg-white focus:outline-none rounded-lg text-xs font-medium text-[#1C2E2A] placeholder:text-[#8FA19C] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#5A706A] hover:text-[#1C2E2A] transition-colors"
              title="Clear search query"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Counters & Reset Actions */}
        <div className="flex items-center justify-between md:justify-end gap-2 shrink-0">
          <div className="text-xs text-[#5A706A] flex items-center gap-1.5">
            <span className="font-medium">Showing</span>
            <span className="font-mono font-bold text-[#0B6758] bg-[#E1ECE8] px-2 py-0.5 rounded">
              {filteredCount} / {totalCount}
            </span>
            <span className="hidden sm:inline text-[11px]">teams</span>
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs text-[#0B6758] font-bold hover:underline flex items-center gap-1 bg-[#F4F6F5] hover:bg-[#EAEFEA] px-2 py-1 rounded transition-colors"
              title="Reset all filters"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}

          {onToggleSimulateBatteryDrain && (
            <button
              type="button"
              onClick={onToggleSimulateBatteryDrain}
              className={`text-[11px] font-mono px-2 py-1 rounded border flex items-center gap-1 transition-all ${
                isSimulatingLowBattery
                  ? 'bg-[#FEF3DD] text-[#9A690B] border-[#F3D794] font-bold'
                  : 'bg-[#F4F6F5] text-[#5A706A] border-[#CBD8D4] hover:bg-[#EAEFEA]'
              }`}
              title="Simulate low battery warning on ground team for testing"
            >
              <Zap size={12} className={isSimulatingLowBattery ? 'text-[#9A690B]' : 'text-[#5A706A]'} />
              <span>{isSimulatingLowBattery ? 'Drain Active (Alpha 18%)' : 'Test Low Batt'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#E2E8E5]/70 text-xs">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A706A] mr-1 hidden sm:inline">
            Status:
          </span>

          {/* All Teams */}
          <button
            type="button"
            onClick={() => onStatusFilterChange('ALL')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              statusFilter === 'ALL'
                ? 'bg-[#0B6758] text-white shadow-xs font-bold'
                : 'bg-[#F4F6F5] text-[#5A706A] hover:bg-[#EAEFEA] hover:text-[#1C2E2A]'
            }`}
          >
            <span>All</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                statusFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-[#E2E8E5] text-[#1C2E2A]'
              }`}
            >
              {totalCount}
            </span>
          </button>

          {/* Moving */}
          <button
            type="button"
            onClick={() => onStatusFilterChange('MOVING')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              statusFilter === 'MOVING'
                ? 'bg-[#0B6758] text-white shadow-xs font-bold'
                : 'bg-[#F4F6F5] text-[#5A706A] hover:bg-[#EAEFEA] hover:text-[#1C2E2A]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shrink-0" />
            <Navigation size={13} className="shrink-0" />
            <span>Moving</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                statusFilter === 'MOVING' ? 'bg-white/20 text-white' : 'bg-[#E2E8E5] text-[#1C2E2A]'
              }`}
            >
              {movingCount}
            </span>
          </button>

          {/* Stationary */}
          <button
            type="button"
            onClick={() => onStatusFilterChange('STATIONARY')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              statusFilter === 'STATIONARY'
                ? 'bg-[#0B6758] text-white shadow-xs font-bold'
                : 'bg-[#F4F6F5] text-[#5A706A] hover:bg-[#EAEFEA] hover:text-[#1C2E2A]'
            }`}
          >
            <PauseCircle size={13} className="shrink-0 text-slate-500" />
            <span>Stationary</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                statusFilter === 'STATIONARY' ? 'bg-white/20 text-white' : 'bg-[#E2E8E5] text-[#1C2E2A]'
              }`}
            >
              {stationaryCount}
            </span>
          </button>

          {/* Low Battery */}
          <button
            type="button"
            onClick={() => onStatusFilterChange('LOW_BATTERY')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              statusFilter === 'LOW_BATTERY'
                ? 'bg-[#D97706] text-white shadow-xs font-bold'
                : lowBatteryCount > 0
                ? 'bg-[#FEF3DD] text-[#9A690B] border border-[#F3D794] hover:bg-[#FBE9BE]'
                : 'bg-[#F4F6F5] text-[#5A706A] hover:bg-[#EAEFEA]'
            }`}
          >
            <BatteryWarning size={13} className="shrink-0" />
            <span>Low Battery (&le;25%)</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                statusFilter === 'LOW_BATTERY'
                  ? 'bg-white/20 text-white'
                  : lowBatteryCount > 0
                  ? 'bg-[#F3D794] text-[#784F05] font-bold'
                  : 'bg-[#E2E8E5] text-[#1C2E2A]'
              }`}
            >
              {lowBatteryCount}
            </span>
          </button>

          {/* Boundary Breach (if any or selectable) */}
          <button
            type="button"
            onClick={() => onStatusFilterChange('BREACH')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              statusFilter === 'BREACH'
                ? 'bg-[#DC2626] text-white shadow-xs font-bold'
                : breachCount > 0
                ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse hover:bg-red-100'
                : 'bg-[#F4F6F5] text-[#5A706A] hover:bg-[#EAEFEA]'
            }`}
          >
            <ShieldAlert size={13} className="shrink-0" />
            <span>Breach</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                statusFilter === 'BREACH'
                  ? 'bg-white/20 text-white'
                  : breachCount > 0
                  ? 'bg-red-200 text-red-900 font-bold'
                  : 'bg-[#E2E8E5] text-[#1C2E2A]'
              }`}
            >
              {breachCount}
            </span>
          </button>
        </div>

        {/* Asset Classification Sub-Filter */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[10px] uppercase font-bold text-[#5A706A] mr-1 hidden sm:inline">
            Unit:
          </span>
          <button
            type="button"
            onClick={() => onTypeFilterChange('ALL')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              typeFilter === 'ALL'
                ? 'bg-[#1C2E2A] text-white font-bold'
                : 'bg-[#F4F6F5] text-[#5A706A] hover:bg-[#EAEFEA]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onTypeFilterChange('GROUND')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
              typeFilter === 'GROUND'
                ? 'bg-[#1C2E2A] text-white font-bold'
                : 'bg-[#F4F6F5] text-[#5A706A] hover:bg-[#EAEFEA]'
            }`}
          >
            <Users size={11} />
            <span>Ground</span>
          </button>
          <button
            type="button"
            onClick={() => onTypeFilterChange('AIR')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
              typeFilter === 'AIR'
                ? 'bg-[#1C2E2A] text-white font-bold'
                : 'bg-[#F4F6F5] text-[#5A706A] hover:bg-[#EAEFEA]'
            }`}
          >
            <Plane size={11} />
            <span>Air</span>
          </button>
          <button
            type="button"
            onClick={() => onTypeFilterChange('K9')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
              typeFilter === 'K9'
                ? 'bg-[#1C2E2A] text-white font-bold'
                : 'bg-[#F4F6F5] text-[#5A706A] hover:bg-[#EAEFEA]'
            }`}
          >
            <Dog size={11} />
            <span>K9</span>
          </button>
          <button
            type="button"
            onClick={() => onTypeFilterChange('TECH')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
              typeFilter === 'TECH'
                ? 'bg-[#1C2E2A] text-white font-bold'
                : 'bg-[#F4F6F5] text-[#5A706A] hover:bg-[#EAEFEA]'
            }`}
          >
            <Anchor size={11} />
            <span>Tech</span>
          </button>
        </div>
      </div>
    </div>
  );
};
