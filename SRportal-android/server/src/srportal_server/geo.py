"""Spherical-earth helpers mirroring `Geo.kt` in the app's core module."""

from __future__ import annotations

import math

EARTH_RADIUS_M = 6_371_008.8
METRES_PER_DEGREE_LAT = 111_320.0


def distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in metres."""
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    h = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    h = min(1.0, max(0.0, h))
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(h))


def destination(lat: float, lon: float, bearing_deg: float, distance: float) -> tuple[float, float]:
    """Position reached by travelling `distance` metres along `bearing_deg`."""
    angular = distance / EARTH_RADIUS_M
    brng = math.radians(bearing_deg)
    lat1 = math.radians(lat)
    lon1 = math.radians(lon)
    lat2 = math.asin(math.sin(lat1) * math.cos(angular) + math.cos(lat1) * math.sin(angular) * math.cos(brng))
    lon2 = lon1 + math.atan2(
        math.sin(brng) * math.sin(angular) * math.cos(lat1),
        math.cos(angular) - math.sin(lat1) * math.sin(lat2),
    )
    return math.degrees(lat2), _normalise_lon(math.degrees(lon2))


def offset(lat: float, lon: float, east_m: float, north_m: float) -> tuple[float, float]:
    """Local east/north offset in metres converted to a position."""
    metres_per_degree_lon = METRES_PER_DEGREE_LAT * math.cos(math.radians(lat))
    return lat + north_m / METRES_PER_DEGREE_LAT, _normalise_lon(lon + east_m / metres_per_degree_lon)


def circle(lat: float, lon: float, radius_m: float, segments: int = 32) -> list[tuple[float, float]]:
    """Regular polygon approximating a circle."""
    count = min(360, max(4, segments))
    return [destination(lat, lon, 360.0 * i / count, radius_m) for i in range(count)]


def polygon_area_km2(ring: list[tuple[float, float]]) -> float:
    """Approximate area with a local equirectangular projection."""
    if len(ring) < 3:
        return 0.0
    scale_x = METRES_PER_DEGREE_LAT * math.cos(math.radians(ring[0][0]))
    twice_area = 0.0
    count = len(ring)
    for i in range(count):
        lat1, lon1 = ring[i]
        lat2, lon2 = ring[(i + 1) % count]
        twice_area += (lon1 * scale_x) * (lat2 * METRES_PER_DEGREE_LAT) - (lon2 * scale_x) * (lat1 * METRES_PER_DEGREE_LAT)
    return abs(twice_area) / 2.0 / 1_000_000.0


def sun_elevation_deg(lat: float, lon: float, epoch_seconds: float) -> float:
    """Low-precision solar elevation, the same algorithm as `SolarCalculator.kt`."""
    jd = epoch_seconds / 86_400.0 + 2_440_587.5
    n = jd - 2_451_545.0
    mean_longitude = (280.460 + 0.9856474 * n) % 360.0
    mean_anomaly = math.radians((357.528 + 0.9856003 * n) % 360.0)
    ecliptic_longitude = math.radians(mean_longitude + 1.915 * math.sin(mean_anomaly) + 0.020 * math.sin(2 * mean_anomaly))
    obliquity = math.radians(23.439 - 0.0000004 * n)
    right_ascension = math.atan2(math.cos(obliquity) * math.sin(ecliptic_longitude), math.cos(ecliptic_longitude))
    declination = math.asin(math.sin(obliquity) * math.sin(ecliptic_longitude))
    gmst_hours = (18.697374558 + 24.06570982441908 * n) % 24.0
    local_sidereal_deg = (gmst_hours * 15.0 + lon) % 360.0
    hour_angle = math.radians(local_sidereal_deg) - right_ascension
    lat_rad = math.radians(lat)
    sin_elevation = math.sin(lat_rad) * math.sin(declination) + math.cos(lat_rad) * math.cos(declination) * math.cos(hour_angle)
    return math.degrees(math.asin(min(1.0, max(-1.0, sin_elevation))))


def _normalise_lon(lon: float) -> float:
    """Wrap longitude into [-180, 180]."""
    value = lon
    guard = 0
    while value > 180.0 and guard < 4:
        value -= 360.0
        guard += 1
    while value < -180.0 and guard < 8:
        value += 360.0
        guard += 1
    return value
