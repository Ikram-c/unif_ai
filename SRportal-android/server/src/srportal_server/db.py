"""SQLite persistence: rescues, EO scene index, video index, detector jobs.

Deliberately plain `sqlite3`: the pitch is that this is simple database work, and the schema
is what a consultant would lift into Postgres / PostGIS or DuckDB later.
"""

from __future__ import annotations

import json
import sqlite3
import threading
from pathlib import Path
from typing import Any

SCHEMA = """
CREATE TABLE IF NOT EXISTS rescues (
    id TEXT PRIMARY KEY,
    document TEXT NOT NULL,
    updated_at_utc TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS eo_scenes (
    id TEXT PRIMARY KEY,
    platform TEXT NOT NULL,
    observed_at_utc TEXT NOT NULL,
    centre_lat REAL NOT NULL,
    centre_lon REAL NOT NULL,
    radius_m REAL NOT NULL,
    footprint_json TEXT NOT NULL,
    cloud_cover_pct REAL,
    zarr_uri TEXT,
    note TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS eo_scenes_time ON eo_scenes (observed_at_utc);
CREATE TABLE IF NOT EXISTS video_index (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    platform TEXT NOT NULL,
    start_utc TEXT NOT NULL,
    end_utc TEXT NOT NULL,
    fps REAL NOT NULL,
    zarr_uri TEXT NOT NULL,
    track_json TEXT NOT NULL,
    min_lat REAL NOT NULL,
    max_lat REAL NOT NULL,
    min_lon REAL NOT NULL,
    max_lon REAL NOT NULL,
    note TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS video_index_time ON video_index (start_utc, end_utc);
CREATE TABLE IF NOT EXISTS bundle_observations (
    rescue_id TEXT NOT NULL,
    observation_id TEXT NOT NULL,
    document TEXT NOT NULL,
    PRIMARY KEY (rescue_id, observation_id)
);
CREATE TABLE IF NOT EXISTS detector_jobs (
    rescue_id TEXT NOT NULL,
    observation_id TEXT NOT NULL,
    queued_at_epoch REAL NOT NULL,
    PRIMARY KEY (rescue_id, observation_id)
);
"""

TABLES = ("rescues", "eo_scenes", "video_index", "bundle_observations", "detector_jobs")


class Database:
    """Thread-safe wrapper around one SQLite file."""

    def __init__(self, path: str | Path) -> None:
        self._path = str(path)
        self._lock = threading.Lock()
        self._connection = sqlite3.connect(self._path, check_same_thread=False)
        self._connection.row_factory = sqlite3.Row
        with self._lock:
            self._connection.executescript(SCHEMA)
            self._connection.commit()

    def close(self) -> None:
        """Close the underlying connection."""
        with self._lock:
            self._connection.close()

    def row_counts(self) -> dict[str, int]:
        """Row count per table, for the health endpoint."""
        counts: dict[str, int] = {}
        with self._lock:
            for table in TABLES:
                row = self._connection.execute(f"SELECT COUNT(*) AS n FROM {table}").fetchone()
                counts[table] = int(row["n"])
        return counts

    def upsert_rescue(self, rescue_id: str, document: dict[str, Any], updated_at_utc: str) -> None:
        """Insert or replace a rescue document."""
        with self._lock:
            self._connection.execute(
                "INSERT OR REPLACE INTO rescues (id, document, updated_at_utc) VALUES (?, ?, ?)",
                (rescue_id, json.dumps(document), updated_at_utc),
            )
            self._connection.commit()

    def get_rescue(self, rescue_id: str) -> dict[str, Any] | None:
        """One rescue document or None."""
        with self._lock:
            row = self._connection.execute("SELECT document FROM rescues WHERE id = ?", (rescue_id,)).fetchone()
        return json.loads(row["document"]) if row else None

    def list_rescues(self) -> list[dict[str, Any]]:
        """All rescue documents, newest first."""
        with self._lock:
            rows = self._connection.execute("SELECT document FROM rescues ORDER BY updated_at_utc DESC").fetchall()
        return [json.loads(row["document"]) for row in rows]

    def upsert_scene(self, scene: dict[str, Any]) -> None:
        """Insert or replace an EO scene row."""
        with self._lock:
            self._connection.execute(
                """
                INSERT OR REPLACE INTO eo_scenes
                (id, platform, observed_at_utc, centre_lat, centre_lon, radius_m, footprint_json, cloud_cover_pct, zarr_uri, note)
                VALUES (:id, :platform, :observed_at_utc, :centre_lat, :centre_lon, :radius_m, :footprint_json, :cloud_cover_pct, :zarr_uri, :note)
                """,
                scene,
            )
            self._connection.commit()

    def scenes_between(self, start_utc: str, end_utc: str) -> list[dict[str, Any]]:
        """EO scenes observed inside the window, inclusive."""
        with self._lock:
            rows = self._connection.execute(
                "SELECT * FROM eo_scenes WHERE observed_at_utc >= ? AND observed_at_utc <= ? ORDER BY observed_at_utc DESC",
                (start_utc, end_utc),
            ).fetchall()
        return [dict(row) for row in rows]

    def upsert_video(self, video: dict[str, Any]) -> None:
        """Insert or replace a video index row."""
        with self._lock:
            self._connection.execute(
                """
                INSERT OR REPLACE INTO video_index
                (id, source, platform, start_utc, end_utc, fps, zarr_uri, track_json, min_lat, max_lat, min_lon, max_lon, note)
                VALUES (:id, :source, :platform, :start_utc, :end_utc, :fps, :zarr_uri, :track_json, :min_lat, :max_lat, :min_lon, :max_lon, :note)
                """,
                video,
            )
            self._connection.commit()

    def videos_overlapping(self, start_utc: str, end_utc: str, min_lat: float, max_lat: float, min_lon: float, max_lon: float) -> list[dict[str, Any]]:
        """Videos whose time span and bounding box both intersect the query."""
        with self._lock:
            rows = self._connection.execute(
                """
                SELECT * FROM video_index
                WHERE end_utc >= ? AND start_utc <= ?
                  AND max_lat >= ? AND min_lat <= ? AND max_lon >= ? AND min_lon <= ?
                ORDER BY start_utc DESC
                """,
                (start_utc, end_utc, min_lat, max_lat, min_lon, max_lon),
            ).fetchall()
        return [dict(row) for row in rows]

    def store_bundle_observations(self, rescue_id: str, observations: list[dict[str, Any]]) -> None:
        """Remember the observations returned for a rescue so detector calls can address them."""
        with self._lock:
            self._connection.executemany(
                "INSERT OR REPLACE INTO bundle_observations (rescue_id, observation_id, document) VALUES (?, ?, ?)",
                [(rescue_id, item["id"], json.dumps(item)) for item in observations],
            )
            self._connection.commit()

    def get_bundle_observation(self, rescue_id: str, observation_id: str) -> dict[str, Any] | None:
        """One stored observation or None."""
        with self._lock:
            row = self._connection.execute(
                "SELECT document FROM bundle_observations WHERE rescue_id = ? AND observation_id = ?",
                (rescue_id, observation_id),
            ).fetchone()
        return json.loads(row["document"]) if row else None

    def queue_detector_job(self, rescue_id: str, observation_id: str, queued_at_epoch: float) -> None:
        """Record a detector trigger, keeping the first trigger time on repeats."""
        with self._lock:
            self._connection.execute(
                "INSERT OR IGNORE INTO detector_jobs (rescue_id, observation_id, queued_at_epoch) VALUES (?, ?, ?)",
                (rescue_id, observation_id, queued_at_epoch),
            )
            self._connection.commit()

    def detector_job(self, rescue_id: str, observation_id: str) -> float | None:
        """Trigger time of a job or None when never triggered."""
        with self._lock:
            row = self._connection.execute(
                "SELECT queued_at_epoch FROM detector_jobs WHERE rescue_id = ? AND observation_id = ?",
                (rescue_id, observation_id),
            ).fetchone()
        return float(row["queued_at_epoch"]) if row else None

    def clear_index(self) -> None:
        """Drop every indexed scene and video, used before re-seeding."""
        with self._lock:
            self._connection.execute("DELETE FROM eo_scenes")
            self._connection.execute("DELETE FROM video_index")
            self._connection.commit()
