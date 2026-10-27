"""Place search for the map bar: Nominatim when allowed, a Welsh gazetteer otherwise."""

from __future__ import annotations

import logging

import httpx

from .config import GeocodeConfig
from .models import GeoPosition, Place

LOGGER = logging.getLogger(__name__)
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

GAZETTEER: tuple[Place, ...] = (
    Place(name="Elenydd, Cambrian Mountains", position=GeoPosition(lat=52.2950, lon=-3.7600), region="Ceredigion / Powys"),
    Place(name="Aberystwyth", position=GeoPosition(lat=52.4153, lon=-4.0829), region="Ceredigion"),
    Place(name="Pumlumon Fawr", position=GeoPosition(lat=52.4675, lon=-3.7823), region="Ceredigion"),
    Place(name="Elan Valley", position=GeoPosition(lat=52.2710, lon=-3.5820), region="Powys"),
    Place(name="Claerwen Reservoir", position=GeoPosition(lat=52.2430, lon=-3.7100), region="Powys"),
    Place(name="Devil's Bridge", position=GeoPosition(lat=52.3772, lon=-3.8517), region="Ceredigion"),
    Place(name="Tregaron", position=GeoPosition(lat=52.2214, lon=-3.9349), region="Ceredigion"),
    Place(name="Rhayader", position=GeoPosition(lat=52.3021, lon=-3.5079), region="Powys"),
    Place(name="Llanidloes", position=GeoPosition(lat=52.4488, lon=-3.5390), region="Powys"),
    Place(name="Machynlleth", position=GeoPosition(lat=52.5910, lon=-3.8510), region="Powys"),
    Place(name="Cadair Idris", position=GeoPosition(lat=52.6994, lon=-3.9086), region="Eryri"),
    Place(name="Yr Wyddfa (Snowdon)", position=GeoPosition(lat=53.0685, lon=-4.0763), region="Eryri"),
    Place(name="Llanberis", position=GeoPosition(lat=53.1190, lon=-4.1290), region="Eryri"),
    Place(name="Betws-y-Coed", position=GeoPosition(lat=53.0921, lon=-3.8025), region="Eryri"),
    Place(name="Pen y Fan", position=GeoPosition(lat=51.8839, lon=-3.4367), region="Bannau Brycheiniog"),
    Place(name="Brecon", position=GeoPosition(lat=51.9475, lon=-3.3910), region="Powys"),
    Place(name="Carmarthen", position=GeoPosition(lat=51.8557, lon=-4.3096), region="Carmarthenshire"),
)


def search(config: GeocodeConfig, query: str, limit: int = 6) -> list[Place]:
    """Gazetteer hits first; Nominatim fills the rest when the provider allows it."""
    needle = query.strip().lower()
    if not needle:
        return []
    hits = [place for place in GAZETTEER if needle in place.name.lower() or needle in place.region.lower()][:limit]
    if len(hits) >= limit or config.provider != "nominatim":
        return hits
    seen = {place.name for place in hits}
    for place in _nominatim(config, query, limit):
        if place.name not in seen and len(hits) < limit:
            hits.append(place)
            seen.add(place.name)
    return hits


def _nominatim(config: GeocodeConfig, query: str, limit: int) -> list[Place]:
    """OpenStreetMap search restricted to Great Britain; empty on any failure."""
    params = {"q": query, "format": "jsonv2", "limit": str(limit), "countrycodes": "gb"}
    headers = {"User-Agent": config.user_agent}
    try:
        response = httpx.get(NOMINATIM_URL, params=params, headers=headers, timeout=config.timeout_seconds)
        response.raise_for_status()
        places: list[Place] = []
        for item in response.json()[:limit]:
            name = str(item.get("display_name", "")).split(",")[0].strip()
            region = ", ".join(part.strip() for part in str(item.get("display_name", "")).split(",")[1:3])
            places.append(Place(name=name, position=GeoPosition(lat=float(item["lat"]), lon=float(item["lon"])), region=region))
        return places
    except Exception as error:
        LOGGER.warning("Nominatim unavailable: %s", error)
        return []
