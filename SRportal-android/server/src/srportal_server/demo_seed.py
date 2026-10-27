"""Seeds the index with plausible metadata around the demo centre, relative to "now".

The seeded rows have the same shape the real feeds produce, so a demo exercises the exact
query path that hexcover, video-zarr and frame-extract outputs will.
"""

from __future__ import annotations

import random
from datetime import datetime, time, timedelta, timezone

from .config import DemoConfig
from .db import Database
from .geo import circle, destination
from .ingest import ingest_hexcover, ingest_zarr
from .models import (
    DataSourceKind,
    GeoPosition,
    HexcoverCellIngest,
    HexcoverIngest,
    SceneIngest,
    TrackPoint,
    ZarrIngest,
    ZarrStoreIngest,
)
from .timeutil import format_utc

DASHCAM_SCHEDULE = ((0, time(8, 30)), (1, time(12, 0)), (0, time(17, 15)), (2, time(19, 40)))
MAX_DAYS = 90


def seed_demo(db: Database, config: DemoConfig, now: datetime) -> dict[str, int]:
    """Replace the index with `days_back` days of demo scenes and video tracks."""
    db.clear_index()
    rng = random.Random(42)
    days = [now.date() - timedelta(days=i) for i in range(min(config.days_back, MAX_DAYS), -1, -1)]
    scenes = ingest_hexcover(db, _satellite_scenes(config, days, rng))
    stores = ingest_zarr(db, ZarrIngest(stores=_uav_stores(config, days, rng) + _dashcam_stores(config, days, rng)))
    return {"eo_scenes": scenes, "video_index": stores}


def _satellite_scenes(config: DemoConfig, days: list, rng: random.Random) -> HexcoverIngest:
    """Sentinel-2 every third day, Sentinel-1 every sixth, PlanetScope daily."""
    scenes: list[SceneIngest] = []
    for day in days:
        ordinal = day.toordinal()
        if ordinal % 3 == 0:
            at = datetime.combine(day, time(11, 11), tzinfo=timezone.utc)
            cloud = 10.0 + rng.randint(0, 85)
            scenes.append(
                SceneIngest(
                    platform="Sentinel-2A" if rng.random() < 0.5 else "Sentinel-2B",
                    observed_at_utc=format_utc(at),
                    cloud_cover_pct=cloud,
                    zarr_uri=f"s3://cdse-demo/sentinel-2/T30UVD/{int(at.timestamp())}.zarr",
                    footprint=_square(config, 50_000.0),
                    note="10 m optical; vehicle-scale change detection" if cloud < 60 else "Cloud cover too high for optical use",
                )
            )
        if ordinal % 6 == 1:
            at = datetime.combine(day, time(6, 24), tzinfo=timezone.utc)
            scenes.append(
                SceneIngest(
                    platform="Sentinel-1A",
                    observed_at_utc=format_utc(at),
                    cloud_cover_pct=None,
                    zarr_uri=f"s3://cdse-demo/sentinel-1/IW_GRDH/{int(at.timestamp())}.zarr",
                    footprint=_square(config, 90_000.0),
                    note="C-band SAR, all-weather; bright targets such as vehicles only",
                )
            )
        at = datetime.combine(day, time(10, 32), tzinfo=timezone.utc)
        cloud = 5.0 + rng.randint(0, 89)
        scenes.append(
            SceneIngest(
                platform="PlanetScope",
                observed_at_utc=format_utc(at),
                cloud_cover_pct=cloud,
                zarr_uri=f"s3://planet-demo/psscene/{int(at.timestamp())}.zarr",
                footprint=_square(config, 12_000.0),
                note="3 m optical; tasking of higher resolution possible" if cloud < 50 else "Mostly cloud; request re-task",
            )
        )
    cell = HexcoverCellIngest(cell_id="demo-region", centre=GeoPosition(lat=config.centre_lat, lon=config.centre_lon), scenes=scenes)
    return HexcoverIngest(cells=[cell])


def _uav_stores(config: DemoConfig, days: list, rng: random.Random) -> list[ZarrStoreIngest]:
    """A routine survey flight every other day: a 20-minute strip a few kilometres from the centre."""
    stores: list[ZarrStoreIngest] = []
    for day in days:
        if day.toordinal() % 2 != 0:
            continue
        start = datetime.combine(day, time(13, 0), tzinfo=timezone.utc)
        bearing = rng.uniform(0.0, 360.0)
        strip_lat, strip_lon = destination(config.centre_lat, config.centre_lon, bearing, rng.uniform(800.0, 4_500.0))
        heading = rng.uniform(0.0, 180.0)
        track = []
        for step in range(0, 1_200, 20):
            along = (step / 1_200.0 - 0.5) * 1_600.0
            lat, lon = destination(strip_lat, strip_lon, heading, along)
            track.append(TrackPoint(t_utc=format_utc(start + timedelta(seconds=step)), lat=lat, lon=lon))
        stores.append(
            ZarrStoreIngest(
                zarr_uri=f"gs://srportal-demo/uav/{config.uav_platform}_{day.isoformat()}T1300.zarr",
                source=DataSourceKind.UAV,
                platform=config.uav_platform,
                start_utc=format_utc(start),
                fps=30.0,
                track=track,
                note="Routine 120 m AGL survey strip; 2 cm GSD",
            )
        )
    return stores


def _dashcam_stores(config: DemoConfig, days: list, rng: random.Random) -> list[ZarrStoreIngest]:
    """Daily passes along a mountain road that runs past the demo centre."""
    road_bearing = rng.uniform(0.0, 360.0)
    road_lat, road_lon = destination(config.centre_lat, config.centre_lon, road_bearing, rng.uniform(900.0, 3_000.0))
    along_bearing = road_bearing + 90.0
    vehicles = list(config.dashcam_vehicles) or ["CAR01"]
    stores: list[ZarrStoreIngest] = []
    for day in days:
        for vehicle_index, at_time in DASHCAM_SCHEDULE:
            vehicle = vehicles[vehicle_index % len(vehicles)]
            start = datetime.combine(day, at_time, tzinfo=timezone.utc)
            direction = 1.0 if rng.random() < 0.5 else -1.0
            track = []
            for step in range(0, 300, 5):
                along = direction * (step - 150) * 13.0
                lat, lon = destination(road_lat, road_lon, along_bearing, along)
                track.append(TrackPoint(t_utc=format_utc(start + timedelta(seconds=step)), lat=lat, lon=lon))
            stamp = day.strftime("%Y%m%d") + "_" + at_time.strftime("%H%M%S")
            stores.append(
                ZarrStoreIngest(
                    zarr_uri=f"gs://srportal-demo/dashcam/{vehicle}_{stamp}_CAM01.zarr",
                    source=DataSourceKind.DASHCAM,
                    platform=vehicle,
                    start_utc=format_utc(start),
                    fps=30.0,
                    track=track,
                    note="Forward camera; GPX-tagged frame manifest",
                )
            )
    return stores


def _square(config: DemoConfig, half_size_m: float) -> list[GeoPosition]:
    """Four-corner footprint around the demo centre."""
    return [GeoPosition(lat=p[0], lon=p[1]) for p in circle(config.centre_lat, config.centre_lon, half_size_m, 4)]
