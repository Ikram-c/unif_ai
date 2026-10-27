"""API models; field names match the JSON contract of the Android `core` module."""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class GeoPosition(BaseModel):
    """WGS-84 position in decimal degrees."""

    lat: float
    lon: float


class TravelMode(str, Enum):
    """How the missing person was believed to be moving."""

    ON_FOOT = "ON_FOOT"
    VEHICLE = "VEHICLE"
    UNKNOWN = "UNKNOWN"


class DataSourceKind(str, Enum):
    """Remote-sensing sources indexed in the database."""

    SATELLITE = "SATELLITE"
    UAV = "UAV"
    DASHCAM = "DASHCAM"


class DetectionStatus(str, Enum):
    """Progress of the small-object detector job."""

    NOT_RUN = "NOT_RUN"
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    DONE = "DONE"


class Terrain(str, Enum):
    """Dominant land cover of a cell."""

    OPEN_MOORLAND = "OPEN_MOORLAND"
    FOREST = "FOREST"
    MOUNTAIN = "MOUNTAIN"
    FARMLAND = "FARMLAND"
    URBAN = "URBAN"
    WATER = "WATER"
    UNKNOWN = "UNKNOWN"


class SearchCell(BaseModel):
    """One hexagonal search cell."""

    cell_id: str
    centre: GeoPosition
    boundary: list[GeoPosition]
    terrain: Terrain = Terrain.UNKNOWN
    area_km2: float


class Observation(BaseModel):
    """Imagery whose footprint and timestamp fall inside the search window."""

    id: str
    source: DataSourceKind
    platform_id: str
    observed_at_utc: str
    distance_from_pin_m: float
    footprint: list[GeoPosition] = Field(default_factory=list)
    cloud_cover_pct: float | None = None
    zarr_uri: str | None = None
    frame_index: int | None = None
    detection_status: DetectionStatus = DetectionStatus.NOT_RUN
    candidate_count: int = 0
    note: str = ""


class WeatherSnapshot(BaseModel):
    """Weather at the pin."""

    wind_ms: float
    gust_ms: float
    precipitation_mm_h: float
    visibility_m: float
    temperature_c: float
    cloud_cover_pct: float
    daylight: bool
    source: str


class SearchWindowRequest(BaseModel):
    """What the app sends to bound the metadata query."""

    rescue_id: str
    pin: GeoPosition
    last_seen_utc: str
    now_utc: str
    travel_mode: TravelMode
    radius_m: float


class SearchDataBundle(BaseModel):
    """Everything the app's planner needs."""

    cells: list[SearchCell]
    observations: list[Observation]
    weather: WeatherSnapshot
    cell_source: str


class Place(BaseModel):
    """A geocoder hit."""

    name: str
    position: GeoPosition
    region: str = ""


class ServerHealth(BaseModel):
    """Health endpoint payload."""

    status: str
    version: str = ""
    db_rows: dict[str, int] = Field(default_factory=dict)


class Rescue(BaseModel):
    """A rescue case; the plan is stored as produced by the app."""

    id: str
    status: str
    created_at_utc: str
    last_known_location: GeoPosition
    location_label: str = ""
    travel_mode: TravelMode
    last_seen_utc: str
    time_zone: str = "UTC"
    subject: dict[str, Any] = Field(default_factory=dict)
    plan: dict[str, Any] | None = None


class SceneIngest(BaseModel):
    """One EO scene as hexcover's CDSE query reports it."""

    platform: str
    observed_at_utc: str
    cloud_cover_pct: float | None = None
    zarr_uri: str | None = None
    footprint: list[GeoPosition] = Field(default_factory=list)
    note: str = ""


class HexcoverCellIngest(BaseModel):
    """A hexcover cell with the scenes that cover it."""

    cell_id: str
    centre: GeoPosition | None = None
    scenes: list[SceneIngest] = Field(default_factory=list)


class HexcoverIngest(BaseModel):
    """Body of `POST /ingest/hexcover`."""

    cells: list[HexcoverCellIngest]


class TrackPoint(BaseModel):
    """A timestamped position along a video's telemetry track."""

    t_utc: str
    lat: float
    lon: float


class ZarrStoreIngest(BaseModel):
    """One OME-Zarr video store with its telemetry."""

    zarr_uri: str
    source: DataSourceKind
    platform: str
    start_utc: str
    fps: float = 30.0
    track: list[TrackPoint] = Field(default_factory=list)
    note: str = ""


class ZarrIngest(BaseModel):
    """Body of `POST /ingest/zarr`."""

    stores: list[ZarrStoreIngest]


class DashcamManifestIngest(BaseModel):
    """Body of `POST /ingest/dashcam-manifest`: rows of a frame manifest, any column naming."""

    rows: list[dict[str, Any]]
    fps: float = 30.0
    zarr_prefix: str = "gs://srportal/dashcam/"


class IngestResult(BaseModel):
    """Rows written by an ingestion call."""

    inserted: int
    table: str
