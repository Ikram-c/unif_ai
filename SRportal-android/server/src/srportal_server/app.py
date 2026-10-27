"""FastAPI application: the endpoints every button in the app calls."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query

from . import __version__
from .config import AppConfig, load_config
from .db import Database
from .demo_seed import seed_demo
from .detector import UnknownObservation
from .detector import status as detector_status
from .detector import trigger as detector_trigger
from .geocode import search as geocode_search
from .ingest import ingest_dashcam_manifest, ingest_hexcover, ingest_zarr
from .models import (
    DashcamManifestIngest,
    HexcoverIngest,
    IngestResult,
    Observation,
    Place,
    Rescue,
    SearchDataBundle,
    SearchWindowRequest,
    ServerHealth,
    ZarrIngest,
)
from .query import search_window
from .timeutil import format_utc, now_utc

LOGGER = logging.getLogger(__name__)


def create_app(config: AppConfig | None = None, database: Database | None = None) -> FastAPI:
    """Build the app; tests inject an in-memory database and a config without network providers."""
    app_config = config or load_config()
    db = database or Database(Path(app_config.server.database_path))

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        if app_config.server.seed_demo_on_start and db.row_counts()["eo_scenes"] == 0:
            written = seed_demo(db, app_config.demo, now_utc())
            LOGGER.info("Seeded demo index: %s", written)
        yield
        db.close()

    app = FastAPI(title="Search and Rescue Portal server", version=__version__, lifespan=lifespan)
    app.state.config = app_config
    app.state.db = db

    @app.get("/health", response_model=ServerHealth)
    def health() -> ServerHealth:
        """Liveness plus row counts; the app's status bar polls this."""
        return ServerHealth(status="ok", version=__version__, db_rows=db.row_counts())

    @app.get("/rescues", response_model=list[Rescue])
    def list_rescues() -> list[dict[str, Any]]:
        """Every stored case, newest first."""
        return db.list_rescues()

    @app.get("/rescues/{rescue_id}", response_model=Rescue)
    def get_rescue(rescue_id: str) -> dict[str, Any]:
        """One case."""
        document = db.get_rescue(rescue_id)
        if document is None:
            raise HTTPException(status_code=404, detail="rescue not found")
        return document

    @app.put("/rescues/{rescue_id}", response_model=Rescue)
    def put_rescue(rescue_id: str, rescue: Rescue) -> dict[str, Any]:
        """Create or replace a case; the app calls this after every change."""
        if rescue.id != rescue_id:
            raise HTTPException(status_code=400, detail="id in path and body differ")
        document = rescue.model_dump(mode="json")
        db.upsert_rescue(rescue_id, document, format_utc(now_utc()))
        return document

    @app.post("/search-window", response_model=SearchDataBundle)
    def post_search_window(request: SearchWindowRequest) -> SearchDataBundle:
        """"Begin AI Model": cells, observations in the window, weather at the pin."""
        try:
            return search_window(db, app_config, request)
        except ValueError as error:
            raise HTTPException(status_code=422, detail=str(error)) from error

    @app.post("/rescues/{rescue_id}/observations/{observation_id}/detect", response_model=Observation)
    def post_detect(rescue_id: str, observation_id: str) -> Observation:
        """Queue the small-object detector for one observation."""
        try:
            return detector_trigger(db, app_config.detector, rescue_id, observation_id, now_utc().timestamp())
        except UnknownObservation as error:
            raise HTTPException(status_code=404, detail="observation not found for rescue") from error

    @app.get("/rescues/{rescue_id}/observations/{observation_id}", response_model=Observation)
    def get_observation(rescue_id: str, observation_id: str) -> Observation:
        """Observation with its current detector status."""
        try:
            return detector_status(db, app_config.detector, rescue_id, observation_id, now_utc().timestamp())
        except UnknownObservation as error:
            raise HTTPException(status_code=404, detail="observation not found for rescue") from error

    @app.get("/geocode", response_model=list[Place])
    def get_geocode(q: str = Query(default="", max_length=120)) -> list[Place]:
        """Place search for the map bar."""
        return geocode_search(app_config.geocode, q)

    @app.post("/ingest/hexcover", response_model=IngestResult)
    def post_ingest_hexcover(payload: HexcoverIngest) -> IngestResult:
        """Index EO scene availability from a hexcover run."""
        return IngestResult(inserted=ingest_hexcover(db, payload), table="eo_scenes")

    @app.post("/ingest/zarr", response_model=IngestResult)
    def post_ingest_zarr(payload: ZarrIngest) -> IngestResult:
        """Index OME-Zarr video stores with their telemetry tracks."""
        return IngestResult(inserted=ingest_zarr(db, payload), table="video_index")

    @app.post("/ingest/dashcam-manifest", response_model=IngestResult)
    def post_ingest_dashcam(payload: DashcamManifestIngest) -> IngestResult:
        """Index dashcam frame manifests (frame-extract output)."""
        return IngestResult(inserted=ingest_dashcam_manifest(db, payload), table="video_index")

    @app.post("/seed-demo")
    def post_seed_demo() -> dict[str, int]:
        """Rebuild the demo index relative to the current time."""
        return seed_demo(db, app_config.demo, now_utc())

    return app
