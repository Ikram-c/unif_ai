import { GeoPosition } from '../types';

const J2000_EPOCH_JD = 2451545.0;
const UNIX_EPOCH_JD = 2440587.5;
const SECONDS_PER_DAY = 86400.0;

function wrap360(value: number): number {
  const wrapped = value % 360.0;
  return wrapped < 0 ? wrapped + 360.0 : wrapped;
}

function wrap24(value: number): number {
  const wrapped = value % 24.0;
  return wrapped < 0 ? wrapped + 24.0 : wrapped;
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180.0;
}

function radToDeg(rad: number): number {
  return (rad * 180.0) / Math.PI;
}

export const SolarCalculator = {
  elevationDeg(position: GeoPosition, instant: Date): number {
    const epochSecond = instant.getTime() / 1000.0;
    const jd = epochSecond / SECONDS_PER_DAY + UNIX_EPOCH_JD;
    const n = jd - J2000_EPOCH_JD;
    const meanLongitude = wrap360(280.46 + 0.9856474 * n);
    const meanAnomaly = degToRad(wrap360(357.528 + 0.9856003 * n));
    const eclipticLongitude = degToRad(
      meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly)
    );
    const obliquity = degToRad(23.439 - 0.0000004 * n);
    const rightAscension = Math.atan2(
      Math.cos(obliquity) * Math.sin(eclipticLongitude),
      Math.cos(eclipticLongitude)
    );
    const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude));
    const gmstHours = wrap24(18.697374558 + 24.06570982441908 * n);
    const localSiderealDeg = wrap360(gmstHours * 15.0 + position.lon);
    const hourAngle = degToRad(localSiderealDeg) - rightAscension;
    const lat = degToRad(position.lat);
    const sinElevation =
      Math.sin(lat) * Math.sin(declination) +
      Math.cos(lat) * Math.cos(declination) * Math.cos(hourAngle);
    const clamped = Math.min(1.0, Math.max(-1.0, sinElevation));
    return radToDeg(Math.asin(clamped));
  },

  isDaylight(position: GeoPosition, instant: Date): boolean {
    return this.elevationDeg(position, instant) > 0.0;
  },
};
