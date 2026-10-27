"""Weather at the pin: Open-Meteo when reachable, deterministic demo values otherwise."""

from __future__ import annotations

import hashlib
import logging

import httpx

from .config import WeatherConfig
from .geo import sun_elevation_deg
from .models import WeatherSnapshot

LOGGER = logging.getLogger(__name__)
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


def current_weather(config: WeatherConfig, lat: float, lon: float, epoch_seconds: float) -> WeatherSnapshot:
    """Live conditions when the provider is Open-Meteo and answers in time, else demo values."""
    daylight = sun_elevation_deg(lat, lon, epoch_seconds) > 0.0
    if config.provider == "open-meteo":
        live = _open_meteo(config, lat, lon, daylight)
        if live is not None:
            return live
    return demo_weather(lat, lon, epoch_seconds, daylight)


def demo_weather(lat: float, lon: float, epoch_seconds: float, daylight: bool) -> WeatherSnapshot:
    """Plausible upland-Wales conditions derived from the position and the hour."""
    seed = hashlib.sha256(f"{lat:.3f}:{lon:.3f}:{int(epoch_seconds // 3600)}".encode()).digest()
    wind = 4.0 + seed[0] / 255.0 * 9.0
    return WeatherSnapshot(
        wind_ms=round(wind, 1),
        gust_ms=round(wind + 2.0 + seed[1] / 255.0 * 4.0, 1),
        precipitation_mm_h=round(seed[2] / 255.0 * 3.2, 1),
        visibility_m=float(800 + int(seed[3] / 255.0 * 8200)),
        temperature_c=round(3.0 + seed[4] / 255.0 * 11.0, 1),
        cloud_cover_pct=float(35 + int(seed[5] / 255.0 * 60)),
        daylight=daylight,
        source="demo",
    )


def _open_meteo(config: WeatherConfig, lat: float, lon: float, daylight: bool) -> WeatherSnapshot | None:
    """One request to Open-Meteo; None on any failure so the caller can fall back."""
    params = {
        "latitude": f"{lat:.4f}",
        "longitude": f"{lon:.4f}",
        "current": "temperature_2m,precipitation,cloud_cover,wind_speed_10m,wind_gusts_10m,is_day",
        "hourly": "visibility",
        "forecast_days": "1",
        "wind_speed_unit": "ms",
        "timezone": "UTC",
    }
    try:
        response = httpx.get(OPEN_METEO_URL, params=params, timeout=config.timeout_seconds)
        response.raise_for_status()
        payload = response.json()
        current = payload["current"]
        visibility = _current_visibility(payload)
        return WeatherSnapshot(
            wind_ms=float(current["wind_speed_10m"]),
            gust_ms=float(current.get("wind_gusts_10m", current["wind_speed_10m"])),
            precipitation_mm_h=float(current.get("precipitation", 0.0)),
            visibility_m=visibility,
            temperature_c=float(current["temperature_2m"]),
            cloud_cover_pct=float(current.get("cloud_cover", 0.0)),
            daylight=bool(current.get("is_day", daylight)),
            source="open-meteo",
        )
    except Exception as error:
        LOGGER.warning("Open-Meteo unavailable, using demo weather: %s", error)
        return None


def _current_visibility(payload: dict) -> float:
    """Visibility for the current hour from the hourly series, 10 km when absent."""
    hourly = payload.get("hourly", {})
    times = hourly.get("time", [])
    values = hourly.get("visibility", [])
    current_time = str(payload.get("current", {}).get("time", ""))[:13]
    for index, stamp in enumerate(times):
        if str(stamp)[:13] == current_time and index < len(values) and values[index] is not None:
            return float(values[index])
    return 10_000.0
