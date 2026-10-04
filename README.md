# Hospital Asset Tracker: Frontend

React + Vite + Tailwind CSS dashboard for an RFID-based indoor hospital asset tracking system.
This is the frontend only. It runs on mock data and is structured so a FastAPI backend can be
connected later without touching any component.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

Other commands: `npm run build` (production build), `npm run preview` (serve the build).

## Project structure

```
src/
  components/   Reusable UI (Badge, Card, ScannerPanel, ActivityTable, AlertItem...)
  context/      AppContext: app state + actions (simulateScan, selectCheckpoint...)
  data/         Mock/seed data: assets, history, alerts, checkpoints, constants
  hooks/        useApp, usePageTitle
  layouts/      AppLayout, Sidebar, Topbar
  pages/        Dashboard, Assets, AssetDetails, TrackingHistory, Checkpoints, Alerts,
                SystemStatus, Settings
  routes/       AppRoutes
  services/     api.js (the only data entry point), mockServer.js (fake backend)
  utils/        Formatting helpers
```

## Key concepts

- **RFID event** (ENTRY / EXIT / ALERT) comes from scans. **Asset status** (Available / In Use /
  Maintenance) is set by staff. They are stored and displayed separately.
- **Checkpoints**: there is one physical RC522 reader, so exactly one checkpoint is active at a time.
  Changing it on the Checkpoints page changes where simulated scans are recorded.
- **Scan rule** (mirrors the hardware): a valid tag scanned while it is inside the active checkpoint = EXIT,
  otherwise ENTRY. An unregistered tag = ALERT. After an EXIT the asset's location is "In Transit"
  until its next scan, because one reader cannot know where it went.
- **Unexpected movement**: assets with an `expectedLocation` (critical equipment) raise a warning when
  an ENTRY happens anywhere else.
- **Simulate RFID scan** on the dashboard is for frontend testing only. By default it simulates
  A001 Ventilator (21-28-2F-66); the dropdown lets you pick other tags or an unregistered one.

## Connecting FastAPI later

All data access goes through `src/services/api.js`. Components never call `fetch` directly.

1. `cp .env.example .env`
2. Set `VITE_USE_MOCK=false` and `VITE_API_URL=http://localhost:8000`
3. Enable CORS for `http://localhost:5173` in FastAPI.
4. Return camelCase JSON matching the shapes in `src/data/*` (Pydantic: `alias_generator=to_camel`).

| Frontend call               | Endpoint                          | Notes |
|-----------------------------|-----------------------------------|-------|
| `api.getAssets()`           | `GET /assets`                     | |
| `api.getAsset(id)`          | `GET /assets/{id}`                | |
| `api.createAsset(data)`     | `POST /assets`                    | Needed by the Add asset form |
| `api.updateAssetStatus()`   | `PUT /assets/{id}/status`         | body `{ status }` |
| `api.getHistory()`          | `GET /history`                    | newest first |
| `api.getAlerts()`           | `GET /alerts`                     | newest first |
| `api.updateAlertState()`    | `PUT /alerts/{id}`                | body `{ state }` |
| `api.getCheckpoints()`      | `GET /checkpoints`                | each has `status` and `reader` |
| `api.activateCheckpoint()`  | `PUT /checkpoints/{id}/activate`  | returns the checkpoint list |
| `api.postScan()`            | `POST /scan`                      | body `{ rfidUid, checkpointId }`; returns `{ event, asset, historyEntry, alert }`. The ESP32 will call this. |

`src/services/mockServer.js` shows the exact logic the backend `/scan` handler needs to implement.
