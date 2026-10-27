import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { DataSourceAvailability, EvidenceCandidate, GeoPosition, Observation, RadiusRing, SearchRegion, TeamAllocation } from '../types';
import { SrColors } from './Theme';

// Custom LKP Pin Marker Icon
const createPinIcon = (label?: string) => {
  return L.divIcon({
    className: 'custom-lkp-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="width: 28px; height: 36px; display: flex; items-center; justify-content: center;">
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
        <div style="width: 26px; height: 34px; display: flex; items-center; justify-content: center;">
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

// Custom Team Marker Icon
const createTeamIcon = (name: string, sector: string) => {
  return L.divIcon({
    className: 'custom-team-pin',
    html: `
      <div style="display: flex; items-center; gap: 4px; background: #0B6758; color: #FFFFFF; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 20px; box-shadow: 0 2px 8px rgba(11,103,88,0.4); border: 1.5px solid #FFFFFF; white-space: nowrap;">
        <span>Team ${name}</span>
      </div>
    `,
    iconSize: [80, 24],
    iconAnchor: [40, 12],
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
  candidates?: EvidenceCandidate[];
  showSectors?: boolean;
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
  candidates = [],
  showSectors = false,
  className = 'h-full w-full',
  showLegend = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

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

      // CartoDB Positron / OSM clean topo style
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

  // Update center if center changed significantly
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      const current = mapInstanceRef.current.getCenter();
      const dist = Math.abs(current.lat - center.lat) + Math.abs(current.lng - center.lon);
      if (dist > 0.04) {
        mapInstanceRef.current.setView([center.lat, center.lon], zoom);
      }
    }
  }, [center.lat, center.lon]);

  // Redraw layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layerGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();
    const pinLocation = pin || center;

    // 1. Draw Kinematic Wander Radius Rings (50%, 75%, 95%)
    if (rings && rings.length > 0) {
      const sortedRings = [...rings].sort((a, b) => b.radius_m - a.radius_m);
      const ringColors = [SrColors.Ring95, SrColors.Ring75, SrColors.Ring50];
      const ringOpacities = [0.08, 0.15, 0.22];

      sortedRings.forEach((ring, idx) => {
        const ringColor = ringColors[idx % ringColors.length] || SrColors.Primary;
        const ringOpacity = ringOpacities[idx % ringOpacities.length] || 0.15;

        const circle = L.circle([pinLocation.lat, pinLocation.lon], {
          radius: ring.radius_m,
          color: ringColor,
          weight: 2,
          dashArray: idx === 0 ? '6, 6' : undefined,
          opacity: 0.9,
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

    // 2. Draw Sector Polygons if tactical operation view
    if (showSectors) {
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
        fillOpacity: 0.35,
      });
      polyA.bindTooltip('Sector A · Northern path (Team Alpha)', {
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
        fillOpacity: 0.22,
      });
      polyB.bindTooltip('Sector B · Southern drainage (Team Bravo)', {
        sticky: true,
        className: 'bg-[#1C2E2A] text-white text-xs px-2 py-1 rounded shadow font-semibold',
      });
      layers.addLayer(polyB);
    }

    // 3. Draw Hexagonal Search Cells if available
    if (regions && regions.length > 0 && !showSectors) {
      const topScore = regions[0]?.score || 1.0;
      regions.slice(0, 15).forEach((region: SearchRegion) => {
        const latlngs = region.cell.boundary.map((p: GeoPosition) => [p.lat, p.lon] as [number, number]);
        const strength = Math.min(1.0, Math.max(0.2, region.score / topScore));

        const polygon = L.polygon(latlngs, {
          color: '#0B6758',
          weight: 1.5,
          opacity: 0.9,
          fillColor: '#57BCAE',
          fillOpacity: 0.15 + 0.35 * strength,
        });

        polygon.bindTooltip(
          `Cell #${region.rank} · ${(region.score * 100).toFixed(1)}% score<br/>${region.cell.terrain.toLowerCase()}`,
          {
            sticky: true,
            className: 'bg-[#1C2E2A] text-white text-xs px-2 py-1 rounded shadow',
          }
        );
        layers.addLayer(polygon);
      });
    }

    // 4. Draw Data Sources footprints (UAV flight strips)
    dataSources.forEach((source: DataSourceAvailability) => {
      if (source.source === 'UAV') {
        source.observations.slice(0, 4).forEach((obs: Observation) => {
          if (obs.footprint && obs.footprint.length >= 3) {
            const latlngs = obs.footprint.map((p: GeoPosition) => [p.lat, p.lon] as [number, number]);
            const footprintPoly = L.polygon(latlngs, {
              color: '#34C759',
              weight: 1.5,
              dashArray: '4, 4',
              fillColor: '#86EFAC',
              fillOpacity: 0.2,
            });
            footprintPoly.bindTooltip(`UAV Flight Survey Strip · ${obs.platform_id}`, {
              sticky: true,
              className: 'bg-[#1C2E2A] text-white text-xs px-2 py-1 rounded',
            });
            layers.addLayer(footprintPoly);
          }
        });
      }
    });

    // 5. Draw Candidates (e.g. C-01)
    candidates.forEach((cand) => {
      const cMarker = L.marker([cand.position.lat, cand.position.lon], {
        icon: createEvidenceIcon(`Candidate ${cand.id}`),
      });
      cMarker.bindTooltip(
        `<b>Candidate ${cand.id}</b><br/>${cand.platform_id} · ${cand.frame_ref}<br/>${cand.description}`,
        { sticky: true, className: 'bg-white text-[#1C2E2A] border border-[#F3D794] text-xs px-2 py-1.5 rounded shadow' }
      );
      layers.addLayer(cMarker);
    });

    // 6. Draw Teams
    if (showSectors && teams.length > 0) {
      // Position Team Alpha in Sector A
      const teamAPos = [pinLocation.lat + 0.012, pinLocation.lon + 0.005] as [number, number];
      const markerA = L.marker(teamAPos, {
        icon: createTeamIcon('Alpha', 'Sector A'),
      });
      layers.addLayer(markerA);

      // Position Team Bravo in Sector B
      const teamBPos = [pinLocation.lat - 0.01, pinLocation.lon + 0.006] as [number, number];
      const markerB = L.marker(teamBPos, {
        icon: createTeamIcon('Bravo', 'Sector B'),
      });
      layers.addLayer(markerB);
    }

    // 7. Draw Last Known Position Pin
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

    // Auto-fit if rings exist
    if (!isPicker && rings.length > 0 && mapInstanceRef.current) {
      const outerRing = rings.reduce((max, r) => (r.radius_m > max.radius_m ? r : max), rings[0]);
      if (outerRing) {
        const bounds = L.latLng([pinLocation.lat, pinLocation.lon]).toBounds(outerRing.radius_m * 2.2);
        map.fitBounds(bounds, { padding: [24, 24] });
      }
    }
  }, [pin?.lat, pin?.lon, pinLabel, rings, regions, dataSources, teams, candidates, showSectors, isPicker]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div className={`relative ${className} overflow-hidden rounded-xl border border-[#E2E8E5] bg-[#F4F6F5]`}>
      <div ref={mapContainerRef} className="w-full h-full min-h-[280px]" />

      {/* AberTech Map Zoom Controls */}
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
          {showSectors ? (
            <>
              <div className="flex items-center gap-1.5 font-semibold text-[#0B6758]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#0B6758]" />
                <span>Sector A · Northern Path</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-[#269584]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#269584]" />
                <span>Sector B · Southern Drainage</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#9A690B]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F5A623]" />
                <span>Candidate C-01 (UAV)</span>
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
