# Mountain Rescue Orchestration (SR Portal)
<img width="577" height="947" alt="IMG_4506 (1) (1)" src="https://github.com/user-attachments/assets/6de471bb-ed98-4279-9f98-89c37f673ffe" />

A tactical search-and-rescue (SAR) orchestration web application ported from the AberTech mountain rescue system into React, TypeScript, Vite, and Tailwind CSS.

## Overview

The SR Portal guides search-and-rescue teams through rapid incident intake, probability modelling, remote-sensing data indexing, equipment viability evaluation, and team sizing for missing person operations.

### Key Features

1. **4-Stage New Rescue Wizard**:
   - **Last Known Location**: Interactive map picker with offline Welsh gazetteer search (Pumlumon Fawr, Elan Valley, Cadair Idris, Snowdon, etc.) and click-to-pin.
   - **Travel Mode Carousel**: Choose between *On Foot*, *Vehicle*, and *Unknown*, featuring responsive border glows and calibrated displacement limits.
   - **Last Seen Date/Time**: Time window calculator measuring elapsed duration $\Delta t$, 24-hour clock picker, calendar date selector, and time-zone toggling (UTC, Europe/London, Local).
   - **Begin AI Model & Subject Profile**: Mountain action button with animated progress indicator, plus an in-depth subject profile editor (fitness, experience level, clothing, notes).

2. **Tactical Search Plan Display**:
   - **Available Remote Sensing Data**: Interactive indicators for Satellite passes (Sentinel-1 SAR, Sentinel-2 Optical, PlanetScope), UAV flight survey strips, and Dashcam GPX-tagged passes within the time window.
   - **Tactical OpenStreetMap Layer**: Displays the last known pin, 50% / 75% / 95% wander radius probability rings, high-probability hexagonal search cells with score tooltips, and UAV / dashcam sensor footprints.
   - **Where to Look First**: Prioritized sector summaries (probability mass, area, dominant terrain) and ranked priority search cells.
   - **Equipment Viability**: Go / no-go assessment taking into account local weather (wind speeds, gusts, precipitation, visibility, daylight, cloud cover) across UAV Visual, UAV Thermal, Ground Teams, Vehicle Patrols, Search Dogs, and Helicopters.
   - **Search Party Sizing**: Computes required hasty-search searcher-hours and team breakdown based on terrain sweep rates and target deployment periods.
   - **Small-Object Detector Pipeline**: Interactive trigger per observation record to simulate the OME-Zarr detection queue (`QUEUED` $\to$ `RUNNING` $\to$ `DONE` with candidate sightings count).

3. **Rescue Management**:
   - Filter and track **Ongoing Rescues** and **Completed Rescues**.
   - Re-run model with updated elapsed windows.
   - Mark cases as completed or reopen completed cases.

4. **Offline & Hybrid Architecture**:
   - Full offline fallback with local storage persistence and synthetic Cambrian Mountains dataset.
   - Health check and connection status bar reflecting Cloud Server status or Demo mode.

## Development

```bash
npm run dev    # Starts Vite development server on port 3000
npm run build  # Builds TypeScript and Vite production bundle
```
