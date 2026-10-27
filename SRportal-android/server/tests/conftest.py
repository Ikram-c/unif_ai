"""Shared fixtures: an app on an in-memory database with network providers disabled."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from srportal_server.app import create_app
from srportal_server.config import AppConfig, GeocodeConfig, ServerConfig, WeatherConfig
from srportal_server.db import Database


@pytest.fixture()
def config() -> AppConfig:
    """Offline configuration so tests never touch the network."""
    return AppConfig(
        server=ServerConfig(database_path=":memory:", seed_demo_on_start=True),
        weather=WeatherConfig(provider="demo"),
        geocode=GeocodeConfig(provider="gazetteer"),
    )


@pytest.fixture()
def client(config: AppConfig):
    """Test client whose lifespan seeds the demo index."""
    database = Database(":memory:")
    app = create_app(config, database)
    with TestClient(app) as test_client:
        yield test_client
