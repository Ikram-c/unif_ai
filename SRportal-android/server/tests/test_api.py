"""End-to-end checks of the endpoints the app calls."""

from __future__ import annotations

from datetime import timedelta

from srportal_server.timeutil import format_utc, now_utc

PIN = {"lat": 52.2950, "lon": -3.7600}


def _rescue(rescue_id: str, hours_ago: int) -> dict:
    now = now_utc()
    return {
        "id": rescue_id,
        "status": "ONGOING",
        "created_at_utc": format_utc(now),
        "last_known_location": PIN,
        "location_label": "Elenydd",
        "travel_mode": "ON_FOOT",
        "last_seen_utc": format_utc(now - timedelta(hours=hours_ago)),
        "time_zone": "UTC",
        "subject": {"name": "Walker", "fitness": "MEDIUM", "experience": "INTERMEDIATE"},
        "plan": None,
    }


def _window(rescue_id: str, hours_ago: int, radius_m: float = 6_000.0) -> dict:
    now = now_utc()
    return {
        "rescue_id": rescue_id,
        "pin": PIN,
        "last_seen_utc": format_utc(now - timedelta(hours=hours_ago)),
        "now_utc": format_utc(now),
        "travel_mode": "ON_FOOT",
        "radius_m": radius_m,
    }


def test_health_reports_seeded_rows(client):
    payload = client.get("/health").json()
    assert payload["status"] == "ok"
    assert payload["db_rows"]["eo_scenes"] > 0
    assert payload["db_rows"]["video_index"] > 0


def test_rescue_round_trip(client):
    body = _rescue("case-1", 3)
    assert client.put("/rescues/case-1", json=body).status_code == 200
    listed = client.get("/rescues").json()
    assert [item["id"] for item in listed] == ["case-1"]
    fetched = client.get("/rescues/case-1").json()
    assert fetched["last_known_location"] == PIN
    assert client.put("/rescues/other", json=body).status_code == 400
    assert client.get("/rescues/missing").status_code == 404


def test_search_window_returns_cells_observations_and_weather(client):
    response = client.post("/search-window", json=_window("case-2", 30))
    assert response.status_code == 200
    bundle = response.json()
    assert bundle["cell_source"] in ("h3", "hexgrid")
    assert 7 <= len(bundle["cells"]) <= 400
    assert all(len(cell["boundary"]) >= 6 for cell in bundle["cells"])
    sources = {item["source"] for item in bundle["observations"]}
    assert "SATELLITE" in sources
    assert "DASHCAM" in sources
    assert bundle["weather"]["source"] == "demo"
    for item in bundle["observations"]:
        assert _window("case-2", 30)["last_seen_utc"] <= item["observed_at_utc"] <= _window("case-2", 30)["now_utc"]
        if item["source"] != "SATELLITE":
            assert item["frame_index"] is not None
            assert item["zarr_uri"].endswith(".zarr")


def test_narrow_window_has_fewer_observations(client):
    wide = client.post("/search-window", json=_window("case-3", 72)).json()
    narrow = client.post("/search-window", json=_window("case-4", 1)).json()
    assert len(narrow["observations"]) <= len(wide["observations"])


def test_detector_job_progresses(client, monkeypatch):
    bundle = client.post("/search-window", json=_window("case-5", 48)).json()
    observation = next(item for item in bundle["observations"] if item["source"] == "DASHCAM")
    queued = client.post(f"/rescues/case-5/observations/{observation['id']}/detect").json()
    assert queued["detection_status"] == "QUEUED"

    import srportal_server.app as app_module

    real_now = app_module.now_utc
    monkeypatch.setattr(app_module, "now_utc", lambda: real_now() + timedelta(seconds=5))
    running = client.get(f"/rescues/case-5/observations/{observation['id']}").json()
    assert running["detection_status"] == "RUNNING"

    monkeypatch.setattr(app_module, "now_utc", lambda: real_now() + timedelta(seconds=30))
    done = client.get(f"/rescues/case-5/observations/{observation['id']}").json()
    assert done["detection_status"] == "DONE"
    assert 0 <= done["candidate_count"] <= 3

    assert client.post("/rescues/case-5/observations/nope/detect").status_code == 404


def test_geocode_uses_gazetteer_offline(client):
    hits = client.get("/geocode", params={"q": "aberyst"}).json()
    assert hits and hits[0]["name"] == "Aberystwyth"
    assert client.get("/geocode", params={"q": ""}).json() == []


def test_ingest_endpoints_index_rows(client):
    hexcover = {
        "cells": [
            {
                "cell_id": "8819a0a2c3fffff",
                "centre": PIN,
                "scenes": [
                    {
                        "platform": "Sentinel-2A",
                        "observed_at_utc": format_utc(now_utc() - timedelta(hours=2)),
                        "cloud_cover_pct": 12.0,
                        "zarr_uri": "s3://cdse/S2A_test.zarr",
                        "footprint": [
                            {"lat": 52.0, "lon": -4.2},
                            {"lat": 52.6, "lon": -4.2},
                            {"lat": 52.6, "lon": -3.3},
                            {"lat": 52.0, "lon": -3.3},
                        ],
                    }
                ],
            }
        ]
    }
    assert client.post("/ingest/hexcover", json=hexcover).json()["inserted"] == 1

    start = now_utc() - timedelta(hours=1)
    manifest = {
        "rows": [
            {"video_id": "CAR09_20260925_083000_CAM01", "frame": i * 30, "timestamp": format_utc(start + timedelta(seconds=i)), "lat": 52.2950 + i * 0.0002, "lon": -3.7600}
            for i in range(20)
        ],
        "fps": 30.0,
        "zarr_prefix": "gs://bucket/dashcam/",
    }
    assert client.post("/ingest/dashcam-manifest", json=manifest).json()["inserted"] == 1

    bundle = client.post("/search-window", json=_window("case-6", 3, radius_m=2_000.0)).json()
    platforms = {item["platform_id"] for item in bundle["observations"]}
    assert "CAR09" in platforms
    car = next(item for item in bundle["observations"] if item["platform_id"] == "CAR09")
    assert car["zarr_uri"] == "gs://bucket/dashcam/CAR09_20260925_083000_CAM01.zarr"
    assert car["distance_from_pin_m"] < 50.0
