import React, { useState } from 'react';
import { Compass, ArrowLeft, ArrowRight, Layers, MapPin, Clock, Edit2 } from 'lucide-react';
import { Card, PlanningEstimateNotice, PrimaryButton, SecondaryButton, StepHeader } from '../components/Common';
import { OsmMap } from '../components/OsmMap';
import { MapOverlayControls } from '../components/MapOverlayControls';
import { CellCausalityInspector } from '../components/CellCausalityInspector';
import { CellCausalityReport, MapLayerToggles, Rescue, SearchCell } from '../types';
import { WEATHER_PRESETS } from '../core/CausalityModel';

interface SearchPlanScreenProps {
  rescue: Rescue;
  onRevise: () => void;
  onProceedToReview: () => void;
}

export const SearchPlanScreen: React.FC<SearchPlanScreenProps> = ({
  rescue,
  onRevise,
  onProceedToReview,
}) => {
  const plan = rescue.plan;
  const rings = plan?.rings || [
    { probability: 0.5, radius_m: 3000 },
    { probability: 0.75, radius_m: 5400 },
    { probability: 0.95, radius_m: 12000 },
  ];

  const [layerToggles, setLayerToggles] = useState<MapLayerToggles>({
    viabilityHeatmap: true,
    hexGrid: true,
    sectors: false,
    wanderContours: true,
    teamPositions: false,
    teamTracks: false,
    uavFlightPath: true,
    terrainHazards: true,
  });

  const [selectedCell, setSelectedCell] = useState<SearchCell | null>(null);
  const [selectedReport, setSelectedReport] = useState<CellCausalityReport | null>(null);

  const handleToggleLayer = (key: keyof MapLayerToggles) => {
    setLayerToggles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectHex = (cell: SearchCell, report: CellCausalityReport) => {
    setSelectedCell(cell);
    setSelectedReport(report);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F4F6F5] overflow-y-auto">
      <StepHeader
        stepNumber="05 / 09"
        stepTitle="ESTIMATED AREA"
        missionRef={rescue.mission_reference}
      />

      <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1C2E2A] tracking-tight">
              Search area estimation & terrain viability
            </h1>
            <p className="text-xs text-[#5A706A] mt-0.5">
              Kinematic probability contours (50%, 75%, 95%) anchored at {rescue.location_label} with hexagonal causality overlay
            </p>
          </div>
          <SecondaryButton onClick={onRevise} icon={<Edit2 size={15} />}>
            Revise inputs
          </SecondaryButton>
        </div>

        {/* Mandatory Warning Notice */}
        <PlanningEstimateNotice />

        {/* Overlay Controls */}
        <MapOverlayControls
          toggles={layerToggles}
          onToggle={handleToggleLayer}
          isCompact={true}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Interactive Map with Contours */}
          <div className="lg:col-span-8 flex flex-col min-h-[420px]">
            <Card className="flex-1 flex flex-col p-3">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A] flex items-center gap-1.5">
                  <Compass size={14} className="text-[#0B6758]" />
                  <span>Kinematic Wander Contours & Hexagonal Sectors</span>
                </span>
                <span className="text-[11px] font-mono text-[#5A706A]">
                  Click hex to inspect terrain & team feasibility
                </span>
              </div>
              <div className="flex-1 min-h-[380px]">
                <OsmMap
                  center={rescue.last_known_location}
                  zoom={11}
                  pin={rescue.last_known_location}
                  pinLabel={`${rescue.location_label} (LKP)`}
                  rings={rings}
                  regions={plan?.regions}
                  dataSources={plan?.data_sources}
                  layerToggles={layerToggles}
                  weather={WEATHER_PRESETS.BASELINE}
                  selectedHexId={selectedCell?.cell_id}
                  onSelectHex={handleSelectHex}
                  showLegend={true}
                  className="h-full min-h-[380px]"
                />
              </div>
            </Card>
          </div>

          {/* Right Column: Model Assumptions & Inspector / Rings Breakdown */}
          <div className="lg:col-span-4 space-y-4">
            {selectedCell && selectedReport ? (
              <CellCausalityInspector
                cell={selectedCell}
                report={selectedReport}
                onClose={() => {
                  setSelectedCell(null);
                  setSelectedReport(null);
                }}
              />
            ) : (
              <Card className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A] border-b border-[#E2E8E5] pb-2">
                  Recorded Assumptions
                </h2>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <span className="text-[#5A706A]">Anchor (LKP):</span>
                    <span className="font-semibold text-[#1C2E2A] text-right font-mono">
                      {rescue.last_known_location.lat.toFixed(4)}° N, {Math.abs(rescue.last_known_location.lon).toFixed(4)}° W
                    </span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-[#5A706A]">Mobility Mode:</span>
                    <span className="font-semibold text-[#1C2E2A]">
                      {rescue.travel_mode === 'ON_FOOT' ? 'On Foot' : rescue.travel_mode}
                    </span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-[#5A706A]">Velocity Priors:</span>
                    <span className="font-semibold text-[#1C2E2A] font-mono">d50 = 3 km, τ = 6.0h</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-[#5A706A]">Elapsed Window:</span>
                    <span className="font-semibold text-[#0B6758] font-mono">
                      {plan?.window.elapsed_minutes ? Math.round(plan.window.elapsed_minutes / 60) : 3}h (to 12:30 UTC)
                    </span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-[#5A706A]">Terrain Decay:</span>
                    <span className="font-semibold text-[#1C2E2A]">{rescue.terrain_type || 'Moorland paths'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E2E8E5]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A] mb-2.5">
                    Contour Envelopes
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded bg-[#F4F6F5] border-l-4 border-[#18796C] text-xs">
                      <div>
                        <div className="font-bold text-[#1C2E2A]">50% Probability</div>
                        <div className="text-[11px] text-[#5A706A]">Radius: 3.0 km</div>
                      </div>
                      <span className="font-mono font-semibold text-[#0B6758]">28.3 km²</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-[#F4F6F5] border-l-4 border-[#269584] text-xs">
                      <div>
                        <div className="font-bold text-[#1C2E2A]">75% Probability</div>
                        <div className="text-[11px] text-[#5A706A]">Radius: 5.4 km</div>
                      </div>
                      <span className="font-mono font-semibold text-[#0B6758]">91.6 km²</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-[#F4F6F5] border-l-4 border-[#57BCAE] text-xs">
                      <div>
                        <div className="font-bold text-[#1C2E2A]">95% Probability</div>
                        <div className="text-[11px] text-[#5A706A]">Radius: 12.0 km</div>
                      </div>
                      <span className="font-mono font-semibold text-[#0B6758]">452.4 km²</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <div className="pt-1">
              <PrimaryButton
                onClick={onProceedToReview}
                className="w-full py-3"
                icon={<ArrowRight size={16} />}
              >
                Review assumptions & resources
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
