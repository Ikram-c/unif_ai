"""YAML-driven, immutable configuration."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml

DEFAULT_CONFIG_PATH = Path(__file__).resolve().parents[2] / "config.yaml"


@dataclass(frozen=True)
class ServerConfig:
    """Bind address, database file and start-up seeding."""

    host: str = "0.0.0.0"
    port: int = 8000
    database_path: str = "srportal.db"
    seed_demo_on_start: bool = True


@dataclass(frozen=True)
class ResolutionRule:
    """Use `resolution` when the search radius is at most `max_radius_m`."""

    max_radius_m: float
    resolution: int


@dataclass(frozen=True)
class CellsConfig:
    """How search cells are generated."""

    use_h3: bool = True
    max_cells: int = 400
    resolutions: tuple[ResolutionRule, ...] = (
        ResolutionRule(2500.0, 9),
        ResolutionRule(7000.0, 8),
        ResolutionRule(25000.0, 7),
        ResolutionRule(100000.0, 6),
    )


@dataclass(frozen=True)
class WeatherConfig:
    """Weather provider selection."""

    provider: str = "open-meteo"
    timeout_seconds: float = 4.0


@dataclass(frozen=True)
class GeocodeConfig:
    """Geocoder selection."""

    provider: str = "nominatim"
    timeout_seconds: float = 4.0
    user_agent: str = "srportal-mvp/0.1"


@dataclass(frozen=True)
class DetectorConfig:
    """Simulated detector job timings."""

    queued_seconds: float = 3.0
    running_seconds: float = 6.0
    max_candidates: int = 3


@dataclass(frozen=True)
class DemoConfig:
    """Where and how the demo metadata is seeded."""

    centre_lat: float = 52.2950
    centre_lon: float = -3.7600
    days_back: int = 14
    dashcam_vehicles: tuple[str, ...] = ("CAR01", "CAR02", "CAR03")
    uav_platform: str = "UAV-LITTER-SURVEY-03"


@dataclass(frozen=True)
class AppConfig:
    """Top-level configuration tree."""

    server: ServerConfig = field(default_factory=ServerConfig)
    cells: CellsConfig = field(default_factory=CellsConfig)
    weather: WeatherConfig = field(default_factory=WeatherConfig)
    geocode: GeocodeConfig = field(default_factory=GeocodeConfig)
    detector: DetectorConfig = field(default_factory=DetectorConfig)
    demo: DemoConfig = field(default_factory=DemoConfig)


def load_config(path: Path | None = None) -> AppConfig:
    """Read the YAML file at `path` (or the packaged default) into an `AppConfig`.

    Missing sections fall back to the dataclass defaults, so a partial file is valid.
    """
    config_path = path or DEFAULT_CONFIG_PATH
    if not config_path.exists():
        return AppConfig()
    with config_path.open("r", encoding="utf-8") as handle:
        raw: dict[str, Any] = yaml.safe_load(handle) or {}
    return AppConfig(
        server=ServerConfig(**raw.get("server", {})),
        cells=_cells_config(raw.get("cells", {})),
        weather=WeatherConfig(**raw.get("weather", {})),
        geocode=GeocodeConfig(**raw.get("geocode", {})),
        detector=DetectorConfig(**raw.get("detector", {})),
        demo=_demo_config(raw.get("demo", {})),
    )


def _cells_config(raw: dict[str, Any]) -> CellsConfig:
    """Build `CellsConfig`, converting the resolution table into rules."""
    rules = raw.get("resolutions")
    if rules is None:
        return CellsConfig(use_h3=raw.get("use_h3", True), max_cells=raw.get("max_cells", 400))
    converted = tuple(ResolutionRule(float(rule["max_radius_m"]), int(rule["resolution"])) for rule in rules)
    return CellsConfig(use_h3=raw.get("use_h3", True), max_cells=raw.get("max_cells", 400), resolutions=converted)


def _demo_config(raw: dict[str, Any]) -> DemoConfig:
    """Build `DemoConfig`, converting YAML lists into tuples."""
    values = dict(raw)
    if "dashcam_vehicles" in values:
        values["dashcam_vehicles"] = tuple(values["dashcam_vehicles"])
    return DemoConfig(**values)
