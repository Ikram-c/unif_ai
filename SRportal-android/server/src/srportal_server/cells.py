"""Search cells: real H3 cells when the library is available, a hex tiling otherwise."""

from __future__ import annotations

import math

from .config import CellsConfig
from .geo import distance_m, offset, polygon_area_km2
from .models import GeoPosition, SearchCell, Terrain

try:
    import h3 as _h3
except ImportError:
    _h3 = None

TERRAIN_CYCLE = (
    Terrain.OPEN_MOORLAND,
    Terrain.OPEN_MOORLAND,
    Terrain.OPEN_MOORLAND,
    Terrain.OPEN_MOORLAND,
    Terrain.FOREST,
    Terrain.FOREST,
    Terrain.MOUNTAIN,
    Terrain.MOUNTAIN,
    Terrain.FARMLAND,
    Terrain.WATER,
)


def cover(config: CellsConfig, lat: float, lon: float, radius_m: float) -> tuple[list[SearchCell], str]:
    """Cells covering the disc, plus the name of the method used ("h3" or "hexgrid")."""
    if config.use_h3 and _h3 is not None:
        cells = _h3_cover(config, lat, lon, radius_m)
        if cells:
            return cells, "h3"
    return _hexgrid_cover(config, lat, lon, radius_m), "hexgrid"


def classify_terrain(cell_id: str) -> Terrain:
    """Deterministic placeholder land cover; swap for a CORINE / OS lookup per cell."""
    digest = 0
    for char in cell_id:
        digest = (digest * 31 + ord(char)) % 1_000_003
    return TERRAIN_CYCLE[digest % len(TERRAIN_CYCLE)]


def _resolution_for(config: CellsConfig, radius_m: float) -> int:
    """Finest resolution allowed by the radius table."""
    for rule in config.resolutions:
        if radius_m <= rule.max_radius_m:
            return rule.resolution
    return config.resolutions[-1].resolution if config.resolutions else 6


def _h3_cover(config: CellsConfig, lat: float, lon: float, radius_m: float) -> list[SearchCell]:
    """Grid disk around the pin's cell, trimmed to the radius, coarsened to respect max_cells."""
    resolution = _resolution_for(config, radius_m)
    for _ in range(6):
        edge_m = float(_h3.average_hexagon_edge_length(resolution, unit="m"))
        rings = int(math.ceil(radius_m / (edge_m * math.sqrt(3.0)))) + 1
        estimated = 3 * rings * (rings + 1) + 1
        if estimated <= config.max_cells or resolution <= 3:
            break
        resolution -= 1
    origin = _h3.latlng_to_cell(lat, lon, resolution)
    cells: list[SearchCell] = []
    for cell_id in _h3.grid_disk(origin, rings):
        if len(cells) >= config.max_cells:
            break
        centre_lat, centre_lon = _h3.cell_to_latlng(cell_id)
        if distance_m(lat, lon, centre_lat, centre_lon) > radius_m + edge_m:
            continue
        boundary = [GeoPosition(lat=b[0], lon=b[1]) for b in _h3.cell_to_boundary(cell_id)]
        cells.append(
            SearchCell(
                cell_id=str(cell_id),
                centre=GeoPosition(lat=centre_lat, lon=centre_lon),
                boundary=boundary,
                terrain=classify_terrain(str(cell_id)),
                area_km2=float(_h3.cell_area(cell_id, unit="km^2")),
            )
        )
    return cells


def _hexgrid_cover(config: CellsConfig, lat: float, lon: float, radius_m: float) -> list[SearchCell]:
    """Flat-top hex tiling, the same construction as `HexGrid.kt`."""
    hex_area_factor = 3.0 * math.sqrt(3.0) / 2.0
    nominal = radius_m / 10.0
    bounded = radius_m * math.sqrt(math.pi / (hex_area_factor * max(7, config.max_cells) * 0.8))
    cell_radius = max(nominal, bounded, 150.0)
    rings = int(math.ceil(radius_m / (1.5 * cell_radius))) + 1
    cells: list[SearchCell] = []
    for q in range(-rings, rings + 1):
        for r in range(-rings, rings + 1):
            if len(cells) >= config.max_cells:
                return cells
            if abs(q + r) > rings:
                continue
            east = 1.5 * cell_radius * q
            north = math.sqrt(3.0) * cell_radius * (r + q / 2.0)
            if math.hypot(east, north) > radius_m + cell_radius:
                continue
            centre_lat, centre_lon = offset(lat, lon, east, north)
            ring = [
                offset(centre_lat, centre_lon, cell_radius * math.cos(math.radians(60.0 * i)), cell_radius * math.sin(math.radians(60.0 * i)))
                for i in range(6)
            ]
            cell_id = f"hex:{q}:{r}"
            cells.append(
                SearchCell(
                    cell_id=cell_id,
                    centre=GeoPosition(lat=centre_lat, lon=centre_lon),
                    boundary=[GeoPosition(lat=p[0], lon=p[1]) for p in ring],
                    terrain=classify_terrain(cell_id),
                    area_km2=polygon_area_km2(ring),
                )
            )
    return cells
