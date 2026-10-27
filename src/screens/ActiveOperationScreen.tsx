import React, { useState } from 'react';
import {
  Compass,
  Users,
  Radio,
  AlertTriangle,
  Clock,
  Camera,
  FileCheck,
  PlusCircle,
  ChevronRight,
  ShieldAlert,
  Layers,
  CheckCircle2,
  Search,
  X,
} from 'lucide-react';
import {
  Card,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  StepHeader,
} from '../components/Common';
import { OsmMap } from '../components/OsmMap';
import { MapOverlayControls } from '../components/MapOverlayControls';
import { QuickWeatherWidget } from '../components/QuickWeatherWidget';
import { TeamStatusSummaries } from '../components/TeamStatusSummaries';
import {
  TeamSearchFilterBar,
  TeamStatusFilter,
  TeamTypeFilter,
} from '../components/TeamSearchFilterBar';
import { CellCausalityInspector } from '../components/CellCausalityInspector';
import { ProximityAlertIndicator } from '../components/ProximityAlertIndicator';
import { MapTelematicsRibbon } from '../components/MapTelematicsRibbon';
import {
  CellCausalityReport,
  DetailedWeatherReport,
  GeoPosition,
  MapLayerToggles,
  Rescue,
  SearchCell,
  TacticalTeam,
  WeatherScenarioKey,
} from '../types';
import {
  DEFAULT_TACTICAL_TEAMS,
  evaluateCellViability,
  WEATHER_PRESETS,
} from '../core/CausalityModel';

interface ActiveOperationScreenProps {
  rescue: Rescue;
  onOpenEvidence: () => void;
  onOpenCloseout: () => void;
  onLogObservation: () => void;
}

export const ActiveOperationScreen: React.FC<ActiveOperationScreenProps> = ({
  rescue,
  onOpenEvidence,
  onOpenCloseout,
  onLogObservation,
}) => {
  // Atmospheric conditions & causality state
  const [weather, setWeather] = useState<DetailedWeatherReport>(WEATHER_PRESETS.BASELINE);
  const [tacticalTeams, setTacticalTeams] = useState<TacticalTeam[]>(DEFAULT_TACTICAL_TEAMS);
  const [mapCenter, setMapCenter] = useState<GeoPosition>(rescue.last_known_location);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Tactical team search and filter bar state
  const [teamSearchQuery, setTeamSearchQuery] = useState<string>('');
  const [teamStatusFilter, setTeamStatusFilter] = useState<TeamStatusFilter>('ALL');
  const [teamTypeFilter, setTeamTypeFilter] = useState<TeamTypeFilter>('ALL');
  const [isSimulatingLowBattery, setIsSimulatingLowBattery] = useState<boolean>(false);

  // Toggle low battery simulation for live testing of commander triage
  const handleToggleSimulateBatteryDrain = (teamId: string = 'team-alpha') => {
    setIsSimulatingLowBattery((prev) => {
      const next = !prev;
      setTacticalTeams((teams) =>
        teams.map((t) => {
          if (t.id === teamId || t.callsign === 'Alpha') {
            if (next) {
              return {
                ...t,
                batteryPct: 18,
                endurancePct: 18,
                currentTask: '⚠️ BATTERY CRITICAL: Handheld GPS & thermal sensor drained (18%) · Battery swap advised',
                telematics: {
                  ...t.telematics!,
                  batteryVoltage: 3.4,
                },
              };
            } else {
              return {
                ...t,
                batteryPct: undefined,
                endurancePct: 92,
                currentTask: 'Hasty path sweep towards Corn Du saddle',
                telematics: {
                  ...t.telematics!,
                  batteryVoltage: undefined,
                },
              };
            }
          }
          return t;
        })
      );

      if (next) {
        showToast('⚠️ BATTERY ALERT: Team Alpha power dropped to 18% (Critical battery warning triggered).');
      } else {
        showToast('Power restored: Team Alpha battery normalized to fresh charge.');
      }

      return next;
    });
  };

  // Filter teams for map highlighting & summary roster
  const filteredTacticalTeams = tacticalTeams.filter((team) => {
    if (teamSearchQuery.trim()) {
      const q = teamSearchQuery.toLowerCase().trim();
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

    if (teamStatusFilter === 'MOVING') {
      const isMoving = team.speedKmh > 0 && team.status !== 'Ready';
      if (!isMoving) return false;
    } else if (teamStatusFilter === 'STATIONARY') {
      const isStationary = team.speedKmh === 0 || team.status === 'Ready' || team.status === 'Holding';
      if (!isStationary) return false;
    } else if (teamStatusFilter === 'LOW_BATTERY') {
      const isLowBattery = (team.batteryPct !== undefined && team.batteryPct <= 25) || team.endurancePct <= 25;
      if (!isLowBattery) return false;
    } else if (teamStatusFilter === 'BREACH') {
      if (!team.isDrifted) return false;
    }

    if (teamTypeFilter !== 'ALL') {
      if (teamTypeFilter === 'GROUND' && team.type !== 'FOOT_HASTY' && team.type !== 'FOOT_GRID') return false;
      if (teamTypeFilter === 'AIR' && team.type !== 'AIR_UAV' && team.type !== 'HELO') return false;
      if (teamTypeFilter === 'K9' && team.type !== 'K9_UNIT') return false;
      if (teamTypeFilter === 'TECH' && team.type !== 'TECH_ROPE') return false;
    }

    return true;
  });

  // Map layer overlay toggles
  const [layerToggles, setLayerToggles] = useState<MapLayerToggles>({
    viabilityHeatmap: true,
    hexGrid: true,
    sectors: true,
    wanderContours: true,
    teamPositions: true,
    teamTracks: true,
    uavFlightPath: true,
    terrainHazards: true,
  });

  // Cell inspector state
  const [selectedCell, setSelectedCell] = useState<SearchCell | null>(null);
  const [selectedReport, setSelectedReport] = useState<CellCausalityReport | null>(null);

  // Notification toast for commander actions
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const candidate = rescue.evidence_candidates?.[0];
  const plan = rescue.plan;

  // Toggle map layers
  const handleToggleLayer = (key: keyof MapLayerToggles) => {
    setLayerToggles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Weather scenario switcher
  const handleSelectScenario = (key: WeatherScenarioKey) => {
    const newWeather = WEATHER_PRESETS[key];
    setWeather(newWeather);
    showToast(`Atmospheric conditions shifted to ${key.replace('_', ' ')}. Causality re-evaluated.`);

    // If a cell is currently inspected, recompute its report with new weather
    if (selectedCell) {
      const updatedReport = evaluateCellViability(selectedCell, newWeather, tacticalTeams);
      setSelectedReport(updatedReport);
    }
  };

  // Handle custom weather slider update
  const handleUpdateWeather = (updated: DetailedWeatherReport) => {
    setWeather(updated);
    if (selectedCell) {
      const updatedReport = evaluateCellViability(selectedCell, updated, tacticalTeams);
      setSelectedReport(updatedReport);
    }
  };

  // Handle hexagon cell selection on map
  const handleSelectHex = (cell: SearchCell, report: CellCausalityReport) => {
    setSelectedCell(cell);
    setSelectedReport(report);
  };

  // Locate team on map
  const handleLocateTeam = (team: TacticalTeam) => {
    setSelectedTeamId(team.id);
    setMapCenter(team.position);
    showToast(`Centered on Team ${team.callsign} (${team.sector})`);
  };

  // Task a team to a cell
  const handleAssignTeamToCell = (teamCallsign: string, cellId: string) => {
    setTacticalTeams((prev) =>
      prev.map((t) => {
        if (t.callsign === teamCallsign) {
          return {
            ...t,
            sector: `Hex ${cellId} Sector`,
            assignedHexId: cellId,
            currentTask: `Re-tasked to survey Hexagon ${cellId}`,
            lastCheckInUtc: '12:31 UTC (Just now)',
          };
        }
        return t;
      })
    );
    showToast(`Team ${teamCallsign} deployed to Hexagon ${cellId}. Tasking broadcast via radio.`);
  };

  // State for simulated boundary drift (MVP pitch demo)
  const [isSimulatingDrift, setIsSimulatingDrift] = useState<boolean>(false);

  // Toggle drift simulation for Team Bravo
  const handleSimulateDriftToggle = () => {
    setIsSimulatingDrift((prev) => {
      const next = !prev;
      setTacticalTeams((teams) =>
        teams.map((t) => {
          if (t.callsign === 'Bravo') {
            if (next) {
              return {
                ...t,
                isDrifted: true,
                position: { lat: 51.859, lon: -3.4735 }, // shifted SW out of Sector B into steep scarp
                telematics: {
                  ...t.telematics!,
                  driftDistanceM: 185,
                  osGridRef: 'SN 9832 1985',
                  altitudeM: 520,
                  headingDeg: 215,
                  headingCardinal: 'SW',
                  breachHazard: 'Craig Cwm Llwch scarp perimeter (>34° slope)',
                },
              };
            } else {
              return {
                ...t,
                isDrifted: false,
                position: { lat: 51.862, lon: -3.47 },
                telematics: {
                  ...t.telematics!,
                  driftDistanceM: 0,
                  osGridRef: 'SN 9841 2012',
                  altitudeM: 540,
                  headingDeg: 182,
                  headingCardinal: 'S',
                  breachHazard: undefined,
                },
              };
            }
          }
          return t;
        })
      );

      if (next) {
        showToast('⚠️ GEOFENCE BREACH: Team Bravo drifted +185m outside Sector B boundary!');
      } else {
        showToast('Geofence normalized: Team Bravo returned to Sector B boundaries.');
      }

      return next;
    });
  };

  // Re-vector drifted team via VHF radio
  const handleRevectorTeam = (teamCallsign: string) => {
    setIsSimulatingDrift(false);
    setTacticalTeams((teams) =>
      teams.map((t) => {
        if (t.callsign === teamCallsign) {
          return {
            ...t,
            isDrifted: false,
            position: { lat: 51.862, lon: -3.47 },
            currentTask: 'Re-vectored: Returning to designated Sector B grid line',
            lastCheckInUtc: '12:32 UTC (Just now)',
            telematics: {
              ...t.telematics!,
              driftDistanceM: 0,
              osGridRef: 'SN 9841 2012',
              altitudeM: 540,
              headingDeg: 0,
              headingCardinal: 'N',
              breachHazard: undefined,
            },
          };
        }
        return t;
      })
    );
    showToast(`Tactical Order VHF Ch 2: Team ${teamCallsign} halted. Re-vectoring back into Sector B.`);
  };

  // Authorize & expand sector boundary for team
  const handleExpandSector = (teamCallsign: string) => {
    setIsSimulatingDrift(false);
    setTacticalTeams((teams) =>
      teams.map((t) => {
        if (t.callsign === teamCallsign) {
          return {
            ...t,
            isDrifted: false,
            sector: 'Sector B Extended (Hex 0:-1 / Hex 0:-2)',
            assignedSectorBoundaryLabel: 'Sector B Extended',
            currentTask: 'Authorized expansion: Surveying expanded southern perimeter',
            telematics: {
              ...t.telematics!,
              driftDistanceM: 0,
              breachHazard: undefined,
            },
          };
        }
        return t;
      })
    );
    showToast(`Commander authorization logged: Sector boundary expanded for Team ${teamCallsign}. Audit trail updated.`);
  };

  // Trigger UAV FLIR detection for pitch demo
  const handleTriggerUavDetection = () => {
    showToast('SkyRanger UAV-01 FLIR Boson: Target flagged at 37.2°C (Candidate C-02). Transmitted to queue.');
    onOpenEvidence();
  };

  // Trigger weather flare for pitch demo
  const handleTriggerWeatherFlare = () => {
    handleSelectScenario('SUMMIT_GALE');
  };

  // Export 2 CFR 200 telemetry audit log
  const handleExportAuditLog = () => {
    const logData = {
      agency: rescue.agency,
      mission_reference: rescue.mission_reference,
      mission_name: rescue.mission_name,
      incident_commander: rescue.commander_reference,
      audit_standard: '2 C.F.R. § 200.334 / FEMA DRRA Compliance Log',
      exported_at_utc: new Date().toISOString(),
      weather_snapshot: weather,
      teams_telematics: tacticalTeams.map((t) => ({
        callsign: t.callsign,
        personnel: t.personnel,
        sector: t.sector,
        position: t.position,
        telematics: t.telematics,
        equipment: t.carriedEquipment,
        status: t.status,
      })),
      geofence_status: {
        total_sectors: 18,
        active_breaches: tacticalTeams.filter((t) => t.isDrifted).length,
        h3_resolution: 'Res 8 (0.7 km² aperture)',
      },
    };

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rescue.mission_reference}_Telematics_Audit_2CFR200.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('2 C.F.R. § 200 Telematics audit manifest downloaded.');
  };

  const driftedTeams = tacticalTeams.filter((t) => t.isDrifted);

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F5] overflow-y-auto">
      <StepHeader
        stepNumber="07 / 09"
        stepTitle="ACTIVE OPERATION"
        missionRef={rescue.mission_reference}
      />

      <div className="p-3 sm:p-5 max-w-7xl mx-auto w-full space-y-4">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm bg-[#E1ECE8] text-[#0B6758] px-2 py-0.5 rounded">
                {rescue.mission_reference}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-[#1C2E2A] tracking-tight">
                {rescue.mission_name} · Active Search Orchestration
              </h1>
            </div>
            <p className="text-xs text-[#5A706A] mt-0.5">
              Anchor: {rescue.location_label} ({rescue.last_known_location.lat.toFixed(4)}° N, {Math.abs(rescue.last_known_location.lon).toFixed(4)}° W)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <SecondaryButton onClick={onLogObservation} icon={<PlusCircle size={15} />}>
              Log observation
            </SecondaryButton>
            <PrimaryButton onClick={onOpenCloseout} icon={<FileCheck size={15} />}>
              Close mission & audit
            </PrimaryButton>
          </div>
        </div>

        {/* Commander Toast Alert */}
        {toastMessage && (
          <div className="bg-[#E1ECE8] border border-[#0B6758] text-[#07483D] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-[#0B6758] shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-[#0B6758] text-xs font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Evidence Alert Banner if candidate present */}
        {candidate && (
          <div className="bg-[#FEF3DD] border border-[#F3D794] rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FBE9BE] flex items-center justify-center text-[#9A690B] shrink-0 mt-0.5">
                <Camera size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#9A690B]">
                    1 Unverified Evidence Candidate ({candidate.id})
                  </span>
                  <StatusBadge
                    type="amber"
                    label={candidate.status === 'unverified' ? 'Awaiting verification' : 'Marked for ground check'}
                  />
                </div>
                <p className="text-xs text-[#9A690B] mt-0.5">
                  Platform: <strong>{candidate.platform_id}</strong> (Frame {candidate.frame_ref}) · {candidate.distance_from_lkp_km} km {candidate.bearing_from_lkp} of Storey Arms
                </p>
              </div>
            </div>
            <PrimaryButton
              onClick={onOpenEvidence}
              className="bg-[#9A690B] hover:bg-[#835807] text-white shrink-0 self-start sm:self-center"
              icon={<ChevronRight size={15} />}
            >
              Review local sources (08 / 09)
            </PrimaryButton>
          </div>
        )}

        {/* Proximity Alert Indicator (Flashes when a team drifts outside assigned hex sector) */}
        <ProximityAlertIndicator
          driftedTeams={driftedTeams}
          onRevectorTeam={handleRevectorTeam}
          onExpandSector={handleExpandSector}
          onSimulateDriftToggle={handleSimulateDriftToggle}
          isSimulatingDrift={isSimulatingDrift}
        />

        {/* Live Map Telematics Ribbon & MVP Pitch Demo Bar */}
        <MapTelematicsRibbon
          teams={tacticalTeams}
          selectedTeamId={selectedTeamId}
          onSelectTeam={(teamId) => {
            setSelectedTeamId(teamId);
            const tm = tacticalTeams.find((t) => t.id === teamId);
            if (tm) setMapCenter(tm.position);
          }}
          onSimulateDriftToggle={handleSimulateDriftToggle}
          isSimulatingDrift={isSimulatingDrift}
          onTriggerUavDetection={handleTriggerUavDetection}
          onTriggerWeatherFlare={handleTriggerWeatherFlare}
          onExportAuditLog={handleExportAuditLog}
        />

        {/* Quick Weather Report & Simulation Widget */}
        <QuickWeatherWidget
          weather={weather}
          onSelectScenario={handleSelectScenario}
          onUpdateWeather={handleUpdateWeather}
        />

        {/* Map Overlay Controls Strip */}
        <MapOverlayControls
          toggles={layerToggles}
          onToggle={handleToggleLayer}
          isCompact={false}
        />

        {/* Main Grid: Tactical Map & Causality Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Tactical Map (8 Cols or Full if no cell inspected) */}
          <div className={`${selectedCell && selectedReport ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-8'} flex flex-col min-h-[460px]`}>
            <Card className="flex-1 flex flex-col p-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 px-1 border-b border-[#E2E8E5] pb-2">
                <div className="flex items-center gap-2">
                  <Compass size={14} className="text-[#0B6758]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A]">
                    Tactical Map · Real-Time Causality Grid
                  </span>
                  {teamStatusFilter !== 'ALL' && (
                    <span className="text-[10px] bg-[#E1ECE8] text-[#0B6758] px-2 py-0.5 rounded font-mono font-bold">
                      {teamStatusFilter}
                    </span>
                  )}
                </div>

                {/* Quick Search & Status Pills above Map */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <div className="relative">
                    <input
                      type="text"
                      value={teamSearchQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTeamSearchQuery(val);
                        const match = tacticalTeams.find(
                          (t) =>
                            t.callsign.toLowerCase() === val.trim().toLowerCase() ||
                            t.name.toLowerCase() === val.trim().toLowerCase()
                        );
                        if (match) {
                          setSelectedTeamId(match.id);
                          setMapCenter(match.position);
                        }
                      }}
                      placeholder="Quick find team..."
                      className="w-36 sm:w-44 pl-6 pr-6 py-1 text-xs bg-[#F4F6F5] border border-[#CBD8D4] rounded-md focus:outline-none focus:border-[#0B6758] focus:bg-white text-[#1C2E2A]"
                    />
                    <Search size={12} className="absolute left-2 top-2 text-[#5A706A] pointer-events-none" />
                    {teamSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setTeamSearchQuery('')}
                        className="absolute right-2 top-1.5 text-[#5A706A] hover:text-[#1C2E2A]"
                        title="Clear search"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() =>
                        setTeamStatusFilter(teamStatusFilter === 'MOVING' ? 'ALL' : 'MOVING')
                      }
                      className={`px-2 py-0.5 rounded font-medium transition-colors ${
                        teamStatusFilter === 'MOVING'
                          ? 'bg-[#0B6758] text-white font-bold'
                          : 'bg-[#F4F6F5] text-[#5A706A] hover:bg-[#EAEFEA]'
                      }`}
                      title="Filter moving teams"
                    >
                      Moving ({tacticalTeams.filter((t) => t.speedKmh > 0 && t.status !== 'Ready').length})
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setTeamStatusFilter(teamStatusFilter === 'STATIONARY' ? 'ALL' : 'STATIONARY')
                      }
                      className={`px-2 py-0.5 rounded font-medium transition-colors ${
                        teamStatusFilter === 'STATIONARY'
                          ? 'bg-[#0B6758] text-white font-bold'
                          : 'bg-[#F4F6F5] text-[#5A706A] hover:bg-[#EAEFEA]'
                      }`}
                      title="Filter stationary teams"
                    >
                      Stationary ({tacticalTeams.filter((t) => t.speedKmh === 0 || t.status === 'Ready' || t.status === 'Holding').length})
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setTeamStatusFilter(teamStatusFilter === 'LOW_BATTERY' ? 'ALL' : 'LOW_BATTERY')
                      }
                      className={`px-2 py-0.5 rounded font-medium transition-colors ${
                        teamStatusFilter === 'LOW_BATTERY'
                          ? 'bg-[#D97706] text-white font-bold'
                          : 'bg-[#FEF3DD] text-[#9A690B] border border-[#F3D794] hover:bg-[#FBE9BE]'
                      }`}
                      title="Filter low battery teams"
                    >
                      Low Batt ({tacticalTeams.filter((t) => (t.batteryPct !== undefined && t.batteryPct <= 25) || t.endurancePct <= 25).length})
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-[420px]">
                <OsmMap
                  center={mapCenter}
                  zoom={12}
                  pin={rescue.last_known_location}
                  pinLabel={`${rescue.location_label} (LKP)`}
                  rings={plan?.rings}
                  regions={plan?.regions}
                  dataSources={plan?.data_sources}
                  tacticalTeams={tacticalTeams}
                  selectedTeamId={selectedTeamId}
                  onSelectTeam={(team) => {
                    setSelectedTeamId(team.id);
                    setMapCenter(team.position);
                    showToast(`Focused on Team ${team.callsign} (${team.sector})`);
                  }}
                  candidates={rescue.evidence_candidates || []}
                  showSectors={layerToggles.sectors}
                  layerToggles={layerToggles}
                  weather={weather}
                  selectedHexId={selectedCell?.cell_id}
                  onSelectHex={handleSelectHex}
                  showLegend={true}
                  className="h-full min-h-[420px]"
                />
              </div>
            </Card>
          </div>

          {/* Right Column: Cell Causality Inspector OR Incident Summary */}
          <div className={`${selectedCell && selectedReport ? 'lg:col-span-5 xl:col-span-4' : 'lg:col-span-4'} space-y-4`}>
            {selectedCell && selectedReport ? (
              <CellCausalityInspector
                cell={selectedCell}
                report={selectedReport}
                onClose={() => {
                  setSelectedCell(null);
                  setSelectedReport(null);
                }}
                onAssignTeam={handleAssignTeamToCell}
              />
            ) : (
              <Card className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8E5] pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A] flex items-center gap-1.5">
                    <Layers size={15} className="text-[#0B6758]" />
                    <span>Causality Terrain Model</span>
                  </span>
                  <StatusBadge type="green" label="Active Engine" />
                </div>

                <div className="space-y-2 text-xs text-[#5A706A]">
                  <p>
                    The <strong>Causality Model</strong> computes dynamic feasibility for each team and payload across the 18 hexagonal sectors of the search zone.
                  </p>
                  <p>
                    Environmental forces (gust speed, cloud ceiling, temperature, daylight) and terrain geometry (slope gradient, scree, vertical scarps) are continuously cross-referenced against equipment envelopes.
                  </p>
                  <div className="p-3 bg-[#F4F6F5] rounded-lg border border-[#E2E8E5] space-y-1.5 font-mono text-[11px] text-[#1C2E2A]">
                    <div className="flex justify-between">
                      <span className="text-[#5A706A]">Active Scenario:</span>
                      <strong className="text-[#0B6758]">{weather.scenario}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5A706A]">Airframe Gust Envelope:</span>
                      <span>16.5 m/s max</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5A706A]">K9 Scent Dispersion:</span>
                      <span>13.0 m/s threshold</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5A706A]">High-Angle Crag Threshold:</span>
                      <span>&gt;35° slope</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-[#E1ECE8] rounded-lg border border-[#0B6758]/20 text-xs text-[#07483D]">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <Compass size={13} className="text-[#0B6758]" />
                    <span>Interactive Map Tip</span>
                  </div>
                  Click directly on any colored hexagonal cell on the tactical map to open the full causality inspector and task assets directly.
                </div>
              </Card>
            )}

            {/* Incident Parameters Card */}
            <Card className="space-y-3 text-xs">
              <h2 className="font-bold uppercase tracking-wider text-[#1C2E2A] border-b border-[#E2E8E5] pb-2">
                Operational Anchor & Timeline
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#5A706A]">Subject Profile:</span>
                  <span className="font-medium text-[#1C2E2A]">{rescue.subject_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A706A]">Incident Commander:</span>
                  <span className="font-mono font-medium text-[#0B6758]">{rescue.commander_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A706A]">Active Search Window:</span>
                  <span className="font-mono text-[#1C2E2A]">3.0 hours elapsed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A706A]">Terrain Classification:</span>
                  <span className="text-[#1C2E2A]">{rescue.terrain_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A706A]">Radio Check Schedule:</span>
                  <span className="font-mono text-[#0B6758] font-bold">13:00 UTC (in 29m)</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Team Status Summaries Panel with Integrated Search & Filter Bar */}
        <TeamStatusSummaries
          teams={tacticalTeams}
          selectedTeamId={selectedTeamId}
          onSelectTeam={(team) => {
            setSelectedTeamId(team.id);
            setMapCenter(team.position);
            showToast(`Focused on Team ${team.callsign} (${team.sector})`);
          }}
          onLocateTeam={handleLocateTeam}
          onToggleBatteryDrain={handleToggleSimulateBatteryDrain}
          isSimulatingLowBattery={isSimulatingLowBattery}
          searchQuery={teamSearchQuery}
          onSearchChange={(q) => {
            setTeamSearchQuery(q);
            const match = tacticalTeams.find(
              (t) =>
                t.callsign.toLowerCase() === q.trim().toLowerCase() ||
                t.name.toLowerCase() === q.trim().toLowerCase()
            );
            if (match) {
              setSelectedTeamId(match.id);
              setMapCenter(match.position);
            }
          }}
          statusFilter={teamStatusFilter}
          onStatusFilterChange={setTeamStatusFilter}
          typeFilter={teamTypeFilter}
          onTypeFilterChange={setTeamTypeFilter}
        />
      </div>
    </div>
  );
};
