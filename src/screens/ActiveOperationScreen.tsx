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
import { CellCausalityInspector } from '../components/CellCausalityInspector';
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
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A] flex items-center gap-1.5">
                  <Compass size={14} className="text-[#0B6758]" />
                  <span>Tactical Operation Map · Real-Time Causality Grid</span>
                </span>
                <span className="text-[11px] font-mono text-[#5A706A]">
                  Click any hexagon to inspect team & equipment viability
                </span>
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

        {/* Team Status Summaries Panel */}
        <TeamStatusSummaries
          teams={tacticalTeams}
          selectedTeamId={selectedTeamId}
          onLocateTeam={handleLocateTeam}
        />
      </div>
    </div>
  );
};
