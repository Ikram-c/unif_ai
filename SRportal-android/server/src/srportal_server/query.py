"""The search-window query: what did any sensor see near the pin between last-seen and now."""

from __future__ import annotations

import json
import math

from .cells import cover
from .config import AppConfig
from .db import Database
from .geo import destination, distance_m
from .models import DataSourceKind, GeoPosition, Observation, SearchDataBundle, SearchWindowRequest
from .timeutil import format_utc, parse_utc
from .weather import current_weather

MAX_OBSERVATIONS_PER_SOURCE = 40
MAX_TRACK_POINTS = 5_000
METRES_PER_DEGREE_LAT = 111_320.0


def search_window(db: Database, config: AppConfig, request: SearchWindowRequest) -> SearchDataBundle:
    """Cells inside the radius, observations inside the window, weather at the pin."""
    last_seen = parse_utc(request.last_seen_utc)
    now = parse_utc(request.now_utc)
    start = format_utc(last_seen)
    end = format_utc(now)
    pin = request.pin
    radius = max(100.0, float(request.radius_m))
    cells, cell_source = cover(config.cells, pin.lat, pin.lon, radius)
    observations = _scene_observations(db, pin, radius, start, end)
    observations.extend(_video_observations(db, pin, radius, start, end))
    weather = current_weather(config.weather, pin.lat, pin.lon, now.timestamp())
    db.store_bundle_observations(request.rescue_id, [item.model_dump() for item in observations])
    return SearchDataBundle(cells=cells, observations=observations, weather=weather, cell_source=cell_source)


def _scene_observations(db: Database, pin: GeoPosition, radius: float, start: str, end: str) -> list[Observation]:
    """Scenes whose footprint disc reaches the search disc."""
    observations: list[Observation] = []
    for scene in db.scenes_between(start, end):
        if len(observations) >= MAX_OBSERVATIONS_PER_SOURCE:
            break
        gap = distance_m(pin.lat, pin.lon, scene["centre_lat"], scene["centre_lon"]) - float(scene["radius_m"])
        if gap > radius:
            continue
        footprint = [GeoPosition(lat=p[0], lon=p[1]) for p in json.loads(scene["footprint_json"])]
        observations.append(
            Observation(
                id=f"scene-{scene['id']}",
                source=DataSourceKind.SATELLITE,
                platform_id=scene["platform"],
                observed_at_utc=scene["observed_at_utc"],
                distance_from_pin_m=max(0.0, gap),
                footprint=footprint,
                cloud_cover_pct=scene["cloud_cover_pct"],
                zarr_uri=scene["zarr_uri"],
                frame_index=None,
                note=scene["note"],
            )
        )
    return observations


def _video_observations(db: Database, pin: GeoPosition, radius: float, start: str, end: str) -> list[Observation]:
    """Closest in-window track point of every video that passed inside the radius."""
    d_lat = radius / METRES_PER_DEGREE_LAT
    d_lon = radius / (METRES_PER_DEGREE_LAT * max(0.05, math.cos(math.radians(pin.lat))))
    per_source: dict[str, int] = {}
    observations: list[Observation] = []
    videos = db.videos_overlapping(start, end, pin.lat - d_lat, pin.lat + d_lat, pin.lon - d_lon, pin.lon + d_lon)
    for video in videos:
        source = str(video["source"])
        if per_source.get(source, 0) >= MAX_OBSERVATIONS_PER_SOURCE:
            continue
        hit = _closest_in_window(video, pin, radius, start, end)
        if hit is None:
            continue
        stamp, distance, index, heading = hit
        fps = float(video["fps"])
        seconds = (parse_utc(stamp) - parse_utc(video["start_utc"])).total_seconds()
        point = json.loads(video["track_json"])[index]
        observations.append(
            Observation(
                id=f"video-{video['id']}",
                source=DataSourceKind(source),
                platform_id=video["platform"],
                observed_at_utc=stamp,
                distance_from_pin_m=distance,
                footprint=_footprint(source, point[1], point[2], heading),
                zarr_uri=video["zarr_uri"],
                frame_index=int(round(max(0.0, seconds) * fps)),
                note=video["note"],
            )
        )
        per_source[source] = per_source.get(source, 0) + 1
    return observations


def _closest_in_window(video: dict, pin: GeoPosition, radius: float, start: str, end: str) -> tuple[str, float, int, float] | None:
    """(timestamp, distance, track index, heading) of the closest in-window point within the radius."""
    track = json.loads(video["track_json"])[:MAX_TRACK_POINTS]
    best: tuple[str, float, int, float] | None = None
    for index, point in enumerate(track):
        stamp = str(point[0])
        if stamp < start or stamp > end:
            continue
        distance = distance_m(pin.lat, pin.lon, float(point[1]), float(point[2]))
        if distance > radius:
            continue
        if best is None or distance < best[1]:
            best = (stamp, distance, index, _heading(track, index))
    return best


def _heading(track: list, index: int) -> float:
    """Bearing of travel at a track index, from the neighbouring points."""
    previous = track[max(0, index - 1)]
    following = track[min(len(track) - 1, index + 1)]
    d_lat = float(following[1]) - float(previous[1])
    d_lon = (float(following[2]) - float(previous[2])) * math.cos(math.radians(float(previous[1])))
    if d_lat == 0.0 and d_lon == 0.0:
        return 0.0
    return (math.degrees(math.atan2(d_lon, d_lat)) + 360.0) % 360.0


def _footprint(source: str, lat: float, lon: float, heading: float) -> list[GeoPosition]:
    """A forward-camera wedge for dashcams, a nadir strip for UAVs."""
    if source == DataSourceKind.DASHCAM.value:
        corners = [
            (lat, lon),
            destination(lat, lon, heading - 35.0, 120.0),
            destination(lat, lon, heading, 132.0),
            destination(lat, lon, heading + 35.0, 120.0),
        ]
    else:
        ahead = destination(lat, lon, heading, 400.0)
        behind = destination(lat, lon, heading + 180.0, 400.0)
        corners = [
            destination(ahead[0], ahead[1], heading + 90.0, 100.0),
            destination(behind[0], behind[1], heading + 90.0, 100.0),
            destination(behind[0], behind[1], heading - 90.0, 100.0),
            destination(ahead[0], ahead[1], heading - 90.0, 100.0),
        ]
    return [GeoPosition(lat=p[0], lon=p[1]) for p in corners]
