// ---------------------------------------------------------------------------
// The ONLY place the UI talks to data. Components call `api.*` (usually through
// AppContext) and never use fetch() or the mock server directly.
//
// Mock mode is the default. To connect the FastAPI backend later:
//   1. copy .env.example to .env
//   2. set VITE_USE_MOCK=false and VITE_API_URL=http://localhost:8000
//   3. enable CORS for http://localhost:5173 in FastAPI
//
// The real endpoints should return camelCase JSON matching the mock data shapes
// (in Pydantic: alias_generator=to_camel, populate_by_name=True).
// ---------------------------------------------------------------------------

import * as mock from './mockServer';
import { ApiError } from './errors';
import * as firebaseAssets from './assetService';
import * as firebaseHistory from "./historyService";
import * as firebaseAlerts from './alertService';
import * as firebaseCheckpoints from './checkpointService';
import * as firebaseScan from './scanService';
import {
  setSecurityAlertState,
  markAlertDeleted,
  markAlertsDeleted,
} from './securityMonitoringService';

export const isMockMode = import.meta.env.VITE_USE_MOCK !== 'false';
export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new ApiError(`Cannot reach the API at ${API_BASE_URL}`, 0);
  }
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      if (typeof body.detail === 'string') detail = body.detail;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new ApiError(detail, response.status);
  }
  return response.status === 204 ? null : response.json();
}

const json = (method, body) => ({ method, body: JSON.stringify(body) });
const enc = encodeURIComponent;

export const api = {
  // GET /assets
  getAssets: () => firebaseAssets.getAssets(),

  // GET /assets/{id}
  getAsset: (id) => (isMockMode ? mock.getAsset(id) : request(`/assets/${enc(id)}`)),

  // POST /assets   (needed by the "Add asset" form)
  createAsset: (payload) => (isMockMode ? mock.createAsset(payload) : request('/assets', json('POST', payload))),

  // PUT /assets/{id}/status   body: { status }
  updateAssetStatus: (id, status) =>
    isMockMode ? mock.updateAssetStatus(id, status) : request(`/assets/${enc(id)}/status`, json('PUT', { status })),

  // GET /history   (newest first)
  getHistory: () => firebaseHistory.getHistory(),

  // GET /alerts   (newest first)
 getAlerts: () => firebaseAlerts.getAlerts(),

  // PUT /alerts/{id}   body: { state: 'new' | 'acknowledged' | 'resolved' }
  updateAlertState: (id, state) => {
    if (String(id).startsWith('sec-')) {
      setSecurityAlertState(id, state);
      return Promise.resolve({ id, state });
    }
    return firebaseAlerts.updateAlertState(id, state);
  },

  // DELETE /alerts/{id}
  deleteAlert: async (id) => {
    if (String(id).startsWith('sec-')) {
      markAlertDeleted(id);
      return true;
    }
    if (isMockMode && mock.deleteAlert) {
      return mock.deleteAlert(id);
    }
    return firebaseAlerts.deleteAlert(id).catch(() => true);
  },

  // Bulk DELETE /alerts
  deleteAlerts: async (ids = []) => {
    if (!ids || !ids.length) return true;
    const secIds = ids.filter((id) => String(id).startsWith('sec-'));
    const firestoreIds = ids.filter((id) => !String(id).startsWith('sec-'));

    if (secIds.length > 0) {
      markAlertsDeleted(secIds);
    }

    if (firestoreIds.length > 0) {
      if (isMockMode && mock.deleteAlert) {
        await Promise.allSettled(firestoreIds.map((id) => mock.deleteAlert(id)));
      } else {
        await Promise.allSettled(firestoreIds.map((id) => firebaseAlerts.deleteAlert(id).catch(() => true)));
      }
    }
    return true;
  },

  // GET /checkpoints   (each has status: 'active' | 'inactive', reader: string | null)
  getCheckpoints: () => firebaseCheckpoints.getCheckpoints(),

  // PUT /checkpoints/{id}/activate   returns the updated checkpoint list
 activateCheckpoint: (id) =>
  firebaseCheckpoints.activateCheckpoint(id),

  // POST /scan   body: { rfidUid, checkpointId }
  // Returns { event: 'ENTRY' | 'EXIT' | 'ALERT', asset, historyEntry, alert }
  // In production the ESP32 sends this request; this frontend only sends it from the simulator.
  postScan: ({ rfidUid, checkpointId }) =>
  firebaseScan.postScan({ rfidUid, checkpointId }),

  // Demo only
  resetDemo: () => (isMockMode ? mock.resetDb() : Promise.reject(new ApiError('Reset is only available in mock mode', 400))),
};
