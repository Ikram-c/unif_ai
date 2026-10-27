import { GeoPosition } from '../types';

export const EARTH_RADIUS_M = 6371008.8;
const METRES_PER_DEGREE_LAT = 111320.0;
const SECTORS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180.0;
}

function radToDeg(rad: number): number {
  return (rad * 180.0) / Math.PI;
}

function normaliseLon(lon: number): number {
  let value = lon;
  let guard = 0;
  while (value > 180.0 && guard < 4) {
    value -= 360.0;
    guard += 1;
  }
  while (value < -180.0 && guard < 8) {
    value += 360.0;
    guard += 1;
  }
  return value;
}

export const Geo = {
  EARTH_RADIUS_M,

  distanceM(a: GeoPosition, b: GeoPosition): number {
    const dLat = degToRad(b.lat - a.lat);
    const dLon = degToRad(b.lon - a.lon);
    const lat1 = degToRad(a.lat);
    const lat2 = degToRad(b.lat);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const clampedH = Math.min(1.0, Math.max(0.0, h));
    return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(clampedH));
  },

  bearingDeg(from: GeoPosition, to: GeoPosition): number {
    const lat1 = degToRad(from.lat);
    const lat2 = degToRad(to.lat);
    const dLon = degToRad(to.lon - from.lon);
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const deg = radToDeg(Math.atan2(y, x));
    return (deg + 360.0) % 360.0;
  },

  sector(bearingDeg: number): string {
    const index = Math.floor((bearingDeg + 22.5) / 45.0) % SECTORS.length;
    return SECTORS[index];
  },

  destination(origin: GeoPosition, bearingDeg: number, distanceM: number): GeoPosition {
    const angular = distanceM / EARTH_RADIUS_M;
    const brng = degToRad(bearingDeg);
    const lat1 = degToRad(origin.lat);
    const lon1 = degToRad(origin.lon);

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angular) +
        Math.cos(lat1) * Math.sin(angular) * Math.cos(brng)
    );
    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(brng) * Math.sin(angular) * Math.cos(lat1),
        Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2)
      );

    return {
      lat: radToDeg(lat2),
      lon: normaliseLon(radToDeg(lon2)),
    };
  },

  offset(origin: GeoPosition, eastM: number, northM: number): GeoPosition {
    const metresPerDegreeLon = METRES_PER_DEGREE_LAT * Math.cos(degToRad(origin.lat));
    return {
      lat: origin.lat + northM / METRES_PER_DEGREE_LAT,
      lon: normaliseLon(origin.lon + eastM / metresPerDegreeLon),
    };
  },

  areaKm2(ring: GeoPosition[]): number {
    if (ring.length < 3) return 0.0;
    const lat0 = degToRad(ring[0].lat);
    const scaleX = METRES_PER_DEGREE_LAT * Math.cos(lat0);
    let twiceArea = 0.0;
    const n = ring.length;
    for (let i = 0; i < n; i++) {
      const p = ring[i];
      const q = ring[(i + 1) % n];
      const x1 = p.lon * scaleX;
      const y1 = p.lat * METRES_PER_DEGREE_LAT;
      const x2 = q.lon * scaleX;
      const y2 = q.lat * METRES_PER_DEGREE_LAT;
      twiceArea += x1 * y2 - x2 * y1;
    }
    return Math.abs(twiceArea) / 2.0 / 1000000.0;
  },

  circle(centre: GeoPosition, radiusM: number, segments: number = 48): GeoPosition[] {
    const count = Math.min(360, Math.max(6, segments));
    const points: GeoPosition[] = [];
    for (let i = 0; i < count; i++) {
      points.push(Geo.destination(centre, (360.0 * i) / count, radiusM));
    }
    return points;
  },
};
