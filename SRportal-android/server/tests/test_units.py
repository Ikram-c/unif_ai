"""Unit checks for the geometry, cells and config helpers."""

from __future__ import annotations

import math
from pathlib import Path

from srportal_server import cells as cells_module
from srportal_server.config import CellsConfig, load_config
from srportal_server.geo import circle, destination, distance_m, polygon_area_km2, sun_elevation_deg
from srportal_server.timeutil import format_utc, parse_utc


def test_distance_and_destination_agree():
    lat, lon = destination(52.4153, -4.0829, 135.0, 5_000.0)
    assert abs(distance_m(52.4153, -4.0829, lat, lon) - 5_000.0) < 1.0


def test_circle_area_is_close_to_pi_r_squared():
    ring = circle(52.4, -4.0, 1_000.0, 120)
    assert abs(polygon_area_km2(ring) - math.pi) < 0.02


def test_sun_is_up_at_noon_in_june():
    noon = parse_utc("2026-06-21T12:00:00Z").timestamp()
    midnight = parse_utc("2026-06-21T00:30:00Z").timestamp()
    assert sun_elevation_deg(52.3, -3.76, noon) > 55.0
    assert sun_elevation_deg(52.3, -3.76, midnight) < 0.0


def test_time_format_round_trips_offsets():
    assert format_utc(parse_utc("2026-09-25T13:00:00+01:00")) == "2026-09-25T12:00:00Z"
    assert format_utc(parse_utc("2026-09-25T12:00:00Z")) == "2026-09-25T12:00:00Z"


def test_cells_respect_budget_for_every_radius():
    config = CellsConfig(max_cells=400)
    for radius in (500.0, 3_000.0, 12_000.0, 60_000.0):
        cells, source = cells_module.cover(config, 52.295, -3.76, radius)
        assert 7 <= len(cells) <= 400, (radius, len(cells), source)
        assert len({cell.cell_id for cell in cells}) == len(cells)
        assert all(cell.area_km2 > 0 for cell in cells)


def test_hexgrid_fallback_when_h3_disabled():
    cells, source = cells_module.cover(CellsConfig(use_h3=False), 52.295, -3.76, 3_000.0)
    assert source == "hexgrid"
    assert all(cell.cell_id.startswith("hex:") for cell in cells)


def test_packaged_config_loads():
    config = load_config(Path(__file__).resolve().parents[1] / "config.yaml")
    assert config.server.port == 8000
    assert config.cells.resolutions[0].resolution == 9
    assert config.demo.dashcam_vehicles == ("CAR01", "CAR02", "CAR03")
