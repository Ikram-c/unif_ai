import React, { useEffect, useState } from 'react';
import {
  BatteryWarning,
  Camera,
  CheckCircle2,
  ChevronRight,
  Compass,
  Crosshair,
  FileCheck,
  Layers,
  PlusCircle,
  Search,
  X,
} from 'lucide-react';
import {
  ActivityRing,
  PrimaryButton,
  SecondaryButton,
  StepHeader,
} from '../components/Common';
import { OsmMap } from '../components/OsmMap';
import { MapOverlayControls } from '../components/MapOverlayControls';
import { QuickWeatherWidget } from '../components/QuickWeatherWidget';
import {
  TeamBatteryPill,
  TeamStatusSummaries,
} from '../components/TeamStatusSummaries';
import {
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
  LivePositionEvent,
  MapLayerToggles,
  Rescue,
  SearchCell,
  TacticalTeam,
  TacticalTeamStatus,
  WeatherScenarioKey,
} from '../types';
import {
  bearingToCardinal,
  DEFAULT_TACTICAL_TEAMS,
  evaluateCellViability,
  formatOsGridRef,
  stepLiveTeamPositions,
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
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>('team-alpha');

  // Live position tracking state
  const [isLiveTracking, setIsLiveTracking] = useState<boolean>(true);
  const [trackingSpeed, setTrackingSpeed] = useState<1 | 2 | 5>(1);
  const [isDispatchingWaypoint, setIsDispatchingWaypoint] = useState<boolean>(false);
  const [followSelectedTeam, setFollowSelectedTeam] = useState<boolean>(false);

  // Live telemetry event stream
  const [liveEvents, setLiveEvents] = useState<LivePositionEvent[]>([
    {
      id: 'ev-init-1',
      timestampUtc: '12:30:02 UTC',
      callsign: 'Alpha',
      eventType: 'GPS_FIX',
      summary: 'RTK GNSS lock verified (16 sats) · Ascending Corn Du track @ 2.4 km/h',
      coordinates: 'SN 9907 2112 · 51.8745°N, 3.4680°W',
    },
    {
      id: 'ev-init-2',
      timestampUtc: '12:29:45 UTC',
      callsign: 'UAV-01',
      eventType: 'RADIO_PING',
      summary: 'AES-256 telemetry downlink active (-62 dBm) · Thermal sweep Sector A/B',
      coordinates: 'SN 9996 2151 · 51.8780°N, 3.4550°W',
    },
    {
      id: 'ev-init-3',
      timestampUtc: '12:29:18 UTC',
      callsign: 'K9-Rex',
      eventType: 'GPS_FIX',
      summary: 'Downwind scent cone sweep in progress · Handler vitals nominal (108 bpm)',
      coordinates: 'SN 9839 2073 · 51.8710°N, 3.4780°W',
    },
  ]);

  const nowTimeUtcStr = () => {
    const now = new Date();
    const h = String(now.getUTCHours()).padStart(2, '0');
    const m = String(now.getUTCMinutes()).padStart(2, '0');
    const s = String(now.getUTCSeconds()).padStart(2, '0');
    return `${h}:${m}:${s} UTC`;
  };

  // Real-time GPS position stepping loop
  useEffect(() => {
    if (!isLiveTracking) return;
    const intervalMs = Math.max(450, Math.round(2000 / trackingSpeed));

    const timer = setInterval(() => {
      const timeLabel = nowTimeUtcStr().slice(0, 5) + ' UTC';
      setTacticalTeams((prevTeams) => {
        const nextTeams = stepLiveTeamPositions(prevTeams, trackingSpeed, timeLabel);
        if (followSelectedTeam && selectedTeamId) {
          const tracked = nextTeams.find((t) => t.id === selectedTeamId);
          if (tracked) {
            setMapCenter(tracked.position);
          }
        }
        return nextTeams;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isLiveTracking, trackingSpeed, followSelectedTeam, selectedTeamId]);

  // Tactical team search and filter bar state
  const [teamSearchQuery, setTeamSearchQuery] = useState<string>('');
  const [teamStatusFilter, setTeamStatusFilter] = useState<TeamStatusFilter>('ALL');
  const [teamTypeFilter, setTeamTypeFilter] = useState<TeamTypeFilter>('ALL');
  const [isSimulatingLowBattery, setIsSimulatingLowBattery] = useState<boolean>(false);

  // Notification toast for commander actions
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const pushLiveEvent = (
    callsign: TacticalTeam['callsign'],
    eventType: LivePositionEvent['eventType'],
    summary: string,
    pos: GeoPosition
  ) => {
    const grid = formatOsGridRef(pos.lat, pos.lon);
    const ev: LivePositionEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestampUtc: nowTimeUtcStr(),
      callsign,
      eventType,
      summary,
      coordinates: `${grid} · ${pos.lat.toFixed(4)}°N, ${Math.abs(pos.lon).toFixed(4)}°W`,
    };
    setLiveEvents((prev) => [ev, ...prev.slice(0, 19)]);
  };

  // Manual step +15s for paused inspection
  const handleStepPositionsOnce = () => {
    const timeLabel = nowTimeUtcStr().slice(0, 5) + ' UTC';
    setTacticalTeams((prev) => stepLiveTeamPositions(prev, 2, timeLabel));
    showToast('Stepped all active tactical team positions forward (+15s kinematic vector).');
  };

  // Update a team's operational status in real time
  const handleUpdateTeamStatus = (teamId: string, newStatus: TacticalTeamStatus) => {
    setTacticalTeams((prev) =>
      prev.map((t) => {
        if (t.id !== teamId) return t;
        let nextSpeed = t.speedKmh;
        let nextTask = t.currentTask;

        if (newStatus === 'In progress') {
          nextSpeed =
            t.type === 'AIR_UAV'
              ? 35.0
              : t.type === 'HELO'
              ? 140.0
              : t.type === 'K9_UNIT'
              ? 3.0
              : 2.2;
          nextTask = `Active sweep · ${t.sector}`;
        } else if (newStatus === 'Returning') {
          nextSpeed = t.type === 'AIR_UAV' ? 40.0 : t.type === 'HELO' ? 160.0 : 2.6;
          nextTask = 'RTB: Returning to Storey Arms Command Post';
        } else if (newStatus === 'Holding') {
          nextSpeed = 0.0;
          nextTask = `Holding position in ${t.sector} · awaiting commander tasking`;
        } else if (newStatus === 'Ready') {
          nextSpeed = 0.0;
          nextTask = 'Standby ready · equipment and comms checked';
        } else if (newStatus === 'SOS / Assist') {
          nextSpeed = 0.0;
          nextTask = 'SOS EMERGENCY BEACON ACTIVE · Immediate extraction/assistance requested';
        }

        pushLiveEvent(
          t.callsign,
          'STATUS_CHANGE',
          `Status transitioned to [${newStatus.toUpperCase()}] · ${nextTask}`,
          t.position
        );

        return {
          ...t,
          status: newStatus,
          speedKmh: nextSpeed,
          currentTask: nextTask,
          lastCheckInUtc: `${nowTimeUtcStr().slice(0, 5)} UTC (Live)`,
        };
      })
    );

    const targetTeam = tacticalTeams.find((t) => t.id === teamId);
    if (targetTeam) {
      showToast(`Team ${targetTeam.callsign} status updated to "${newStatus}". Broadcast logged.`);
    }
  };

  // Ping a team's radio link in real time
  const handlePingTeamRadio = (teamId: string) => {
    setTacticalTeams((prev) =>
      prev.map((t) => {
        if (t.id !== teamId) return t;
        const rssi = Math.max(
          -92,
          Math.min(-50, (t.telematics?.radioRssiDb || -74) + (Math.random() > 0.5 ? 2 : -2))
        );
        pushLiveEvent(
          t.callsign,
          'RADIO_PING',
          `Radio check ACK on ${t.radioChannel.split('(')[0]} (${rssi} dBm) · All personnel accounted`,
          t.position
        );
        return {
          ...t,
          lastCheckInUtc: `${nowTimeUtcStr().slice(0, 5)} UTC (Verified)`,
          telematics: {
            ...t.telematics!,
            radioRssiDb: rssi,
          },
        };
      })
    );
    const targetTeam = tacticalTeams.find((t) => t.id === teamId);
    if (targetTeam) {
      showToast(
        `VHF/Data Link ACK received from Team ${targetTeam.callsign} (${targetTeam.telematics?.osGridRef}).`
      );
    }
  };

  // Dispatch selected team to clicked map waypoint
  const handleDispatchWaypoint = (pos: GeoPosition) => {
    const activeId = selectedTeamId || tacticalTeams[0]?.id;
    if (!activeId) return;

    const gridRef = formatOsGridRef(pos.lat, pos.lon);

    setTacticalTeams((prev) =>
      prev.map((t) => {
        if (t.id !== activeId) return t;
        const dLat = (pos.lat - t.position.lat) * 111000;
        const dLon = (pos.lon - t.position.lon) * 68500;
        const deg = Math.round(((Math.atan2(dLon, dLat) * 180) / Math.PI + 360) % 360);
        const cardinal = bearingToCardinal(deg);
        const nominalSpeed =
          t.type === 'AIR_UAV'
            ? 36.0
            : t.type === 'HELO'
            ? 150.0
            : t.type === 'K9_UNIT'
            ? 3.2
            : 2.5;
        const distKm = Math.hypot(dLat, dLon) / 1000;
        const eta = Math.max(1, Math.round((distKm / nominalSpeed) * 60));

        pushLiveEvent(
          t.callsign,
          'WAYPOINT_TASK',
          `Vectored to waypoint ${gridRef} (${cardinal} ${deg}°, ETA ${eta}m)`,
          pos
        );

        return {
          ...t,
          status: 'In progress',
          speedKmh: nominalSpeed,
          targetWaypoint: pos,
          currentTask: `Vectored to ${gridRef} (${cardinal} ${deg}°) · ETA ${eta}m`,
          lastCheckInUtc: `${nowTimeUtcStr().slice(0, 5)} UTC (Tasked)`,
          telematics: {
            ...t.telematics!,
            headingDeg: deg,
            headingCardinal: cardinal,
            etaMinutes: eta,
          },
        };
      })
    );

    setIsDispatchingWaypoint(false);
    const teamObj = tacticalTeams.find((t) => t.id === activeId);
    showToast(
      `Waypoint ${gridRef} transmitted to Team ${teamObj?.callsign || 'Alpha'}. Moving on vector.`
    );
  };

  // Toggle <20% critical battery simulation for live testing on any team
  const handleToggleSimulateBatteryDrain = (teamId: string = 'team-alpha') => {
    const targetTeam = tacticalTeams.find((t) => t.id === teamId) || tacticalTeams[0];
    if (!targetTeam) return;

    const currentBatt =
      targetTeam.batteryPct !== undefined ? targetTeam.batteryPct : targetTeam.endurancePct;
    const isCurrentlyCritical = currentBatt < 20;
    const nextCritical = !isCurrentlyCritical;

    setTacticalTeams((teams) => {
      const updated = teams.map((t) => {
        if (t.id === targetTeam.id) {
          if (nextCritical) {
            const drainedPct = t.type === 'AIR_UAV' ? 14 : 18;
            return {
              ...t,
              batteryPct: drainedPct,
              endurancePct: drainedPct,
              currentTask: `CRITICAL BATTERY (${drainedPct}% <20%): Power reserve warning active · Immediate RTB or pack swap advised`,
              telematics: {
                ...t.telematics!,
                batteryVoltage: t.type === 'AIR_UAV' ? 19.2 : 3.4,
              },
            };
          } else {
            return {
              ...t,
              batteryPct: t.type === 'AIR_UAV' ? 88 : undefined,
              endurancePct: 88,
              currentTask:
                t.type === 'AIR_UAV'
                  ? 'Thermal raster sweep over Craig Cerrig-gleisiad'
                  : 'Hasty path sweep towards Corn Du saddle',
              telematics: {
                ...t.telematics!,
                batteryVoltage: t.type === 'AIR_UAV' ? 24.6 : undefined,
              },
            };
          }
        }
        return t;
      });

      const anyStillCritical = updated.some(
        (u) => (u.batteryPct !== undefined ? u.batteryPct : u.endurancePct) < 20
      );
      setIsSimulatingLowBattery(anyStillCritical);
      return updated;
    });

    const nowUtc = new Date().toISOString().split('T')[1].slice(0, 8) + ' UTC';
    if (nextCritical) {
      const drainedVal = targetTeam.type === 'AIR_UAV' ? 14 : 18;
      setLiveEvents((prev) => [
        {
          id: `ev-batt-${Date.now()}`,
          timestampUtc: nowUtc,
          teamId: targetTeam.id,
          callsign: targetTeam.callsign,
          eventType: 'STATUS_CHANGE',
          summary: `CRITICAL BATTERY WARNING: Reserve dropped to ${drainedVal}% (<20% threshold) · Pulse alert active`,
          coordinates: targetTeam.telematics?.osGridRef || 'SN 9864 2138',
        },
        ...prev.slice(0, 19),
      ]);
      showToast(
        `BATTERY WARNING (<20%): Team ${targetTeam.callsign} dropped to ${drainedVal}% reserve. Visual pulse warning active.`
      );
    } else {
      showToast(`Power restored: Team ${targetTeam.callsign} battery normalized to 88%.`);
    }
  };

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

  const candidate = rescue.evidence_candidates?.[0];
  const plan = rescue.plan;

  const handleToggleLayer = (key: keyof MapLayerToggles) => {
    setLayerToggles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectScenario = (key: WeatherScenarioKey) => {
    const newWeather = WEATHER_PRESETS[key];
    setWeather(newWeather);
    showToast(`Atmospheric conditions shifted to ${key.replace('_', ' ')}. Causality re-evaluated.`);

    if (selectedCell) {
      const updatedReport = evaluateCellViability(selectedCell, newWeather, tacticalTeams);
      setSelectedReport(updatedReport);
    }
  };

  const handleUpdateWeather = (updated: DetailedWeatherReport) => {
    setWeather(updated);
    if (selectedCell) {
      const updatedReport = evaluateCellViability(selectedCell, updated, tacticalTeams);
      setSelectedReport(updatedReport);
    }
  };

  const handleSelectHex = (cell: SearchCell, report: CellCausalityReport) => {
    setSelectedCell(cell);
    setSelectedReport(report);
  };

  const handleLocateTeam = (team: TacticalTeam) => {
    setSelectedTeamId(team.id);
    setMapCenter(team.position);
    showToast(`Centered on Team ${team.callsign} (${team.telematics?.osGridRef || team.sector})`);
  };

  const handleAssignTeamToCell = (teamCallsign: string, cellId: string) => {
    setTacticalTeams((prev) =>
      prev.map((t) => {
        if (t.callsign === teamCallsign) {
          const targetCentre = selectedCell?.centre || t.targetWaypoint;
          pushLiveEvent(
            t.callsign,
            'WAYPOINT_TASK',
            `Assigned to Hexagon ${cellId} sector survey`,
            targetCentre || t.position
          );
          return {
            ...t,
            status: 'In progress',
            speedKmh: t.speedKmh > 0 ? t.speedKmh : 2.2,
            targetWaypoint: targetCentre,
            sector: `Hex ${cellId} Sector`,
            assignedHexId: cellId,
            currentTask: `Re-tasked to survey Hexagon ${cellId}`,
            lastCheckInUtc: `${nowTimeUtcStr().slice(0, 5)} UTC (Tasked)`,
          };
        }
        return t;
      })
    );
    showToast(`Team ${teamCallsign} deployed to Hexagon ${cellId}. Tasking broadcast via radio.`);
  };

  const [isSimulatingDrift, setIsSimulatingDrift] = useState<boolean>(false);

  const handleSimulateDriftToggle = () => {
    setIsSimulatingDrift((prev) => {
      const next = !prev;
      setTacticalTeams((teams) =>
        teams.map((t) => {
          if (t.callsign === 'Bravo') {
            if (next) {
              const driftPos = { lat: 51.859, lon: -3.4735 };
              pushLiveEvent(
                'Bravo',
                'GEOFENCE_ALERT',
                'BOUNDARY BREACH: +185m outside Sector B into Craig Cwm Llwch scarp (>34° slope)',
                driftPos
              );
              return {
                ...t,
                isDrifted: true,
                position: driftPos,
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
                  osGridRef: 'SN 9894 1973',
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
        showToast('GEOFENCE BREACH: Team Bravo drifted +185m outside Sector B boundary!');
      } else {
        showToast('Geofence normalized: Team Bravo returned to Sector B boundaries.');
      }

      return next;
    });
  };

  const handleRevectorTeam = (teamCallsign: string) => {
    setIsSimulatingDrift(false);
    setTacticalTeams((teams) =>
      teams.map((t) => {
        if (t.callsign === teamCallsign) {
          const safePos = { lat: 51.862, lon: -3.47 };
          pushLiveEvent(
            t.callsign,
            'WAYPOINT_TASK',
            'VHF Ch 2 Re-vector command acknowledged · Returning to Sector B grid line',
            safePos
          );
          return {
            ...t,
            isDrifted: false,
            position: safePos,
            currentTask: 'Re-vectored: Returning to designated Sector B grid line',
            lastCheckInUtc: `${nowTimeUtcStr().slice(0, 5)} UTC (Re-vectored)`,
            telematics: {
              ...t.telematics!,
              driftDistanceM: 0,
              osGridRef: 'SN 9894 1973',
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
    showToast(
      `Commander authorization logged: Sector boundary expanded for Team ${teamCallsign}. Audit trail updated.`
    );
  };

  const handleTriggerUavDetection = () => {
    showToast(
      'SkyRanger UAV-01 FLIR Boson: Target flagged at 37.2°C (Candidate C-02). Transmitted to queue.'
    );
    onOpenEvidence();
  };

  const handleTriggerWeatherFlare = () => {
    handleSelectScenario('SUMMIT_GALE');
  };

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
        target_waypoint: t.targetWaypoint,
        telematics: t.telematics,
        equipment: t.carriedEquipment,
        status: t.status,
      })),
      live_telemetry_packets: liveEvents,
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
  const activeSelectedTeam =
    tacticalTeams.find((t) => t.id === selectedTeamId) || tacticalTeams[0];

  return (
    <div className="flex-1 flex flex-col bg-[#EDF2EF] overflow-y-auto hig-scroll-view">
      <StepHeader
        stepNumber="07 / 09"
        stepTitle="Active Operation · Live Position & Team Status"
        missionRef={rescue.mission_reference}
      />

      <div className="p-4 sm:p-6 hig-safe-area max-w-7xl mx-auto w-full space-y-5">
        {/* Top Header Card — Clean Typography & >= 44pt Primary Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 tactical-card p-4 sm:p-5 rounded-2xl">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono font-bold text-xs sm:text-sm bg-[#E1ECE8] text-[#064E3B] px-3 py-1 rounded-lg border border-[#A7C7BE] tabular-nums">
                {rescue.mission_reference}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#081820] tracking-tight">
                {rescue.mission_name} · Live Position &amp; Team Status
              </h1>
            </div>
            <p className="text-sm font-medium text-[#1E3831] mt-1 font-mono tabular-nums">
              LKP Anchor: {rescue.location_label} ({rescue.last_known_location.lat.toFixed(4)}°N,{' '}
              {Math.abs(rescue.last_known_location.lon).toFixed(4)}°W) ·{' '}
              {tacticalTeams.filter((t) => t.speedKmh > 0).length}/{tacticalTeams.length} Units Moving
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <SecondaryButton onClick={onLogObservation} icon={<PlusCircle size={18} />}>
              Log Observation
            </SecondaryButton>
            <PrimaryButton onClick={onOpenCloseout} icon={<FileCheck size={18} />}>
              Close Mission &amp; Audit
            </PrimaryButton>
          </div>
        </div>

        {/* Commander Toast Alert */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="bg-[#081820] border border-[#0B6758] text-white px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between shadow-md"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-[#88C070] shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Waypoint Dispatch Mode Banner */}
        {isDispatchingWaypoint && activeSelectedTeam && (
          <div className="tactical-card-yellow rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm font-bold text-[#081820]">
              <Crosshair size={20} className="animate-spin text-[#B45309] shrink-0" />
              <span>
                Waypoint Vector Mode Active: Tap any point on the Tactical Map below to dispatch Team{' '}
                {activeSelectedTeam.callsign} ({activeSelectedTeam.name}).
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsDispatchingWaypoint(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#081820] text-white text-xs font-bold cursor-pointer self-start sm:self-center shrink-0"
            >
              Cancel Vector Mode
            </button>
          </div>
        )}

        {/* Evidence Alert Banner if candidate present */}
        {candidate && (
          <div className="bg-[#FEF3DD] border border-[#D97706] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 hig-app-icon bg-[#D97706] flex items-center justify-center text-white shrink-0">
                <Camera size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-base text-[#081820]">
                    1 Unverified Evidence Candidate ({candidate.id})
                  </span>
                  <span className="text-xs font-bold text-[#78350F] bg-white px-2.5 py-0.5 rounded-full border border-[#D97706]">
                    {candidate.status === 'unverified'
                      ? 'Awaiting verification'
                      : 'Marked for ground check'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#78350F] font-medium mt-1 font-mono tabular-nums">
                  Platform: <strong>{candidate.platform_id}</strong> (Frame {candidate.frame_ref}) ·{' '}
                  {candidate.distance_from_lkp_km} km {candidate.bearing_from_lkp} of Storey Arms
                </p>
              </div>
            </div>
            <PrimaryButton
              onClick={onOpenEvidence}
              className="shrink-0 self-start sm:self-center"
              icon={<ChevronRight size={18} />}
            >
              Review Evidence (08 / 09)
            </PrimaryButton>
          </div>
        )}

        {/* Proximity Alert Indicator */}
        <ProximityAlertIndicator
          driftedTeams={driftedTeams}
          onRevectorTeam={handleRevectorTeam}
          onExpandSector={handleExpandSector}
          onSimulateDriftToggle={handleSimulateDriftToggle}
          isSimulatingDrift={isSimulatingDrift}
        />

        {/* Live Map Telematics Ribbon & Position Tracking Controller */}
        <MapTelematicsRibbon
          teams={tacticalTeams}
          selectedTeamId={selectedTeamId}
          onSelectTeam={(teamId) => {
            setSelectedTeamId(teamId);
            const tm = tacticalTeams.find((t) => t.id === teamId);
            if (tm) setMapCenter(tm.position);
          }}
          isLiveTracking={isLiveTracking}
          onToggleLiveTracking={() => setIsLiveTracking((prev) => !prev)}
          trackingSpeed={trackingSpeed}
          onChangeTrackingSpeed={setTrackingSpeed}
          onStepPositionsOnce={handleStepPositionsOnce}
          onUpdateTeamStatus={handleUpdateTeamStatus}
          onPingTeamRadio={handlePingTeamRadio}
          isDispatchingWaypoint={isDispatchingWaypoint}
          onToggleDispatchWaypoint={() => setIsDispatchingWaypoint((prev) => !prev)}
          onSimulateDriftToggle={handleSimulateDriftToggle}
          isSimulatingDrift={isSimulatingDrift}
          onTriggerUavDetection={handleTriggerUavDetection}
          onTriggerWeatherFlare={handleTriggerWeatherFlare}
          onToggleBatteryDrain={() => handleToggleSimulateBatteryDrain('team-alpha')}
          isSimulatingLowBattery={isSimulatingLowBattery}
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

        {/* Main Grid: Tactical Map & Causality Inspector / Sector Board */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Tactical Map (8 Cols) */}
          <div
            className={`${
              selectedCell && selectedReport ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-8'
            } flex flex-col min-h-[520px]`}
          >
            <div className="flex-1 flex flex-col p-4 tactical-card rounded-2xl">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 mb-3.5 border-b border-[#CBD8D4] pb-3.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Compass size={19} className="text-[#0B6758]" />
                  <h2 className="text-base font-bold text-[#081820]">
                    Tactical Map · GPS Telemetry &amp; Causality Grid
                  </h2>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={followSelectedTeam}
                    onClick={() => setFollowSelectedTeam((prev) => !prev)}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                      followSelectedTeam
                        ? 'bg-[#0B6758] text-white border-[#085446]'
                        : 'bg-[#F6F9F7] text-[#081820] border-[#B8C9C3] hover:bg-[#E1ECE8]'
                    }`}
                    title="Lock map camera onto the currently selected team as it moves"
                  >
                    {followSelectedTeam
                      ? `Following ${activeSelectedTeam?.callsign}`
                      : 'Follow Selected Unit'}
                  </button>
                </div>

                {/* Quick Search & Segmented Status Filter above Map (Apple HIG Text Fields: >= 44pt, 17px font) */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <input
                      type="search"
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
                      placeholder="Find unit..."
                      aria-label="Quick find unit on map"
                      className="w-44 sm:w-52 pl-9 pr-9 py-2 min-h-[44px] bg-[#F6F9F7] border border-[#8BA39B] rounded-xl focus:bg-white text-[#081820]"
                    />
                    <Search
                      size={16}
                      className="absolute left-3 top-3.5 text-[#1E3831] pointer-events-none"
                    />
                    {teamSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setTeamSearchQuery('')}
                        className="absolute right-0 top-0 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#1E3831] hover:text-[#DC2626] cursor-pointer"
                        title="Clear search"
                        aria-label="Clear quick unit search"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums flex-wrap">
                    <button
                      type="button"
                      onClick={() =>
                        setTeamStatusFilter(teamStatusFilter === 'MOVING' ? 'ALL' : 'MOVING')
                      }
                      className={`min-h-[40px] px-3 py-1.5 rounded-full font-bold border transition-colors cursor-pointer ${
                        teamStatusFilter === 'MOVING'
                          ? 'bg-[#0B6758] text-white border-[#085446]'
                          : 'bg-[#F6F9F7] text-[#081820] border-[#B8C9C3] hover:bg-[#E1ECE8]'
                      }`}
                    >
                      Moving (
                      {
                        tacticalTeams.filter(
                          (t) =>
                            t.speedKmh > 0 &&
                            (t.status === 'In progress' || t.status === 'Returning')
                        ).length
                      }
                      )
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setTeamStatusFilter(
                          teamStatusFilter === 'STATIONARY' ? 'ALL' : 'STATIONARY'
                        )
                      }
                      className={`min-h-[40px] px-3 py-1.5 rounded-full font-bold border transition-colors cursor-pointer ${
                        teamStatusFilter === 'STATIONARY'
                          ? 'bg-[#0B6758] text-white border-[#085446]'
                          : 'bg-[#F6F9F7] text-[#081820] border-[#B8C9C3] hover:bg-[#E1ECE8]'
                      }`}
                    >
                      Hold (
                      {
                        tacticalTeams.filter(
                          (t) =>
                            t.speedKmh === 0 ||
                            t.status === 'Ready' ||
                            t.status === 'Holding'
                        ).length
                      }
                      )
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setTeamStatusFilter(
                          teamStatusFilter === 'LOW_BATTERY' ? 'ALL' : 'LOW_BATTERY'
                        )
                      }
                      className={`min-h-[40px] px-3 py-1.5 rounded-full font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        teamStatusFilter === 'LOW_BATTERY'
                          ? 'bg-[#DC2626] text-white border-[#991B1B]'
                          : tacticalTeams.some(
                              (t) =>
                                (t.batteryPct !== undefined ? t.batteryPct : t.endurancePct) <
                                20
                            )
                          ? 'bg-[#DC2626] text-white border-[#991B1B] animate-pulse'
                          : 'bg-[#FEF3DD] text-[#78350F] border-[#D97706] hover:bg-[#FDE68A]'
                      }`}
                    >
                      <BatteryWarning size={14} />
                      <span>
                        Low Batt (
                        {
                          tacticalTeams.filter(
                            (t) =>
                              (t.batteryPct !== undefined && t.batteryPct <= 50) ||
                              t.endurancePct <= 50
                          ).length
                        }
                        )
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-[440px]">
                <OsmMap
                  center={mapCenter}
                  zoom={13}
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
                    showToast(
                      `Focused on Team ${team.callsign} (${
                        team.telematics?.osGridRef || team.sector
                      })`
                    );
                  }}
                  isDispatchingWaypoint={isDispatchingWaypoint}
                  onDispatchWaypoint={handleDispatchWaypoint}
                  candidates={rescue.evidence_candidates || []}
                  showSectors={layerToggles.sectors}
                  layerToggles={layerToggles}
                  weather={weather}
                  selectedHexId={selectedCell?.cell_id}
                  onSelectHex={handleSelectHex}
                  showLegend={true}
                  className="h-full min-h-[440px]"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Cell Causality Inspector OR Live Position & Sector Board */}
          <div
            className={`${
              selectedCell && selectedReport ? 'lg:col-span-5 xl:col-span-4' : 'lg:col-span-4'
            } space-y-5`}
          >
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
              <div className="tactical-card rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#CBD8D4] pb-3">
                  <span className="text-base font-bold text-[#081820] flex items-center gap-2">
                    <Layers size={18} className="text-[#0B6758]" />
                    <span>Live Position &amp; Sector Board</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-[#064E3B] bg-[#E1ECE8] px-2.5 py-1 rounded-full border border-[#A7C7BE] tabular-nums">
                    {isLiveTracking ? `LIVE ${trackingSpeed}x` : 'PAUSED'}
                  </span>
                </div>

                {/* Apple HIG Lists & Tables: Row >= 44pt, border-bottom: 1px solid var(--separator) */}
                <div className="divide-y divide-[#CBD8D4] border border-[#CBD8D4] rounded-xl overflow-hidden bg-[#F6F9F7] font-mono text-xs tabular-nums">
                  {tacticalTeams.map((tm) => {
                    const isSel = selectedTeamId === tm.id;
                    const moving =
                      tm.speedKmh > 0 &&
                      (tm.status === 'In progress' || tm.status === 'Returning');
                    const battVal =
                      tm.batteryPct !== undefined ? tm.batteryPct : tm.endurancePct;
                    const isBatteryCritical = battVal < 20;
                    return (
                      <div
                        key={tm.id}
                        onClick={() => {
                          setSelectedTeamId(tm.id);
                          setMapCenter(tm.position);
                        }}
                        className={`hig-list-row p-3 flex items-center justify-between cursor-pointer transition-colors ${
                          isBatteryCritical
                            ? 'bg-[#FEF2F2] text-[#7F1D1D] animate-battery-warning'
                            : isSel
                            ? 'bg-[#E1ECE8] text-[#081820]'
                            : 'bg-white hover:bg-[#EDF2EF] text-[#081820]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              tm.status === 'SOS / Assist' || tm.isDrifted || isBatteryCritical
                                ? 'bg-[#DC2626] animate-ping'
                                : moving
                                ? 'bg-[#16A34A]'
                                : 'bg-[#64748B]'
                            }`}
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-sm font-sans flex items-center gap-1.5 flex-wrap">
                              <span className="text-[#081820]">{tm.callsign}</span>
                              <span className="text-xs font-medium text-[#1E3831]">
                                · {tm.status}
                              </span>
                              <TeamBatteryPill
                                percentage={battVal}
                                size="sm"
                                showLabel={false}
                              />
                            </div>
                            <div className="text-xs text-[#1E3831] mt-0.5">
                              {tm.telematics?.osGridRef} · {tm.telematics?.altitudeM}m ASL
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-2">
                          <div
                            className={`font-bold text-xs ${
                              isBatteryCritical
                                ? 'text-[#DC2626] animate-pulse'
                                : 'text-[#064E3B]'
                            }`}
                          >
                            {isBatteryCritical
                              ? `LOW BATT ${battVal}%`
                              : moving
                              ? `${tm.telematics?.headingCardinal} ${tm.speedKmh.toFixed(1)} km/h`
                              : '0.0 km/h'}
                          </div>
                          <div className="text-xs text-[#1E3831]">
                            {tm.position.lat.toFixed(4)}°N, {Math.abs(tm.position.lon).toFixed(4)}°W
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3.5 bg-[#F6F9F7] text-[#081820] rounded-xl border border-[#CBD8D4] text-xs">
                  <div className="font-bold text-[#064E3B] flex items-center gap-2 mb-1">
                    <Compass size={15} />
                    <span>Map Interaction</span>
                  </div>
                  <p className="text-xs text-[#1E3831] leading-relaxed">
                    Tap any hexagonal cell on the map to inspect weather-terrain causality, or tap{' '}
                    <strong>Vector on Map</strong> to dispatch a unit to new coordinates.
                  </p>
                </div>
              </div>
            )}

            {/* Operational Anchor & Timeline Card (Apple HIG Lists & Tables: Row >= 44pt) */}
            <div className="tactical-card rounded-2xl p-4 sm:p-5 space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-[#CBD8D4] pb-3">
                <h2 className="font-bold text-base text-[#081820]">
                  Operational Anchor &amp; Timeline
                </h2>
                <ActivityRing percentage={68} size={36} strokeWidth={4} />
              </div>
              <div className="divide-y divide-[#CBD8D4] text-xs">
                <div className="hig-list-row flex items-center justify-between py-2.5">
                  <span className="text-[#1E3831] font-medium">Subject Profile</span>
                  <span className="font-mono font-bold text-[#081820]">{rescue.subject_reference}</span>
                </div>
                <div className="hig-list-row flex items-center justify-between py-2.5">
                  <span className="text-[#1E3831] font-medium">Incident Commander</span>
                  <span className="font-mono font-bold text-[#0B6758]">{rescue.commander_reference}</span>
                </div>
                <div className="hig-list-row flex items-center justify-between py-2.5">
                  <span className="text-[#1E3831] font-medium">Active Search Window</span>
                  <span className="font-mono font-bold text-[#081820] tabular-nums">3.0 hours elapsed</span>
                </div>
                <div className="hig-list-row flex items-center justify-between py-2.5">
                  <span className="text-[#1E3831] font-medium">Terrain Classification</span>
                  <span className="font-semibold text-[#081820]">{rescue.terrain_type}</span>
                </div>
                <div className="hig-list-row flex items-center justify-between py-2.5">
                  <span className="text-[#1E3831] font-medium">Next Scheduled Radio Poll</span>
                  <span className="font-mono font-bold text-[#0B6758] tabular-nums">13:00 UTC</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Status Summaries Panel with Live Status Switcher, Coordinates, & Telemetry Feed */}
        <TeamStatusSummaries
          teams={tacticalTeams}
          selectedTeamId={selectedTeamId}
          onSelectTeam={(team) => {
            setSelectedTeamId(team.id);
            setMapCenter(team.position);
            showToast(
              `Focused on Team ${team.callsign} (${team.telematics?.osGridRef || team.sector})`
            );
          }}
          onLocateTeam={handleLocateTeam}
          onUpdateTeamStatus={handleUpdateTeamStatus}
          onPingTeamRadio={handlePingTeamRadio}
          onVectorTeamOnMap={(team) => {
            setSelectedTeamId(team.id);
            setIsDispatchingWaypoint(true);
            showToast(`Click any point on the Tactical Map to dispatch Team ${team.callsign}.`);
          }}
          liveEvents={liveEvents}
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
