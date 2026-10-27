# SR Portal cloud server (mock)

The "cloud" every button in the Android app pings. It indexes remote-sensing metadata,
answers the search-window query, stores rescue cases and simulates the small-object
detector jobs. SQLite, FastAPI, one YAML config, no credentials required.

## Run

```bash
cd server
uv venv && uv pip install -e ".[dev]"
uv run srportal-server            # http://0.0.0.0:8000, docs at /docs
uv run pytest                     # offline test-suite
```

On first start the index is seeded with 14 days of demo metadata around the Elenydd
uplands (`demo:` in `config.yaml`), relative to the current time, so the app always finds
satellite scenes, UAV strips and dashcam passes inside its window.

From the Android emulator the server is `http://10.0.2.2:8000/`; from a phone use the
laptop's LAN address, e.g. `http://192.168.1.20:8000/`. Set it under Settings in the app.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Liveness and row counts; the app's status bar polls it every 5 s. |
| GET / PUT | `/rescues`, `/rescues/{id}` | Case storage; the app pushes every change. |
| POST | `/search-window` | The "Begin AI Model" query: H3 cells inside the radius, observations inside the window, weather at the pin. |
| POST | `/rescues/{id}/observations/{obs}/detect` | Trigger the detector for one observation (simulated job). |
| GET | `/rescues/{id}/observations/{obs}` | Detector status for polling. |
| GET | `/geocode?q=` | Map-bar search (gazetteer, then Nominatim). |
| POST | `/ingest/hexcover` | Index EO scene availability per H3 cell from a hexcover run. |
| POST | `/ingest/zarr` | Index OME-Zarr video stores with their telemetry track. |
| POST | `/ingest/dashcam-manifest` | Index frame-extract manifests (any column naming). |
| POST | `/seed-demo` | Rebuild the demo index relative to now. |

## Data model

Two tables carry the whole story:

* `eo_scenes` — one row per scene per cell: platform, time, footprint centre and radius,
  cloud cover, `zarr_uri`. Fed by hexcover's CDSE availability query.
* `video_index` — one row per OME-Zarr store: source (UAV or DASHCAM), time span, fps,
  bounding box and the GPX-style track. Fed by video-zarr and by dashcam frame manifests.

The search-window query is then two range scans: scenes by time whose footprint reaches the
search disc, and videos whose time span and bounding box intersect it, refined to the
closest in-window track point. That point's offset from the store start times the fps gives
the **frame index**, which is what makes Zarr shine: the detector opens exactly that chunk
of exactly that store instead of decoding the whole video.

## Where the model lives

The planning heuristics (wander rings, cell scoring, equipment go/no-go, team sizing) run in
the app's pure-Kotlin `core` module against this server's bundle, so the demo works with the
server down. Moving them server-side is a matter of porting `core` (the JSON contract in
`models.py` already matches) once the causal / A\* model and the autoencoder for team
sizing land.
