import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CloudDownload,
  Compass,
  Edit2,
  Play,
  Sliders,
} from 'lucide-react';
import {
  AreaPrecacheBanner,
  Card,
  PlanningEstimateNotice,
  PrimaryButton,
  SecondaryButton,
  StepHeader,
} from '../components/Common';
import { OsmMap } from '../components/OsmMap';
import { MapOverlayControls } from '../components/MapOverlayControls';
import { CellCausalityInspector } from '../components/CellCausalityInspector';
import { CellCausalityReport, MapLayerToggles, Rescue, SearchCell } from '../types';
import { WEATHER_PRESETS } from '../core/CausalityModel';
import { areaPrecacheService } from '../core/AreaPrecacheService';

interface SearchPlanScreenProps {
  rescue: Rescue;
  onRevise: () => void;
  onProceedToReview: () => void;
  onLaunchActiveOperation?: () => void;
}

type SearchPlanSubScreen = 'MAP_CONTOURS' | 'ASSUMPTIONS_CACHE';

export const SearchPlanScreen: React.FC<SearchPlanScreenProps> = ({
  rescue,
  onRevise,
  onProceedToReview,
  onLaunchActiveOperation,
}) => {
  const [activeSubScreen, setActiveSubScreen] = useState<SearchPlanSubScreen>('MAP_CONTOURS');

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

  // Warm up background pre-cache when Search Plan is inspected
  useEffect(() => {
    areaPrecacheService.triggerAreaPrecache(rescue, {
      triggeredFrom: 'Step 05 Search Plan Inspection',
    });
  }, [rescue]);

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

  const handleTransitionWithPrecache = (destination: 'REVIEW' | 'ACTIVE_OP') => {
    areaPrecacheService.triggerAreaPrecache(rescue, {
      triggeredFrom:
        destination === 'ACTIVE_OP'
          ? 'Search Plan → Active Operation Transition'
          : 'Search Plan → Resource Confirmation Transition',
      force: true,
    });
    if (destination === 'ACTIVE_OP' && onLaunchActiveOperation) {
      onLaunchActiveOperation();
    } else {
      onProceedToReview();
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F2F2F7] overflow-y-auto hig-scroll-view">
      <StepHeader
        stepNumber="05 / 09"
        stepTitle="ESTIMATED AREA · MULTI-VIEW"
        missionRef={rescue.mission_reference}
      />

      <div className="p-4 sm:p-6 pb-8 max-w-6xl mx-auto w-full space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1C1C1E] tracking-tight">
              Search Area Estimation &amp; Terrain Viability
            </h1>
            <p className="text-xs text-[#6C6C70] mt-0.5">
              Kinematic probability contours (50%, 75%, 95%) anchored at {rescue.location_label}{' '}
              with hexagonal causality overlay
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SecondaryButton onClick={onRevise} icon={<Edit2 size={15} />}>
              Revise inputs
            </SecondaryButton>
            {onLaunchActiveOperation && (
              <PrimaryButton
                onClick={() => handleTransitionWithPrecache('ACTIVE_OP')}
                icon={<Play size={15} />}
              >
                Launch Active Operation
              </PrimaryButton>
            )}
          </div>
        </div>

        {/* Apple HIG Segmented Control — 2 Views */}
        <div className="hig-segmented-control" role="tablist" aria-label="Search Plan Views">
          <button
            type="button"
            role="tab"
            aria-selected={activeSubScreen === 'MAP_CONTOURS'}
            onClick={() => setActiveSubScreen('MAP_CONTOURS')}
            className={`hig-segment-btn ${
              activeSubScreen === 'MAP_CONTOURS'
                ? 'hig-segment-btn-active'
                : 'hig-segment-btn-inactive'
            }`}
          >
            <Compass
              size={16}
              className={activeSubScreen === 'MAP_CONTOURS' ? 'text-[#007AFF]' : 'text-[#6C6C70]'}
            />
            <span>Interactive Contour &amp; Hex Map</span>
            <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#007AFF]/12 text-[#007AFF]">
              18 Sectors
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSubScreen === 'ASSUMPTIONS_CACHE'}
            onClick={() => setActiveSubScreen('ASSUMPTIONS_CACHE')}
            className={`hig-segment-btn ${
              activeSubScreen === 'ASSUMPTIONS_CACHE'
                ? 'hig-segment-btn-active'
                : 'hig-segment-btn-inactive'
            }`}
          >
            <Sliders
              size={16}
              className={
                activeSubScreen === 'ASSUMPTIONS_CACHE' ? 'text-[#007AFF]' : 'text-[#6C6C70]'
              }
            />
            <span>Model Assumptions &amp; Area Pre-Cache</span>
            <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#34C759]/15 text-[#248A3D]">
              Z11–Z14 Cache
            </span>
          </button>
        </div>

        {/* VIEW 01: INTERACTIVE MAP & CONTOUR ENVELOPES */}
        {activeSubScreen === 'MAP_CONTOURS' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <MapOverlayControls
              toggles={layerToggles}
              onToggle={handleToggleLayer}
              isCompact={true}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-8 flex flex-col min-h-[440px]">
                <Card className="flex-1 flex flex-col p-3">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A] flex items-center gap-1.5">
                      <Compass size={14} className="text-[#0B6758]" />
                      <span>Kinematic Wander Contours &amp; Hexagonal Sectors</span>
                    </span>
                    <span className="text-[11px] font-mono text-[#5A706A]">
                      Click hex to inspect terrain &amp; team feasibility
                    </span>
                  </div>
                  <div className="flex-1 min-h-[400px]">
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
                      className="h-full min-h-[400px]"
                    />
                  </div>
                </Card>
              </div>

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
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A] border-b border-[#E2E8E5] pb-2">
                      Probability Ring Envelopes
                    </h3>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F6F5] border-l-4 border-[#18796C] text-xs">
                        <div>
                          <div className="font-bold text-[#1C2E2A]">50% Probability Contour</div>
                          <div className="text-[11px] text-[#5A706A]">Radius: 3.0 km from LKP</div>
                        </div>
                        <span className="font-mono font-bold text-[#0B6758]">28.3 km²</span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F6F5] border-l-4 border-[#269584] text-xs">
                        <div>
                          <div className="font-bold text-[#1C2E2A]">75% Probability Contour</div>
                          <div className="text-[11px] text-[#5A706A]">Radius: 5.4 km from LKP</div>
                        </div>
                        <span className="font-mono font-bold text-[#0B6758]">91.6 km²</span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F6F5] border-l-4 border-[#57BCAE] text-xs">
                        <div>
                          <div className="font-bold text-[#1C2E2A]">95% Probability Contour</div>
                          <div className="text-[11px] text-[#5A706A]">Radius: 12.0 km from LKP</div>
                        </div>
                        <span className="font-mono font-bold text-[#0B6758]">452.4 km²</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E2E8E5]">
                      <SecondaryButton
                        onClick={() => setActiveSubScreen('ASSUMPTIONS_CACHE')}
                        className="w-full"
                        icon={<ArrowRight size={15} />}
                      >
                        Inspect Assumptions &amp; Offline Pre-Cache
                      </SecondaryButton>
                    </div>
                  </Card>
                )}

                <PrimaryButton
                  onClick={() => handleTransitionWithPrecache('REVIEW')}
                  className="w-full py-3"
                  icon={<ArrowRight size={16} />}
                >
                  Review assumptions &amp; resources (Step 06)
                </PrimaryButton>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 02: MODEL ASSUMPTIONS & BACKGROUND PRE-CACHE */}
        {activeSubScreen === 'ASSUMPTIONS_CACHE' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <PlanningEstimateNotice />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-5">
                <Card className="space-y-4 h-full">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#1C2E2A] border-b border-[#E2E8E5] pb-2">
                    Recorded Kinematic Priors &amp; Assumptions
                  </h2>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-start justify-between py-1 border-b border-[#E2E8E5]/60">
                      <span className="text-[#5A706A]">Anchor (LKP):</span>
                      <span className="font-semibold text-[#1C2E2A] text-right font-mono">
                        {rescue.last_known_location.lat.toFixed(4)}° N,{' '}
                        {Math.abs(rescue.last_known_location.lon).toFixed(4)}° W
                      </span>
                    </div>
                    <div className="flex items-start justify-between py-1 border-b border-[#E2E8E5]/60">
                      <span className="text-[#5A706A]">Mobility Mode:</span>
                      <span className="font-semibold text-[#1C2E2A]">
                        {rescue.travel_mode === 'ON_FOOT' ? 'On Foot' : rescue.travel_mode}
                      </span>
                    </div>
                    <div className="flex items-start justify-between py-1 border-b border-[#E2E8E5]/60">
                      <span className="text-[#5A706A]">Velocity Priors:</span>
                      <span className="font-semibold text-[#1C2E2A] font-mono">
                        d50 = 3 km, τ = 6.0h
                      </span>
                    </div>
                    <div className="flex items-start justify-between py-1 border-b border-[#E2E8E5]/60">
                      <span className="text-[#5A706A]">Elapsed Window:</span>
                      <span className="font-semibold text-[#0B6758] font-mono">
                        {plan?.window.elapsed_minutes
                          ? Math.round(plan.window.elapsed_minutes / 60)
                          : 3}
                        h (to 12:30 UTC)
                      </span>
                    </div>
                    <div className="flex items-start justify-between py-1">
                      <span className="text-[#5A706A]">Terrain Decay:</span>
                      <span className="font-semibold text-[#1C2E2A]">
                        {rescue.terrain_type || 'Moorland paths'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E2E8E5] text-xs text-[#485865] flex items-start gap-2">
                    <CloudDownload size={15} className="text-[#536878] shrink-0 mt-0.5" />
                    <span>
                      Proceeding to Active Operation automatically pre-caches Z11–Z14 map tiles and
                      localized sector weather envelopes in the background.
                    </span>
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <AreaPrecacheBanner rescue={rescue} />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <SecondaryButton
                    onClick={() => setActiveSubScreen('MAP_CONTOURS')}
                    icon={<ArrowLeft size={16} />}
                  >
                    Back to Contour Map
                  </SecondaryButton>
                  <PrimaryButton
                    onClick={() => handleTransitionWithPrecache('REVIEW')}
                    icon={<ArrowRight size={16} />}
                  >
                    Confirm Resources &amp; Deploy (Step 06)
                  </PrimaryButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
