import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  CellCausalityReport,
  DataSourceAvailability,
  DetailedWeatherReport,
  EvidenceCandidate,
  GeoPosition,
  MapLayerToggles,
  Observation,
  RadiusRing,
  SearchCell,
  SearchRegion,
  TacticalTeam,
  TeamAllocation,
} from '../types';
import { SrColors } from './Theme';
import { evaluateCellViability, WEATHER_PRESETS, DEFAULT_TACTICAL_TEAMS } from '../core/CausalityModel';

// Custom LKP Pin Marker Icon
const createPinIcon = (label?: string) => {
  return L.divIcon({
    className: 'custom-lkp-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="width: 28px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <svg width="28" height="36" viewBox="0 0 24 32" fill="none">
            <path d="M12 0C5.37 0 0 5.37 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.37 18.63 0 12 0Z" fill="#0B6758" stroke="#FFFFFF" stroke-width="2"/>
            <circle cx="12" cy="12" r="4.5" fill="#FFFFFF"/>
          </svg>
        </div>
        ${
          label
            ? `<div style="background: #1C2E2A; color: #FFFFFF; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; margin-top: 2px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.2);">${label}</div>`
            : ''
        }
      </div>
    `,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
  });
};

// Custom Evidence Candidate Marker Icon (Amber)
const createEvidenceIcon = (label: string) => {
  return L.divIcon({
    className: 'custom-evidence-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="width: 26px; height: 34px; display: flex; align-items: center; justify-content: center;">
          <svg width="26" height="34" viewBox="0 0 24 32" fill="none">
            <path d="M12 0C5.37 0 0 5.37 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.37 18.63 0 12 0Z" fill="#F5A623" stroke="#FFFFFF" stroke-width="2"/>
            <circle cx="12" cy="12" r="4" fill="#FFFFFF"/>
          </svg>
        </div>
        <div style="background: #FEF3DD; color: #9A690B; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; margin-top: 2px; white-space: nowrap; border: 1px solid #F3D794; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">
          ${label}
        </div>
      </div>
    `,
    iconSize: [26, 34],
    iconAnchor: [13, 34],
  });
};

// Tactical Team Marker Icon with Live Heading Vector & Status State
const createTacticalTeamIcon = (team: TacticalTeam, isSelected?: boolean) => {
  let bgColor = '#0B6758';
  let typeCode = 'FT';
  if (team.type === 'AIR_UAV') {
    bgColor = '#16A34A';
    typeCode = 'UAV';
  } else if (team.type === 'K9_UNIT') {
    bgColor = '#9A690B';
    typeCode = 'K9';
  } else if (team.type === 'TECH_ROPE') {
    bgColor = '#07483D';
    typeCode = 'TECH';
  } else if (team.type === 'HELO') {
    bgColor = '#0369A1';
    typeCode = 'HELO';
  }

  const heading = team.telematics?.headingDeg || 0;
  const isMoving = team.speedKmh > 0 && (team.status === 'In progress' || team.status === 'Returning');

  if (team.status === 'SOS / Assist') {
    return L.divIcon({
      className: 'custom-tactical-team-pin-sos',
      html: `
        <div style="display: flex; align-items: center; gap: 4px; background: #DC2626; color: #FFFFFF; font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 4px; box-shadow: 0 0 0 5px rgba(220,38,38,0.45), 2px 2px 0px #081820; border: 2px solid #FACC15; white-space: nowrap; transform: translate(-50%, -50%); cursor: pointer; font-family: 'JetBrains Mono', monospace;">
          <span style="font-size: 9px; background: #FACC15; color: #081820; padding: 1px 4px; border-radius: 2px; font-weight: 900;">SOS</span>
          <span>${team.callsign}</span>
        </div>
      `,
      iconSize: [110, 26],
      iconAnchor: [55, 13],
    });
  }

  if (team.isDrifted) {
    return L.divIcon({
      className: 'custom-tactical-team-pin-alert',
      html: `
        <div style="display: flex; align-items: center; gap: 4px; background: #DC2626; color: #FFFFFF; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 4px; box-shadow: 0 0 0 4px rgba(220,38,38,0.4), 2px 2px 0px #081820; border: 1.5px solid #FFFFFF; white-space: nowrap; transform: translate(-50%, -50%); cursor: pointer; font-family: 'JetBrains Mono', monospace;">
          <span style="font-size: 9px; background: rgba(0,0,0,0.35); padding: 1px 4px; border-radius: 2px;">BREACH</span>
          <span>${team.callsign}</span>
        </div>
      `,
      iconSize: [110, 26],
      iconAnchor: [55, 13],
    });
  }

  const borderStyle = isSelected ? '2px solid #FACC15' : '1.5px solid #081820';
  const shadowStyle = isSelected
    ? '0 0 0 3px rgba(250,204,21,0.55), 3px 3px 0px #081820'
    : '2px 2px 0px #081820';

  return L.divIcon({
    className: 'custom-tactical-team-pin',
    html: `
      <div style="display: flex; align-items: center; gap: 4px; background: ${bgColor}; color: #FFFFFF; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px; box-shadow: ${shadowStyle}; border: ${borderStyle}; white-space: nowrap; transform: translate(-50%, -50%); cursor: pointer; font-family: 'JetBrains Mono', monospace;">
        <span style="font-size: 9px; background: #081820; color: #88C070; padding: 1px 4px; border-radius: 2px; font-weight: 800;">${typeCode}</span>
        <span>${team.callsign}</span>
        ${
          isMoving
            ? `<span style="display: inline-block; transform: rotate(${heading}deg); font-size: 10px; color: #FACC15; line-height: 1;" title="Heading ${heading}°">▲</span>`
            : `<span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #E0F8D0;" title="${team.status}"></span>`
        }
      </div>
    `,
    iconSize: [104, 24],
    iconAnchor: [52, 12],
  });
};

interface OsmMapProps {
  center: GeoPosition;
  zoom?: number;
  pin?: GeoPosition | null;
  pinLabel?: string;
  onPinChange?: (pos: GeoPosition) => void;
  isPicker?: boolean;
  rings?: RadiusRing[];
  regions?: SearchRegion[];
  dataSources?: DataSourceAvailability[];
  teams?: TeamAllocation[];
  tacticalTeams?: TacticalTeam[];
  selectedTeamId?: string | null;
  onSelectTeam?: (team: TacticalTeam) => void;
  isDispatchingWaypoint?: boolean;
  onDispatchWaypoint?: (pos: GeoPosition) => void;
  candidates?: EvidenceCandidate[];
  showSectors?: boolean;
  layerToggles?: MapLayerToggles;
  weather?: DetailedWeatherReport;
  selectedHexId?: string | null;
  onSelectHex?: (cell: SearchCell, report: CellCausalityReport) => void;
  className?: string;
  showLegend?: boolean;
}

export const OsmMap: React.FC<OsmMapProps> = ({
  center,
  zoom = 12,
  pin,
  pinLabel,
  onPinChange,
  isPicker = false,
  rings = [],
  regions = [],
  dataSources = [],
  teams = [],
  tacticalTeams,
  selectedTeamId,
  onSelectTeam,
  isDispatchingWaypoint = false,
  onDispatchWaypoint,
  candidates = [],
  showSectors = false,
  layerToggles,
  weather,
  selectedHexId,
  onSelectHex,
  className = 'h-full w-full',
  showLegend = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const hasFitInitialBoundsRef = useRef<boolean>(false);

  // Active weather and tactical teams fallback
  const activeWeather = weather || WEATHER_PRESETS.BASELINE;
  const activeTacticalTeams = tacticalTeams || DEFAULT_TACTICAL_TEAMS;

  // Active toggles with sensible defaults
  const activeToggles: MapLayerToggles = layerToggles || {
    hexGrid: true,
    viabilityHeatmap: true,
    sectors: showSectors,
    wanderContours: true,
    teamPositions: true,
    teamTracks: true,
    uavFlightPath: true,
    terrainHazards: true,
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lon],
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
      });

      // CartoDB / OSM clean topo style
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        subdomains: ['a', 'b', 'c'],
      }).addTo(map);

      const layers = L.layerGroup().addTo(map);
      layerGroupRef.current = layers;
      mapInstanceRef.current = map;

      if (isPicker && onPinChange) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          onPinChange({ lat: e.latlng.lat, lon: e.latlng.lng });
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Bind waypoint dispatch click handler when active
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !onDispatchWaypoint) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (isDispatchingWaypoint) {
        onDispatchWaypoint({ lat: e.latlng.lat, lon: e.latlng.lng });
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isDispatchingWaypoint, onDispatchWaypoint]);

  // Update center if center changed explicitly
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      const current = mapInstanceRef.current.getCenter();
      const dist = Math.abs(current.lat - center.lat) + Math.abs(current.lng - center.lon);
      if (dist > 0.002) {
        mapInstanceRef.current.panTo([center.lat, center.lon], { animate: true });
      }
    }
  }, [center.lat, center.lon]);

  // Redraw layers whenever state or toggles change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layerGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();
    const pinLocation = pin || center;

    // 1. Draw Kinematic Wander Radius Rings (50%, 75%, 95%)
    if (activeToggles.wanderContours && rings && rings.length > 0) {
      const sortedRings = [...rings].sort((a, b) => b.radius_m - a.radius_m);
      const ringColors = [SrColors.Ring95, SrColors.Ring75, SrColors.Ring50];
      const ringOpacities = [0.06, 0.12, 0.18];

      sortedRings.forEach((ring, idx) => {
        const ringColor = ringColors[idx % ringColors.length] || SrColors.Primary;
        const ringOpacity = ringOpacities[idx % ringOpacities.length] || 0.12;

        const circle = L.circle([pinLocation.lat, pinLocation.lon], {
          radius: ring.radius_m,
          color: ringColor,
          weight: 2,
          dashArray: idx === 0 ? '6, 6' : undefined,
          opacity: 0.85,
          fillColor: ringColor,
          fillOpacity: ringOpacity,
        });

        circle.bindTooltip(
          `${(ring.probability * 100).toFixed(0)}% contour · ${(ring.radius_m / 1000).toFixed(1)} km`,
          {
            permanent: false,
            direction: 'top',
            className: 'bg-[#1C2E2A] text-white border-0 text-xs px-2 py-1 rounded shadow',
          }
        );
        layers.addLayer(circle);
      });
    }

    // 2. Draw Sector Polygons if toggled
    if (activeToggles.sectors) {
      // Sector A: Northern path sweep polygon
      const sectorA = [
        [pinLocation.lat, pinLocation.lon],
        [pinLocation.lat + 0.02, pinLocation.lon - 0.015],
        [pinLocation.lat + 0.025, pinLocation.lon + 0.02],
        [pinLocation.lat + 0.008, pinLocation.lon + 0.025],
      ] as [number, number][];

      const polyA = L.polygon(sectorA, {
        color: '#0B6758',
        weight: 2,
        fillColor: '#E1ECE8',
        fillOpacity: 0.3,
      });
      polyA.bindTooltip('Sector A · Northern Path (Team Alpha / K9)', {
        sticky: true,
        className: 'bg-[#0B6758] text-white text-xs px-2 py-1 rounded shadow font-semibold',
      });
      layers.addLayer(polyA);

      // Sector B: Southern drainage search polygon
      const sectorB = [
        [pinLocation.lat, pinLocation.lon],
        [pinLocation.lat - 0.018, pinLocation.lon - 0.01],
        [pinLocation.lat - 0.022, pinLocation.lon + 0.018],
        [pinLocation.lat - 0.005, pinLocation.lon + 0.02],
      ] as [number, number][];

      const polyB = L.polygon(sectorB, {
        color: '#269584',
        weight: 2,
        fillColor: '#269584',
        fillOpacity: 0.2,
      });
      polyB.bindTooltip('Sector B · Southern Drainage (Team Bravo)', {
        sticky: true,
        className: 'bg-[#1C2E2A] text-white text-xs px-2 py-1 rounded shadow font-semibold',
      });
      layers.addLayer(polyB);
    }

    // 3. Draw Hexagonal Search Cells connected to Causality Model
    if ((activeToggles.hexGrid || activeToggles.viabilityHeatmap) && regions && regions.length > 0) {
      regions.slice(0, 18).forEach((region: SearchRegion) => {
        const latlngs = region.cell.boundary.map((p: GeoPosition) => [p.lat, p.lon] as [number, number]);
        const report = evaluateCellViability(region.cell, activeWeather, activeTacticalTeams);
        const isSelected = selectedHexId === region.cell.cell_id;

        // Color coding from causality model
        let strokeColor = '#0B6758';
        let fillColor = '#57BCAE';
        let fillOpacity = 0.25;

        if (activeToggles.viabilityHeatmap) {
          switch (report.viability) {
            case 'VIABLE':
              strokeColor = '#0B6758';
              fillColor = '#10B981';
              fillOpacity = 0.32;
              break;
            case 'DEGRADED':
              strokeColor = '#D97706';
              fillColor = '#F59E0B';
              fillOpacity = 0.35;
              break;
            case 'RESTRICTED':
              strokeColor = '#EA580C';
              fillColor = '#F97316';
              fillOpacity = 0.4;
              break;
            case 'BLOCKED':
              strokeColor = '#DC2626';
              fillColor = '#EF4444';
              fillOpacity = 0.45;
              break;
          }
        }

        if (isSelected) {
          strokeColor = '#FACC15';
          fillColor = '#0B6758';
          fillOpacity = 0.6;
        }

        const polygon = L.polygon(latlngs, {
          color: strokeColor,
          weight: isSelected ? 3 : 1.5,
          opacity: 0.95,
          fillColor: fillColor,
          fillOpacity: fillOpacity,
        });

        // Hover Tooltip with Causality Breakdown
        const tooltipContent = `
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 170px;">
            <div style="font-weight: bold; font-size: 11px; color: #1C2E2A; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E2E8E5; padding-bottom: 3px; margin-bottom: 4px;">
              <span>Hex ${region.cell.cell_id}</span>
              <span style="font-size: 10px; padding: 1px 5px; border-radius: 4px; font-weight: bold; background: ${
                report.viability === 'VIABLE' ? '#E1ECE8; color: #0B6758' : report.viability === 'DEGRADED' ? '#FEF3DD; color: #9A690B' : '#FEE2E2; color: #DC2626'
              }">${report.viability} (${report.overall_score}%)</span>
            </div>
            <div style="font-size: 10px; color: #5A706A; margin-bottom: 2px;">
              Elevation: <b>${report.terrain.elevation_m}m</b> · Slope: <b>${report.terrain.slope_deg}°</b>
            </div>
            <div style="font-size: 10px; color: #5A706A; margin-bottom: 3px;">
              Substrate: <b>${report.terrain.substrate}</b> (${report.terrain.exposure_level} exposure)
            </div>
            <div style="font-size: 10px; color: #1C2E2A; font-weight: 600; line-height: 1.2;">
              ${report.primary_recommendation}
            </div>
            <div style="font-size: 9px; color: #0B6758; font-weight: bold; margin-top: 4px; text-transform: uppercase;">
              Click hexagon to inspect teams & gear
            </div>
          </div>
        `;

        polygon.bindTooltip(tooltipContent, {
          sticky: true,
          className: 'bg-white text-[#1C2E2A] border border-[#E2E8E5] p-2 rounded-lg shadow-md',
        });

        // Interactive Click to Inspect
        if (onSelectHex) {
          polygon.on('click', () => {
            onSelectHex(region.cell, report);
          });
        }

        layers.addLayer(polygon);

        // Highlight selected cell with distinct pulse circle center
        if (isSelected) {
          const centerMarker = L.circleMarker([region.cell.centre.lat, region.cell.centre.lon], {
            radius: 6,
            color: '#FACC15',
            fillColor: '#081820',
            fillOpacity: 1,
            weight: 2,
          });
          layers.addLayer(centerMarker);
        }
      });
    }

    // 4. Draw Breadcrumb Search Tracks & Target Waypoint Vectors if toggled
    if (activeToggles.teamTracks && activeTacticalTeams.length > 0) {
      activeTacticalTeams.forEach((t) => {
        if (t.breadcrumbs && t.breadcrumbs.length > 1) {
          const points = t.breadcrumbs.map((p) => [p.lat, p.lon] as [number, number]);
          const trackLine = L.polyline(points, {
            color: t.type === 'AIR_UAV' ? '#16A34A' : t.type === 'K9_UNIT' ? '#9A690B' : '#0B6758',
            weight: 2.5,
            dashArray: '4, 5',
            opacity: 0.85,
          });
          trackLine.bindTooltip(`Breadcrumb Trail: Team ${t.callsign} (${t.breadcrumbs.length} GPS fixes)`, {
            sticky: true,
            className: 'bg-[#081820] text-[#E0F8D0] text-[10px] px-2 py-0.5 rounded font-mono',
          });
          layers.addLayer(trackLine);
        }

        // Draw target waypoint vector if moving or selected
        const isSelected = selectedTeamId === t.id;
        if (t.targetWaypoint && (isSelected || t.status === 'In progress' || t.status === 'Returning')) {
          const targetPos: [number, number] =
            t.status === 'Returning'
              ? [51.8685, -3.48]
              : [t.targetWaypoint.lat, t.targetWaypoint.lon];

          const vectorLine = L.polyline([[t.position.lat, t.position.lon], targetPos], {
            color: isSelected ? '#FACC15' : '#081820',
            weight: isSelected ? 2 : 1.5,
            dashArray: '2, 5',
            opacity: isSelected ? 0.95 : 0.45,
          });
          layers.addLayer(vectorLine);

          if (isSelected) {
            const wpMarker = L.circleMarker(targetPos, {
              radius: 5,
              color: '#081820',
              weight: 2,
              fillColor: '#FACC15',
              fillOpacity: 1,
            });
            wpMarker.bindTooltip(`Target Waypoint · Team ${t.callsign} (ETA ${t.telematics?.etaMinutes || 12}m)`, {
              sticky: true,
              className: 'bg-[#081820] text-[#FACC15] text-[10px] px-2 py-0.5 rounded font-mono font-bold',
            });
            layers.addLayer(wpMarker);
          }
        }
      });
    }

    // 5. Draw UAV Flight Corridor & Sensor Swath if toggled
    if (activeToggles.uavFlightPath) {
      dataSources.forEach((source: DataSourceAvailability) => {
        if (source.source === 'UAV') {
          source.observations.slice(0, 4).forEach((obs: Observation) => {
            if (obs.footprint && obs.footprint.length >= 3) {
              const latlngs = obs.footprint.map((p: GeoPosition) => [p.lat, p.lon] as [number, number]);
              const footprintPoly = L.polygon(latlngs, {
                color: '#16A34A',
                weight: 1.5,
                dashArray: '3, 4',
                fillColor: '#86EFAC',
                fillOpacity: 0.18,
              });
              footprintPoly.bindTooltip(`UAV FLIR Sensor Swath · ${obs.platform_id}`, {
                sticky: true,
                className: 'bg-[#1C2E2A] text-white text-xs px-2 py-1 rounded',
              });
              layers.addLayer(footprintPoly);
            }
          });
        }
      });
    }

    // 6. Draw Candidates (e.g. C-01)
    candidates.forEach((cand) => {
      const cMarker = L.marker([cand.position.lat, cand.position.lon], {
        icon: createEvidenceIcon(`Candidate ${cand.id}`),
      });
      cMarker.bindTooltip(
        `<b>Candidate ${cand.id}</b><br/>${cand.platform_id} · ${cand.frame_ref}<br/>${cand.description}`,
        {
          sticky: true,
          className: 'bg-white text-[#1C2E2A] border border-[#F3D794] text-xs px-2 py-1.5 rounded shadow',
        }
      );
      layers.addLayer(cMarker);
    });

    // 7. Draw Tactical Teams GPS Markers if toggled
    if (activeToggles.teamPositions && activeTacticalTeams.length > 0) {
      activeTacticalTeams.forEach((team) => {
        const isSelected = selectedTeamId === team.id;

        // Draw GNSS Accuracy / Telemetry Ring around team
        const cepRadiusVisual = (team.telematics?.cepRadiusM || 1.5) * 45;
        const cepCircle = L.circle([team.position.lat, team.position.lon], {
          radius: cepRadiusVisual,
          color: team.status === 'SOS / Assist' ? '#DC2626' : isSelected ? '#FACC15' : '#0B6758',
          weight: isSelected ? 1.5 : 1,
          fillColor: team.status === 'SOS / Assist' ? '#EF4444' : isSelected ? '#FACC15' : '#88C070',
          fillOpacity: isSelected ? 0.2 : 0.08,
        });
        layers.addLayer(cepCircle);

        // If team is drifted, draw boundary breach halo and vector line
        if (team.isDrifted) {
          const alertHalo = L.circleMarker([team.position.lat, team.position.lon], {
            radius: 20,
            color: '#DC2626',
            weight: 2.5,
            fillColor: '#EF4444',
            fillOpacity: 0.25,
            dashArray: '4, 4',
          });
          layers.addLayer(alertHalo);

          // Vector line to assigned boundary
          const expectedSectorEdge: [number, number] = [51.865, -3.473];
          const breachVector = L.polyline(
            [expectedSectorEdge, [team.position.lat, team.position.lon]],
            {
              color: '#DC2626',
              weight: 2,
              dashArray: '3, 4',
              opacity: 0.9,
            }
          );
          breachVector.bindTooltip(
            `<b>Sector Boundary Breach</b><br/>+${team.telematics?.driftDistanceM || 185}m outside ${team.sector}`,
            {
              sticky: true,
              className: 'bg-[#DC2626] text-white text-xs px-2 py-1 rounded shadow',
            }
          );
          layers.addLayer(breachVector);
        }

        // If team is currently selected, draw tactical spotlight halo
        if (isSelected) {
          const selectedHalo = L.circleMarker([team.position.lat, team.position.lon], {
            radius: 22,
            color: '#081820',
            weight: 2.5,
            fillColor: '#FACC15',
            fillOpacity: 0.28,
          });
          layers.addLayer(selectedHalo);
        }

        const marker = L.marker([team.position.lat, team.position.lon], {
          icon: createTacticalTeamIcon(team, isSelected),
        });

        if (onSelectTeam) {
          marker.on('click', () => {
            onSelectTeam(team);
          });
        }

        marker.bindTooltip(
          `<div style="font-family: 'JetBrains Mono', monospace; font-size: 11px;">
            <b>Team ${team.callsign} · ${team.status.toUpperCase()}</b>
            ${
              team.isDrifted
                ? '<br/><span style="color: #DC2626; font-weight: bold;">DRIFTED OUTSIDE SECTOR (+' +
                  (team.telematics?.driftDistanceM || 185) +
                  'm)</span>'
                : ''
            }
            <br/>Grid: <b>${team.telematics?.osGridRef || 'SN 9864 2138'}</b> · Alt: ${team.telematics?.altitudeM || 680}m
            <br/>Vec: ${team.telematics?.headingDeg || 0}° ${team.telematics?.headingCardinal || 'N'} @ ${team.speedKmh} km/h
            <br/>Task: ${team.currentTask}
          </div>`,
          {
            sticky: true,
            className: 'bg-[#081820] text-[#E0F8D0] border border-[#88C070] text-xs px-2.5 py-1.5 rounded shadow-lg',
          }
        );
        layers.addLayer(marker);
      });
    }

    // 8. Draw Terrain Hazard Markers if toggled
    if (activeToggles.terrainHazards) {
      // Pen y Fan crags & Corn Du high scarp hazard markers
      const hazards = [
        {
          lat: 51.883,
          lon: -3.44,
          label: 'Craig Cwm Llwch Crag (45° Scarp - Ropes Required)',
        },
        {
          lat: 51.879,
          lon: -3.45,
          label: 'Scree Gully (Paw Laceration & Stonefall Hazard)',
        },
      ];

      hazards.forEach((h) => {
        const hMarker = L.circleMarker([h.lat, h.lon], {
          radius: 7,
          color: '#DC2626',
          fillColor: '#FEE2E2',
          fillOpacity: 0.9,
          weight: 2,
        });
        hMarker.bindTooltip(`<b>Hazard:</b> ${h.label}`, {
          sticky: true,
          className: 'bg-[#DC2626] text-white text-xs px-2 py-1 rounded shadow',
        });
        layers.addLayer(hMarker);
      });
    }

    // 9. Draw Last Known Position Pin
    if (pin) {
      const marker = L.marker([pin.lat, pin.lon], {
        icon: createPinIcon(pinLabel || 'Last Known Location'),
        draggable: isPicker,
      });

      if (isPicker && onPinChange) {
        marker.on('dragend', (e) => {
          const target = e.target as L.Marker;
          const pos = target.getLatLng();
          onPinChange({ lat: pos.lat, lon: pos.lng });
        });
      }

      layers.addLayer(marker);
    }

    // Auto-fit bounds only once on initial load if rings exist
    if (!isPicker && !hasFitInitialBoundsRef.current && rings.length > 0 && mapInstanceRef.current) {
      const outerRing = rings.reduce((max, r) => (r.radius_m > max.radius_m ? r : max), rings[0]);
      if (outerRing) {
        const bounds = L.latLng([pinLocation.lat, pinLocation.lon]).toBounds(outerRing.radius_m * 2.2);
        map.fitBounds(bounds, { padding: [24, 24] });
        hasFitInitialBoundsRef.current = true;
      }
    }
  }, [
    pin?.lat,
    pin?.lon,
    pinLabel,
    rings,
    regions,
    dataSources,
    activeTacticalTeams,
    selectedTeamId,
    candidates,
    activeToggles,
    activeWeather,
    selectedHexId,
    isPicker,
  ]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div className={`relative ${className} overflow-hidden rounded-xl border border-[#E2E8E5] bg-[#F4F6F5]`}>
      <div ref={mapContainerRef} className="w-full h-full min-h-[300px]" />

      {/* Map Zoom Controls */}
      <div className="absolute right-3 top-3 z-[400] flex flex-col bg-white border border-[#E2E8E5] rounded-lg shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-8 h-8 flex items-center justify-center text-[#1C2E2A] hover:bg-[#F4F6F5] font-bold text-base transition-colors border-b border-[#E2E8E5]"
          title="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-8 h-8 flex items-center justify-center text-[#1C2E2A] hover:bg-[#F4F6F5] font-bold text-base transition-colors"
          title="Zoom out"
        >
          –
        </button>
      </div>

      {/* Map Legend */}
      {showLegend && (
        <div className="absolute left-3 bottom-3 z-[400] bg-white/95 backdrop-blur-xs border border-[#E2E8E5] rounded-lg px-2.5 py-2 shadow-xs flex flex-col gap-1 text-[11px] text-[#1C2E2A]">
          {activeToggles.viabilityHeatmap ? (
            <>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#5A706A] border-b border-[#E2E8E5] pb-0.5 mb-0.5">
                Causality Viability
              </div>
              <div className="flex items-center gap-1.5 font-medium text-[#0B6758]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]" />
                <span>Viable (&gt;75%)</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-[#D97706]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B]" />
                <span>Degraded (45-74%)</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-[#DC2626]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444]" />
                <span>Restricted / Blocked (&lt;45%)</span>
              </div>
            </>
          ) : activeToggles.sectors ? (
            <>
              <div className="flex items-center gap-1.5 font-semibold text-[#0B6758]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#0B6758]" />
                <span>Sector A · Northern Path</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-[#269584]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#269584]" />
                <span>Sector B · Southern Drainage</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#18796C]" />
                <span>50% Ring (3.0 km)</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#269584]" />
                <span>75% Ring (5.4 km)</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#57BCAE]" />
                <span>95% Ring (12.0 km)</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
