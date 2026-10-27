"""Turns pipeline outputs into index rows.

Three feeds land here: hexcover's per-cell EO scene availability, OME-Zarr video stores with
their telemetry track (video-zarr), and dashcam frame manifests (frame-extract). Everything is
reduced to two tables, `eo_scenes` and `video_index`, which the search-window query reads.
"""

from __future__ import annotations

import hashlib
import json
from typing import Any

from .db import Database
from .geo import distance_m
from .models import DashcamManifestIngest, GeoPosition, HexcoverIngest, ZarrIngest, ZarrStoreIngest
from .timeutil import format_utc, parse_utc

DEFAULT_SCENE_RADIUS_M = 5_000.0
MAX_TRACK_POINTS = 5_000
VIDEO_ID_COLUMNS = ("video_id", "clip_id", "video", "source_video", "file_stem")
FRAME_COLUMNS = ("frame_index", "frame", "frame_idx", "index")
TIME_COLUMNS = ("timestamp_utc", "timestamp", "time_utc", "time", "t_utc", "datetime")
LAT_COLUMNS = ("lat", "latitude")
LON_COLUMNS = ("lon", "lng", "longitude")


def ingest_hexcover(db: Database, payload: HexcoverIngest) -> int:
    """Store one scene row per (cell, scene) pair; returns the number written."""
    written = 0
    for cell in payload.cells:
        for scene in cell.scenes:
            centre, radius = _footprint_geometry(scene.footprint, cell.centre)
            if centre is None:
                continue
            scene_id = _digest(f"{cell.cell_id}|{scene.platform}|{scene.observed_at_utc}")
            db.upsert_scene(
                {
                    "id": scene_id,
                    "platform": scene.platform,
                    "observed_at_utc": format_utc(parse_utc(scene.observed_at_utc)),
                    "centre_lat": centre.lat,
                    "centre_lon": centre.lon,
                    "radius_m": radius,
                    "footprint_json": json.dumps([[p.lat, p.lon] for p in scene.footprint]),
                    "cloud_cover_pct": scene.cloud_cover_pct,
                    "zarr_uri": scene.zarr_uri,
                    "note": scene.note,
                }
            )
            written += 1
    return written


def ingest_zarr(db: Database, payload: ZarrIngest) -> int:
    """Index each OME-Zarr store by its time span and track bounding box."""
    written = 0
    for store in payload.stores:
        row = video_row(store)
        if row is None:
            continue
        db.upsert_video(row)
        written += 1
    return written


def ingest_dashcam_manifest(db: Database, payload: DashcamManifestIngest) -> int:
    """Group manifest rows by video id and index each group as a video with a track."""
    groups: dict[str, list[dict[str, Any]]] = {}
    for row in payload.rows:
        video_id = _pick(row, VIDEO_ID_COLUMNS)
        if video_id is None:
            continue
        groups.setdefault(str(video_id), []).append(row)
    written = 0
    for video_id, rows in groups.items():
        track = []
        for row in rows[:MAX_TRACK_POINTS]:
            stamp = _pick(row, TIME_COLUMNS)
            lat = _pick(row, LAT_COLUMNS)
            lon = _pick(row, LON_COLUMNS)
            if stamp is None or lat is None or lon is None:
                continue
            try:
                track.append({"t_utc": format_utc(parse_utc(str(stamp))), "lat": float(lat), "lon": float(lon)})
            except (ValueError, TypeError):
                continue
        if not track:
            continue
        store = ZarrStoreIngest(
            zarr_uri=payload.zarr_prefix + video_id + ".zarr",
            source="DASHCAM",
            platform=video_id.split("_")[0],
            start_utc=min(point["t_utc"] for point in track),
            fps=payload.fps,
            track=track,
            note="frame manifest",
        )
        row = video_row(store)
        if row is None:
            continue
        db.upsert_video(row)
        written += 1
    return written


def video_row(store: ZarrStoreIngest) -> dict[str, Any] | None:
    """Database row for one store, or None when it has no usable track."""
    if not store.track:
        return None
    points = sorted(store.track[:MAX_TRACK_POINTS], key=lambda p: p.t_utc)
    start = min(parse_utc(store.start_utc), parse_utc(points[0].t_utc))
    end = parse_utc(points[-1].t_utc)
    lats = [p.lat for p in points]
    lons = [p.lon for p in points]
    return {
        "id": _digest(store.zarr_uri),
        "source": store.source.value if hasattr(store.source, "value") else str(store.source),
        "platform": store.platform,
        "start_utc": format_utc(start),
        "end_utc": format_utc(end),
        "fps": float(store.fps),
        "zarr_uri": store.zarr_uri,
        "track_json": json.dumps([[p.t_utc, p.lat, p.lon] for p in points]),
        "min_lat": min(lats),
        "max_lat": max(lats),
        "min_lon": min(lons),
        "max_lon": max(lons),
        "note": store.note,
    }


def _footprint_geometry(footprint: list[GeoPosition], fallback_centre: GeoPosition | None) -> tuple[GeoPosition | None, float]:
    """Centroid and covering radius of a footprint, or the fallback centre with a default radius."""
    if not footprint:
        return fallback_centre, DEFAULT_SCENE_RADIUS_M
    centre = GeoPosition(lat=sum(p.lat for p in footprint) / len(footprint), lon=sum(p.lon for p in footprint) / len(footprint))
    radius = max(distance_m(centre.lat, centre.lon, p.lat, p.lon) for p in footprint)
    return centre, max(radius, 100.0)


def _pick(row: dict[str, Any], names: tuple[str, ...]) -> Any | None:
    """First present, non-empty value among the candidate column names (case-insensitive)."""
    lowered = {str(key).lower(): value for key, value in row.items()}
    for name in names:
        value = lowered.get(name)
        if value is not None and str(value) != "":
            return value
    return None


def _digest(text: str) -> str:
    """Short stable id."""
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:16]
