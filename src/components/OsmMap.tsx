import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { DataSourceAvailability, GeoPosition, Observation, RadiusRing, SearchRegion } from '../types';
import { SrColors } from './Theme';

// Custom pin marker icon
const createPinIcon = (label?: string) => {
  return L.divIcon({
    className: 'custom-pin-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <svg width="34" height="42" viewBox="0 0 24 32" fill="none">
          <path d="M12 0C5.37 0 0 5.37 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.37 18.63 0 12 0Z" fill="#E5484D" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="12" cy="12" r="5" fill="#FFFFFF"/>
        </svg>
        ${
          label
            ? `<div style="background: rgba(43,43,43,0.9); color: #FFFFFF; font-size: 11px; font-weight: bold; padding: 2px 6px; border-radius: 4px; margin-top: 2px; white-space: nowrap; border: 1px solid rgba(255,255,255,0.3);">${label}</div>`
            : ''
        }
      </div>
    `,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
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
  className?: string;
  showLegend?: boolean;
}

export const OsmMap: React.FC<OsmMapProps> = ({
  center,
  zoom = 11,
  pin,
  pinLabel,
  onPinChange,
  isPicker = false,
  rings = [],
  regions = [],
  dataSources = [],
  className = 'h-full w-full',
  showLegend = false,
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
        zoomControl: false, // We use custom AberTech zoom controls
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
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
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center if map already exists and center changed significantly
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      const current = mapInstanceRef.current.getCenter();
      const dist = Math.abs(current.lat - center.lat) + Math.abs(current.lng - center.lon);
      if (dist > 0.05) {
        mapInstanceRef.current.setView([center.lat, center.lon], zoom);
      }
    }
  }, [center.lat, center.lon]);

  // Redraw layers (rings, cells, observations, pin)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layerGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();

    // 1. Draw Rings (from largest to smallest)
    const sortedRings = [...rings].sort((a, b) => b.radius_m - a.radius_m);
    const ringAlphas = [0.08, 0.16, 0.28];
    const pinLocation = pin || center;

    sortedRings.forEach((ring, idx) => {
      const fillOpacity = ringAlphas[idx % ringAlphas.length] ?? 0.15;
      const circle = L.circle([pinLocation.lat, pinLocation.lon], {
        radius: ring.radius_m,
        color: SrColors.Violet,
        weight: 2,
        opacity: 0.9,
        fillColor: SrColors.Lavender,
        fillOpacity: fillOpacity,
      });
      circle.bindTooltip(`${(ring.probability * 100).toFixed(0)}% contour (${(ring.radius_m / 1000).toFixed(1)} km)`, {
        permanent: false,
        direction: 'top',
        className: 'bg-[#2B2B2B] text-white border-0 text-xs px-2 py-1 rounded shadow',
      });
      layers.addLayer(circle);
    });

    // 2. Draw Hexagonal Search Cells (Priority regions)
    const topScore = regions[0]?.score || 1.0;
    regions.forEach((region: SearchRegion) => {
      const latlngs = region.cell.boundary.map((p: GeoPosition) => [p.lat, p.lon] as [number, number]);
      const strength = Math.min(1.0, Math.max(0.2, region.score / topScore));

      const polygon = L.polygon(latlngs, {
        color: SrColors.Sun,
        weight: 2,
        opacity: 0.95,
        fillColor: SrColors.Sun,
        fillOpacity: 0.15 + 0.45 * strength,
      });

      polygon.bindTooltip(
        `#${region.rank} · ${region.sector} · ${(region.score * 100).toFixed(1)}%<br/>Terrain: ${region.cell.terrain.toLowerCase()}`,
        {
          permanent: false,
          sticky: true,
          className: 'bg-[#2B2B2B] text-white border border-[#F2D06B] text-xs px-2 py-1 rounded shadow',
        }
      );
      layers.addLayer(polygon);
    });

    // 3. Draw Data Sources footprints (UAV and Dashcam)
    dataSources.forEach((source: DataSourceAvailability) => {
      const color =
        source.source === 'UAV'
          ? SrColors.Uav
          : source.source === 'DASHCAM'
          ? SrColors.Dashcam
          : SrColors.Satellite;

      source.observations.slice(0, 10).forEach((obs: Observation) => {
        if (source.source === 'SATELLITE') return; // satellite scenes cover massive areas
        if (obs.footprint && obs.footprint.length >= 3) {
          const latlngs = obs.footprint.map((p: GeoPosition) => [p.lat, p.lon] as [number, number]);
          const footprintPoly = L.polygon(latlngs, {
            color: color,
            weight: 2,
            opacity: 0.9,
            fillColor: color,
            fillOpacity: 0.28,
          });
          footprintPoly.bindTooltip(`${obs.source}: ${obs.platform_id}`, {
            sticky: true,
            className: 'bg-[#2B2B2B] text-white text-xs px-2 py-1 rounded shadow',
          });
          layers.addLayer(footprintPoly);
        }
      });
    });

    // 4. Draw Pin Marker
    if (pin) {
      const marker = L.marker([pin.lat, pin.lon], {
        icon: createPinIcon(pinLabel),
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

    // Fit bounds if we have priority cells or rings and it's a results view
    if (!isPicker && rings.length > 0 && mapInstanceRef.current) {
      const outerRing = sortedRings[0];
      if (outerRing) {
        const bounds = L.latLng([pinLocation.lat, pinLocation.lon]).toBounds(outerRing.radius_m * 2.2);
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [pin?.lat, pin?.lon, pinLabel, rings, regions, dataSources, isPicker]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div className={`relative ${className} overflow-hidden`}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* AberTech Zoom Pill */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-[400] flex flex-col items-center bg-[#E6DEF5] rounded-2xl p-1.5 shadow-xl gap-2">
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-10 h-10 rounded-full bg-[#383838] hover:bg-[#484848] text-white flex items-center justify-center font-bold text-xl shadow active:scale-95 transition-all"
          title="Zoom In"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-10 h-10 rounded-full bg-[#383838] hover:bg-[#484848] text-white flex items-center justify-center font-bold text-xl shadow active:scale-95 transition-all"
          title="Zoom Out"
        >
          –
        </button>
      </div>

      {/* Map Legend */}
      {showLegend && (
        <div className="absolute left-3 bottom-3 z-[400] bg-[#2B2B2B]/90 backdrop-blur rounded-lg px-2.5 py-1.5 shadow-lg border border-white/10 flex flex-col gap-1 text-[11px] text-white">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6B5AA6] inline-block shrink-0" />
            <span>50 / 75 / 95 % wander rings</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F2D06B] inline-block shrink-0" />
            <span>Priority search cells</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F5A623] inline-block shrink-0" />
            <span>Dashcam passes</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#86EFAC] inline-block shrink-0" />
            <span>UAV flight strips</span>
          </div>
        </div>
      )}
    </div>
  );
};
