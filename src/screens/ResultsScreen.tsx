import React, { useState } from 'react';
import { ArrowLeft, RefreshCw, CheckCircle, RotateCcw } from 'lucide-react';
import {
  KeyValueRow,
  SectionCard,
  SrIcons,
  SrScaffold,
} from '../components/Common';
import { OsmMap } from '../components/OsmMap';
import { SrColors } from '../components/Theme';
import { TimeFormat } from '../core/TimeFormat';
import { rescueRepository } from '../data/RescueRepository';
import {
  DataSourceAvailability,
  DataSourceKind,
  EquipmentAssessment,
  EquipmentKind,
  Observation,
  RadiusRing,
  Rescue,
  SearchRegion,
  SectorSummary,
} from '../types';

interface ResultsScreenProps {
  rescue: Rescue;
  onBack: () => void;
  onUpdateRescue?: (rescue: Rescue) => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  rescue: initialRescue,
  onBack,
}) => {
  const [rescue, setRescue] = useState<Rescue>(initialRescue);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const plan = rescue.plan;

  const showToast = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRerun = async () => {
    setBusy(true);
    try {
      const updated = await rescueRepository.runModel(rescue, new Date());
      setRescue(updated);
      showToast('Model rerun completed with updated search window');
    } catch {
      showToast('Model rerun failed');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleStatus = async () => {
    setBusy(true);
    try {
      const updated =
        rescue.status === 'COMPLETED'
          ? await rescueRepository.reopen(rescue)
          : await rescueRepository.complete(rescue);
      setRescue(updated);
      showToast(
        updated.status === 'COMPLETED'
          ? 'Case marked as completed'
          : 'Case reopened as ongoing'
      );
    } catch {
      showToast('Failed to update case status');
    } finally {
      setBusy(false);
    }
  };

  const handleTriggerDetection = async (obsId: string) => {
    try {
      const updated = await rescueRepository.triggerDetection(rescue.id, obsId);
      setRescue(updated);
      showToast('Small-object detector job queued');
      // Periodically refresh state to catch the async simulation transitions
      setTimeout(() => {
        const r1 = rescueRepository.find(rescue.id);
        if (r1) setRescue({ ...r1 });
      }, 900);
      setTimeout(() => {
        const r2 = rescueRepository.find(rescue.id);
        if (r2) setRescue({ ...r2 });
      }, 2300);
    } catch {
      showToast('Detector trigger failed');
    }
  };

  const formatDistance = (m: number) => {
    return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
  };

  const confidenceColor = (conf: string) => {
    switch (conf) {
      case 'HIGH':
        return SrColors.Signal;
      case 'MEDIUM':
        return SrColors.Amber;
      default:
        return SrColors.Danger;
    }
  };

  const equipmentLabel = (kind: EquipmentKind): string => {
    switch (kind) {
      case 'UAV_VISUAL':
        return 'UAV, visual camera';
      case 'UAV_THERMAL':
        return 'UAV, thermal camera';
      case 'GROUND_TEAM':
        return 'Ground search teams';
      case 'VEHICLE_PATROL':
        return 'Vehicle patrol';
      case 'DOG_TEAM':
        return 'Search dog team';
      case 'HELICOPTER':
        return 'Helicopter tasking';
      default:
        return 'Search asset';
    }
  };

  if (!plan) {
    return (
      <SrScaffold>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-white text-lg font-bold mb-4">No Search Plan Found</p>
          <button
            type="button"
            onClick={handleRerun}
            disabled={busy}
            className="px-4 py-2 bg-[#6B5AA6] text-white rounded-lg font-semibold"
          >
            Run Model Now
          </button>
        </div>
      </SrScaffold>
    );
  }

  const title =
    rescue.location_label ||
    rescue.subject.name ||
    `Rescue #${rescue.id.slice(0, 8)}`;

  return (
    <SrScaffold
      topBar={
        <div className="w-full flex items-center gap-3 px-4 py-2.5 bg-[#5B5B5B] border-b border-white/10 shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="p-1 text-white hover:text-[#D9D9D9] transition-colors"
            title="Back"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-white text-base font-bold truncate leading-tight">
              {title}
            </h2>
            <p className="text-[#D9D9D9] text-xs capitalize">
              {rescue.status.toLowerCase()} · {rescue.travel_mode.toLowerCase().replace('_', ' ')}
            </p>
          </div>
        </div>
      }
    >
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Available Data Row */}
        <div className="px-3 pt-3 pb-2 shrink-0">
          <div className="w-full bg-[#383838] rounded-2xl p-3 shadow-md flex flex-col items-center">
            <div className="w-full flex items-center justify-around">
              {(['SATELLITE', 'DASHCAM', 'UAV'] as DataSourceKind[]).map((kind: DataSourceKind) => {
                const entry = plan.data_sources.find((s: DataSourceAvailability) => s.source === kind);
                const available = entry?.available ?? false;
                const count = entry?.observations.length ?? 0;

                return (
                  <div key={kind} className="flex flex-col items-center">
                    <div
                      className="w-18 h-18 rounded-full flex items-center justify-center transition-colors"
                      style={{
                        border: `4px solid ${available ? SrColors.Signal : SrColors.Slate}`,
                        padding: '4px',
                      }}
                    >
                      <div className="w-full h-full rounded-full bg-[#5B5B5B] flex items-center justify-center">
                        {kind === 'SATELLITE' && (
                          <SrIcons.Satellite className="w-10 h-10" color="#D9D9D9" />
                        )}
                        {kind === 'DASHCAM' && (
                          <SrIcons.Car className="w-10 h-10" color="#141414" />
                        )}
                        {kind === 'UAV' && (
                          <SrIcons.Drone className="w-10 h-10" color="#141414" />
                        )}
                      </div>
                    </div>
                    <span
                      className="text-[11px] font-semibold mt-1"
                      style={{ color: available ? SrColors.Signal : SrColors.Mist }}
                    >
                      {available ? `${count} in window` : 'none'}
                    </span>
                  </div>
                );
              })}
            </div>
            <span className="text-[11px] font-medium text-white bg-[#2B2B2B] rounded px-2.5 py-0.5 mt-2">
              Available Data
            </span>
          </div>
        </div>

        {/* Tactical Map Display */}
        <div className="px-3 py-1 shrink-0 h-72 sm:h-80 w-full">
          <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg border border-white/10">
            <OsmMap
              center={rescue.last_known_location}
              zoom={11}
              pin={rescue.last_known_location}
              pinLabel={rescue.location_label || 'Last known location'}
              rings={plan.rings}
              regions={plan.regions}
              dataSources={plan.data_sources}
              showLegend={true}
            />
          </div>
        </div>

        {/* Recommendation Cards & Details */}
        <div className="px-3 py-3 flex flex-col gap-3 max-w-xl mx-auto w-full">
          {/* 1. Search Window Card */}
          <SectionCard title="Search window">
            <KeyValueRow
              keyName="Last seen"
              value={TimeFormat.human(TimeFormat.parse(plan.window.last_seen_utc), rescue.time_zone)}
            />
            <KeyValueRow
              keyName="Model run"
              value={TimeFormat.human(TimeFormat.parse(plan.window.now_utc), rescue.time_zone)}
            />
            <KeyValueRow
              keyName="Elapsed (delta t)"
              value={TimeFormat.elapsed(plan.window.elapsed_minutes)}
              valueColor={SrColors.Lavender}
            />
            {plan.rings.map((ring: RadiusRing, idx: number) => (
              <KeyValueRow
                key={`ring-${idx}`}
                keyName={`${(ring.probability * 100).toFixed(0)} % within`}
                value={formatDistance(ring.radius_m)}
              />
            ))}
            <KeyValueRow
              keyName="Cells"
              value={`${plan.cell_source} (${plan.regions.length} priority)`}
            />
            <KeyValueRow
              keyName="Confidence"
              value={plan.confidence}
              valueColor={confidenceColor(plan.confidence)}
            />
          </SectionCard>

          {/* 2. Where to Look First Card */}
          <SectionCard title="Where to look first">
            <div className="flex flex-col gap-1 pb-1">
              {plan.sectors.slice(0, 4).map((sector: SectorSummary, idx: number) => (
                <KeyValueRow
                  key={`sector-${idx}`}
                  keyName={`${sector.sector} · ${sector.dominant_terrain.toLowerCase().replace('_', ' ')}`}
                  value={`${(sector.probability * 100).toFixed(0)} % · ${sector.area_km2.toFixed(1)} km²`}
                />
              ))}
            </div>

            <div className="border-t border-white/10 pt-2 mt-1">
              <span className="text-xs font-semibold text-[#D9D9D9] block mb-1">
                Priority Cells
              </span>
              <div className="flex flex-col gap-1">
                {plan.regions.slice(0, 6).map((region: SearchRegion) => (
                  <KeyValueRow
                    key={region.cell.cell_id}
                    keyName={`#${region.rank}  ${region.sector}  ${formatDistance(region.distance_m)}`}
                    value={`${(region.score * 100).toFixed(1)} % · ${region.cell.terrain.toLowerCase().replace('_', ' ')}`}
                    valueColor="#F2D06B"
                  />
                ))}
              </div>
            </div>
          </SectionCard>

          {/* 3. Equipment Viability Card */}
          <SectionCard title="Equipment viability">
            <KeyValueRow
              keyName={`Weather (${plan.weather.source})`}
              value={`${plan.weather.wind_ms.toFixed(0)} m/s, ${plan.weather.precipitation_mm_h.toFixed(1)} mm/h, vis ${(plan.weather.visibility_m / 1000).toFixed(1)} km, ${plan.weather.daylight ? 'daylight' : 'dark'}`}
            />
            <div className="flex flex-col gap-2 mt-1">
              {plan.equipment.map((item: EquipmentAssessment, idx: number) => (
                <div key={idx} className="flex items-start gap-2.5 py-1">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                    style={{
                      backgroundColor: item.viable ? SrColors.Signal : SrColors.Danger,
                    }}
                  />
                  <div className="flex flex-col leading-snug">
                    <span className="text-white font-semibold text-xs sm:text-sm">
                      {equipmentLabel(item.kind)}
                    </span>
                    <span className="text-[#D9D9D9] text-[11px] sm:text-xs">
                      {item.reason}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 4. Search Party Sizing Card */}
          <SectionCard title="Search party">
            <div className="flex items-center gap-4 py-1">
              <span className="text-4xl font-extrabold text-[#E6DEF5]">
                {plan.team.searchers}
              </span>
              <div className="flex flex-col">
                <span className="text-white text-sm font-semibold">
                  searchers in {plan.team.teams} team{plan.team.teams === 1 ? '' : 's'}
                </span>
                <span className="text-[#D9D9D9] text-xs">
                  {plan.team.search_area_km2.toFixed(1)} km² in {plan.team.target_hours.toFixed(0)} h · confidence {plan.team.confidence.toLowerCase()}
                </span>
              </div>
            </div>
            <p className="text-[#D9D9D9] text-xs mt-1 border-t border-white/10 pt-2 leading-relaxed">
              {plan.team.rationale}
            </p>
          </SectionCard>

          {/* 5. Remote Sensing Observations & Detector Trigger */}
          {plan.data_sources.map((source: DataSourceAvailability) => (
            <SectionCard
              key={source.source}
              title={`${source.source.charAt(0) + source.source.slice(1).toLowerCase()} scenes ${source.available ? `· ${source.observations.length}` : '· none in window'}`}
            >
              {source.observations.length === 0 ? (
                <p className="text-xs text-[#D9D9D9]/70 italic">
                  No indexed {source.source.toLowerCase()} metadata between last-seen and now.
                </p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {source.observations.slice(0, 6).map((obs: Observation) => (
                    <div
                      key={obs.id}
                      className="bg-[#2B2B2B] rounded-lg p-2.5 flex flex-col gap-1.5 border border-white/5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                obs.source === 'SATELLITE'
                                  ? SrColors.Satellite
                                  : obs.source === 'DASHCAM'
                                  ? SrColors.Dashcam
                                  : SrColors.Uav,
                            }}
                          />
                          <span className="text-white font-semibold text-xs sm:text-sm">
                            {obs.platform_id}
                          </span>
                        </div>
                        <span className="text-[#D9D9D9] text-[11px]">
                          {TimeFormat.parseOrNull(obs.observed_at_utc)
                            ? TimeFormat.human(new Date(obs.observed_at_utc), rescue.time_zone)
                            : obs.observed_at_utc}
                        </span>
                      </div>

                      <div className="text-[11px] text-[#D9D9D9]/80 flex flex-wrap gap-x-2">
                        {obs.distance_from_pin_m > 0 && (
                          <span>{formatDistance(obs.distance_from_pin_m)} from pin</span>
                        )}
                        {obs.cloud_cover_pct != null && (
                          <span>cloud {obs.cloud_cover_pct.toFixed(0)}%</span>
                        )}
                        {obs.frame_index != null && <span>frame {obs.frame_index}</span>}
                        {obs.note && <span>· {obs.note}</span>}
                      </div>

                      {obs.zarr_uri && (
                        <p className="text-[10px] font-mono text-[#E6DEF5]/70 truncate">
                          {obs.zarr_uri}
                        </p>
                      )}

                      {/* Small-object Detector Interactive Status */}
                      <div className="pt-1 flex items-center justify-between">
                        {obs.detection_status === 'NOT_RUN' && (
                          <button
                            type="button"
                            onClick={() => handleTriggerDetection(obs.id)}
                            disabled={busy}
                            className="bg-[#E6DEF5] text-[#141414] font-semibold text-xs px-2.5 py-1 rounded hover:bg-white active:scale-95 transition-all shadow"
                          >
                            Run small-object detector
                          </button>
                        )}
                        {obs.detection_status === 'QUEUED' && (
                          <span className="flex items-center gap-1.5 text-xs text-[#F5A623] font-semibold">
                            <span className="w-2 h-2 rounded-full bg-[#F5A623] animate-pulse" />
                            Queued on server
                          </span>
                        )}
                        {obs.detection_status === 'RUNNING' && (
                          <span className="flex items-center gap-1.5 text-xs text-[#8ED0FF] font-semibold">
                            <span className="w-2 h-2 rounded-full bg-[#8ED0FF] animate-spin" />
                            Detector running...
                          </span>
                        )}
                        {obs.detection_status === 'DONE' && (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#34C759]">
                            <span className="w-2 h-2 rounded-full bg-[#34C759]" />
                            {obs.candidate_count === 0
                              ? 'Done, no candidates'
                              : `Done, ${obs.candidate_count} candidate sighting${obs.candidate_count === 1 ? '' : 's'}`}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          ))}

          {/* Bottom Actions */}
          <div className="flex items-center justify-around gap-4 pt-2 pb-6">
            <button
              type="button"
              onClick={handleRerun}
              disabled={busy}
              className="flex-1 py-3 px-4 rounded-xl bg-[#383838] border border-[#D9D9D9] text-white text-sm font-semibold hover:bg-[#454545] active:scale-95 transition-all flex items-center justify-center gap-2 shadow"
            >
              <RefreshCw size={16} className={busy ? 'animate-spin' : ''} />
              <span>Re-run model</span>
            </button>

            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={busy}
              className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold active:scale-95 transition-all flex items-center justify-center gap-2 shadow ${
                rescue.status === 'COMPLETED'
                  ? 'bg-[#383838] border-[#F5A623] text-[#F5A623] hover:bg-[#454545]'
                  : 'bg-[#383838] border-[#34C759] text-[#34C759] hover:bg-[#454545]'
              }`}
            >
              {rescue.status === 'COMPLETED' ? (
                <>
                  <RotateCcw size={16} />
                  <span>Reopen case</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>Mark completed</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Toast Snackbar */}
        {message && (
          <div className="fixed bottom-18 left-1/2 -translate-x-1/2 z-[600] bg-[#2B2B2B] text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-xl shadow-2xl border border-white/20 animate-fade-in">
            {message}
          </div>
        )}
      </div>
    </SrScaffold>
  );
};
