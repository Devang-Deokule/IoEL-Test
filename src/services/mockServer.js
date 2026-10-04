// In-memory fake backend. It mimics what the FastAPI service will do, so the
// frontend never needs to know whether it is talking to mock data or a real API.
// Nothing here is imported by components; everything goes through services/api.js.

import { seedAssets } from '../data/assets';
import { seedHistory } from '../data/history';
import { seedAlerts } from '../data/alerts';
import { seedCheckpoints, READER, DEFAULT_CHECKPOINT_ID } from '../data/checkpoints';
import { ASSET_STATUSES, ASSET_TYPES, LOCATIONS, IN_TRANSIT } from '../data/constants';
import { normalizeUid, UID_PATTERN } from '../utils/format';
import { ApiError } from './errors';

const clone = (v) => structuredClone(v);
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));
const newest = (a, b) => new Date(b.timestamp) - new Date(a.timestamp);

function createDb() {
  return {
    assets: clone(seedAssets),
    history: clone(seedHistory),
    alerts: clone(seedAlerts),
    activeCheckpointId: DEFAULT_CHECKPOINT_ID,
    historySeq: seedHistory.length,
    alertSeq: seedAlerts.length,
  };
}

let db = createDb();

const nextHistoryId = () => `H-${String(++db.historySeq).padStart(4, '0')}`;
const nextAlertId = () => `AL-${1000 + ++db.alertSeq}`;

function checkpointList() {
  return seedCheckpoints.map((c) => ({
    ...c,
    status: c.id === db.activeCheckpointId ? 'active' : 'inactive',
    reader: c.id === db.activeCheckpointId ? READER.name : null,
  }));
}

// ---- GET endpoints --------------------------------------------------------

export async function getAssets() {
  await delay();
  return clone(db.assets);
}

export async function getAsset(id) {
  await delay();
  const found = db.assets.find((a) => a.id === id);
  if (!found) throw new ApiError(`Asset ${id} not found`, 404);
  return clone(found);
}

export async function getHistory() {
  await delay();
  return clone([...db.history].sort(newest));
}

export async function getAlerts() {
  await delay();
  return clone([...db.alerts].sort(newest));
}

export async function getCheckpoints() {
  await delay();
  return checkpointList();
}

// ---- Mutations ------------------------------------------------------------

export async function activateCheckpoint(id) {
  await delay(150);
  if (!seedCheckpoints.some((c) => c.id === id)) throw new ApiError('Checkpoint not found', 404);
  db.activeCheckpointId = id;
  return checkpointList();
}

// POST /scan  { rfidUid, checkpointId }
// Rule: a valid tag inside the checkpoint's area is an EXIT; otherwise an ENTRY.
// Unknown tags are an ALERT.
export async function postScan({ rfidUid, checkpointId }) {
  await delay(450); // pretend the reader/ESP32 round trip takes a moment
  const checkpoint = seedCheckpoints.find((c) => c.id === checkpointId);
  if (!checkpoint) throw new ApiError('Checkpoint not found', 404);

  const uid = normalizeUid(rfidUid);
  const now = new Date().toISOString();
  const asset = db.assets.find((a) => a.rfidUid === uid);

  if (!asset) {
    const historyEntry = {
      id: nextHistoryId(),
      assetId: null,
      assetName: 'Unknown tag',
      rfidUid: uid,
      event: 'ALERT',
      previousLocation: null,
      newLocation: null,
      checkpoint: checkpoint.label,
      timestamp: now,
      note: 'Unregistered tag',
    };
    const alert = {
      id: nextAlertId(),
      type: 'UNKNOWN_RFID',
      severity: 'critical',
      state: 'new',
      title: 'Unknown RFID',
      message: 'An unregistered RFID tag was detected.',
      checkpoint: checkpoint.label,
      rfidUid: uid,
      assetId: null,
      timestamp: now,
    };
    db.history.push(historyEntry);
    db.alerts.push(alert);
    return clone({ event: 'ALERT', asset: null, historyEntry, alert });
  }

  const isInsideHere = asset.lastEvent === 'ENTRY' && asset.location === checkpoint.location;
  const event = isInsideHere ? 'EXIT' : 'ENTRY';
  const previousLocation = asset.location;
  const newLocation = isInsideHere ? IN_TRANSIT : checkpoint.location;

  asset.location = newLocation;
  asset.lastEvent = event;
  asset.lastDetected = now;

  const historyEntry = {
    id: nextHistoryId(),
    assetId: asset.id,
    assetName: asset.name,
    rfidUid: asset.rfidUid,
    event,
    previousLocation,
    newLocation,
    checkpoint: checkpoint.label,
    timestamp: now,
    note: null,
  };
  db.history.push(historyEntry);

  let alert = null;
  if (event === 'ENTRY' && asset.expectedLocation && asset.expectedLocation !== newLocation) {
    alert = {
      id: nextAlertId(),
      type: 'UNEXPECTED_MOVEMENT',
      severity: 'warning',
      state: 'new',
      title: 'Unexpected movement',
      message: `${asset.name} ${asset.id} was detected at ${newLocation} but is expected in ${asset.expectedLocation}.`,
      checkpoint: checkpoint.label,
      rfidUid: asset.rfidUid,
      assetId: asset.id,
      timestamp: now,
    };
    db.alerts.push(alert);
  }

  return clone({ event, asset, historyEntry, alert });
}

// PUT /assets/{id}/status  { status }
export async function updateAssetStatus(id, status) {
  await delay(200);
  if (!ASSET_STATUSES.includes(status)) throw new ApiError('Invalid status', 422);
  const found = db.assets.find((a) => a.id === id);
  if (!found) throw new ApiError(`Asset ${id} not found`, 404);
  found.status = status;
  return clone(found);
}

// POST /assets  { name, rfidUid, type, location, status }
export async function createAsset(payload) {
  await delay(250);
  const name = (payload.name || '').trim();
  const rfidUid = normalizeUid(payload.rfidUid || '');

  if (!name) throw new ApiError('Equipment name is required', 422);
  if (!UID_PATTERN.test(rfidUid)) throw new ApiError('RFID UID must look like 21-28-2F-66', 422);
  if (db.assets.some((a) => a.rfidUid === rfidUid)) throw new ApiError('This RFID UID is already registered', 409);
  if (!ASSET_TYPES.includes(payload.type)) throw new ApiError('Invalid asset type', 422);
  if (!LOCATIONS.some((l) => l.name === payload.location)) throw new ApiError('Invalid location', 422);
  if (!ASSET_STATUSES.includes(payload.status)) throw new ApiError('Invalid status', 422);

  const maxNumber = db.assets.reduce((max, a) => Math.max(max, Number(a.id.slice(1)) || 0), 0);
  const created = {
    id: `A${String(maxNumber + 1).padStart(3, '0')}`,
    name,
    rfidUid,
    type: payload.type,
    department: payload.location,
    location: payload.location,
    status: payload.status,
    lastEvent: null,
    lastDetected: null,
    expectedLocation: null,
  };
  db.assets.push(created);
  return clone(created);
}

// PUT /alerts/{id}  { state }
export async function updateAlertState(id, state) {
  await delay(150);
  if (!['new', 'acknowledged', 'resolved'].includes(state)) throw new ApiError('Invalid state', 422);
  const found = db.alerts.find((a) => a.id === id);
  if (!found) throw new ApiError('Alert not found', 404);
  found.state = state;
  return clone(found);
}

// Demo-only helper.
export async function resetDb() {
  await delay(150);
  db = createDb();
}
