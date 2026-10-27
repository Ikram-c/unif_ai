# SR Portal — Search and Rescue Portal (Android MVP)

A Kotlin / Jetpack Compose demo of the AberTech Search and Rescue Portal, built from the
mockups: splash, four-button home, the New Rescue wizard (pin drop, mode of travel, last
seen date/time, Begin AI Model), and a results map with the wander rings, priority cells,
"Available Data" chips, equipment go/no-go and a recommended search-party size. A small
FastAPI "cloud server" in `server/` is what every button pings; when it is unreachable the
Server Connection Status dot turns amber and the app keeps working on bundled demo data.

```
SRportal-android/
├── app/      Android app (Compose, osmdroid map, Retrofit, kotlinx.serialization)
├── core/     Pure-Kotlin planning logic + unit tests (no Android dependency)
└── server/   FastAPI mock cloud: metadata index, search-window query, detector triggers
```

## Run it

**App** — open the folder in Android Studio (Ladybug or newer, JDK 17), let Gradle sync,
run `app` on an emulator or phone (minSdk 26). The first sync downloads the dependencies;
nothing else needs configuring. No API keys: the map is OpenStreetMap via osmdroid.

**Server** —

```bash
cd server
uv venv && uv pip install -e ".[dev]"
uv run srportal-server        # http://0.0.0.0:8000  (OpenAPI docs at /docs)
uv run pytest                 # 14 offline tests
```

The emulator reaches the laptop as `http://10.0.2.2:8000/` (the app's default). On a
physical phone put the laptop's LAN address in Settings. On first start the server seeds 14
days of demo metadata around the Elenydd uplands, relative to the current time, so a fresh
rescue always has satellite scenes, UAV strips and dashcam passes inside its window.

**Core tests** — `./gradlew :core:test` (22 tests over the time window, wander rings, cell
scoring, equipment rules, team sizing, demo dataset determinism, solar calculator).

## The demo flow

1. **Splash** pings `/health`; the status dot goes green (server) or amber (demo data).
2. **New Rescue → Last Known Location** opens the map. Search "Pumlumon" or tap the map to
   drop the pin, confirm.
3. **Mode of travel** — On Foot / Vehicle / Unknown (arrows cycle, glow colour changes).
4. **Last Seen Date/Time** — tap the clock for the time, pick the day on the calendar,
   toggle the zone (UTC / London / device). The screen shows the window so far:
   `delta t = now − last seen`. A future time cannot be confirmed.
5. **Begin AI Model** — optionally add the missing person's details (age, fitness,
   experience, clothing: these weight the wander model now and are the inputs for the
   causal / A\* model later). Tap the mountain. The app builds the request with the 95 %
   radius, `POST /search-window` returns H3 cells, in-window observations and weather, and
   the core planner scores it.
6. **Results** — Available Data chips (green ring = imagery in the window), map with the
   50 / 75 / 95 % rings, the priority hex cells and dashcam / UAV footprints; then cards:
   search window, where to look first (compass sectors and priority cells), equipment
   viability with the weather reason, search party size with its rationale, and each
   observation with its Zarr store + frame index and a **Run small-object detector** button.
   Pressing it hits `POST /rescues/{id}/observations/{obs}/detect`; the row moves through
   Queued → Running → Done (n candidates) as the app polls.
7. **Ongoing / Completed Rescues** list the cases (three sample cases are seeded on first
   launch); **Settings** holds the server URL, a force-demo switch and the default zone.

## How the pieces fit

```
 hexcover ──(EO scene availability per H3 cell)──► POST /ingest/hexcover ──► eo_scenes
 video-zarr ──(OME-Zarr store + GPX track)───────► POST /ingest/zarr ──────► video_index
 frame-extract ──(dashcam frame manifest)────────► POST /ingest/dashcam-manifest ─┘

 app: pin + last seen ──► window [last seen, now], radius from wander model
      └─► POST /search-window ──► { H3 cells, observations in window, weather }
            └─► core planner ──► rings, ranked cells, sectors, equipment, team size
                  └─► "Run detector" ──► job opens zarr_uri at frame_index (simulated)
```

* `eo_scenes` is one row per scene per cell (platform, time, footprint, cloud, Zarr URI).
* `video_index` is one row per Zarr store (source, time span, fps, bounding box, track).
* The query is two range scans plus a nearest-track-point refinement; the point's offset
  from the store start times the fps is the **frame index**, so the detector opens only that
  chunk of that store. That is where the Zarr layout earns its keep.

## The heuristics (and what they will become)

All constants live in `core/.../SarConfig.kt`, overridable from `app/src/main/assets/sar_config.json`
(app) and `server/config.yaml` (server). They are placeholders chosen to be plausible for
upland Wales, to be replaced with figures agreed with rescue teams.

| Step | Today | Roadmap |
| --- | --- | --- |
| Wander radius | On foot: median distance saturates, `d50 = 3 km · (1 − e^(−h/6))`, scaled by fitness / experience / age; rings at 1×, 1.8×, 4×. Vehicle: linear reach capped at 40 km. Unknown: a blend. | Causal model + A\* over terrain with the person's characteristics as edge weights (with other teams). |
| Where to look | Gaussian distance decay consistent with the 50 % ring × terrain prior, per H3 cell; summarised per compass sector. | Real land cover per cell (CORINE / OS), linear features (paths, streams), historical find locations. |
| Equipment | Rule thresholds: UAV wind ≤ 10 m/s, gusts ≤ 14, rain ≤ 2.5 mm/h, vis ≥ 1 km, thermal at night; dog team scent limits; helicopter visibility / cloud. | Team-specific fleet limits, live METAR / Met Office feeds. |
| Team size | Hasty-search sweep rates per terrain over the priority cells within a 4 h period. | Autoencoder over historical incidents → team size and equipment mix. |
| Detector | Simulated job (queued → running → done). | Real tiled small-object detector on the Zarr chunk (the UAV litter-counter lineage). |

## Engineering notes

* `core` has no Android dependency, so the model can be unit-tested on the JVM and ported
  to the server later; the JSON contract (`@SerialName` in `Models.kt`, pydantic in
  `server/.../models.py`) is shared and was round-trip tested against the live server.
* The app persists rescues as one JSON document in private storage and mirrors every change
  to the server when online. No credentials anywhere; the server reads only `config.yaml`.
* `android:usesCleartextTraffic="true"` is set so the emulator can talk to the dev server
  over plain HTTP; drop it once the server is behind TLS.
* Map tiles come from OpenStreetMap's public tile server (fine for a demo; use a tile
  provider with a licence for production).
* The Compose UI was written against Compose BOM 2024.12.01 / Material3 1.3.1 / osmdroid
  6.1.20 but could not be compiled where it was authored (no Android SDK there); the pure
  Kotlin layers and the server were. Expect at most small fixes on first Android Studio build.

## Pitch-deck talking points

* One pin and one confirmed time give a bounded metadata query, not a video-processing job:
  the cloud answers "which sensors could have seen them, and exactly where in the store".
* The three feeds already exist as pipelines (H3 coverage + CDSE scenes, OME-Zarr video
  with cloud streaming, GPX-tagged dashcam frames); the portal is the query layer on top.
* Everything past the query is simple, well-understood database work — the kind fractional
  consultants can deliver — while the models (causal / A\*, autoencoder team sizing, small
  object detection) plug into named seats in `core`.
* The output is what a team leader needs in the first ten minutes: where to look first,
  what can fly, how many people to call.
