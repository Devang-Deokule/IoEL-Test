import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, query, limitToLast } from 'firebase/database';

const RTDB_URL = 'https://security-monitoring-syst-dd43a-default-rtdb.firebaseio.com';

// Ensure a dedicated Firebase app instance for the Security RTDB to avoid collision with Firestore app
let securityApp;
if (getApps().some((app) => app.name === 'securityMonitoring')) {
  securityApp = getApp('securityMonitoring');
} else {
  securityApp = initializeApp({ databaseURL: RTDB_URL }, 'securityMonitoring');
}

export const securityDb = getDatabase(securityApp);

export const DEFAULT_ROOMS = [
  { id: 'room', label: 'Main Ward / Room (Active)', path: 'hospital/room/reading' },
  { id: 'room01', label: 'Room 01 (Telemetry Node)', path: 'hospital/room01/readings' },
];

/**
 * Format timestamp string into clean display formats
 */
export function formatTimestamp(isoString) {
  if (!isoString) return { full: 'N/A', time: 'N/A', date: 'N/A', relative: 'Unknown' };
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { full: isoString, time: isoString, date: '', relative: isoString };

    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const date = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    let relative = 'Just now';
    if (diffSec > 60 && diffSec < 3600) {
      relative = `${Math.floor(diffSec / 60)}m ago`;
    } else if (diffSec >= 3600 && diffSec < 86400) {
      relative = `${Math.floor(diffSec / 3600)}h ago`;
    } else if (diffSec >= 86400) {
      relative = `${Math.floor(diffSec / 86400)}d ago`;
    }

    return { full: `${date} ${time}`, time, date, relative, dateObj: d };
  } catch {
    return { full: isoString, time: isoString, date: '', relative: isoString };
  }
}

/**
 * Normalize a raw reading item from Firebase RTDB.
 * CRITICAL LOGIC: fire.value === 0 means FIRE DETECTED. fire.value === 1 means SAFE/NORMAL.
 * Note: Presented professionally in UI without disclosing raw inverted bit logic.
 */
export function normalizeReading(id, raw) {
  if (!raw) return null;

  const rawFire = raw.fire?.value ?? (typeof raw.fire === 'number' ? raw.fire : 1);
  const isFire = Number(rawFire) === 0;

  const smokeVal = Number(raw.smoke?.filtered ?? raw.smoke?.value ?? raw.smoke ?? 0);
  const tempVal = Number(raw.temperature?.filtered ?? raw.temperature?.value ?? raw.temperature ?? 0);
  const vibVal = Number(raw.vibration?.filtered ?? raw.vibration?.value ?? raw.vibration ?? 0);

  // Status assessments
  let smokeStatus = 'Normal';
  let smokeTone = 'ok';
  if (smokeVal >= 1400) {
    smokeStatus = 'High Density';
    smokeTone = 'danger';
  } else if (smokeVal >= 1280) {
    smokeStatus = 'Moderate';
    smokeTone = 'warn';
  }

  let tempStatus = 'Optimal';
  let tempTone = 'ok';
  if (tempVal >= 38) {
    tempStatus = 'Critical Heat';
    tempTone = 'danger';
  } else if (tempVal >= 33) {
    tempStatus = 'Elevated';
    tempTone = 'warn';
  }

  let vibStatus = 'Stable';
  let vibTone = 'ok';
  if (vibVal >= 0.8) {
    vibStatus = 'Severe Earthquake / Structural Shock';
    vibTone = 'danger';
  } else if (vibVal >= 0.3) {
    vibStatus = 'Earthquake / Seismic Disturbance';
    vibTone = 'warn';
  }

  const timeFormatted = formatTimestamp(raw.timestamp);

  return {
    id,
    timestamp: raw.timestamp,
    timeFormatted,
    fire: {
      isFire,
      status: isFire ? 'Fire Detected' : 'Safe',
      tone: isFire ? 'danger' : 'ok',
    },
    smoke: {
      filtered: Number(smokeVal.toFixed(2)),
      status: smokeStatus,
      tone: smokeTone,
    },
    temperature: {
      filtered: Number(tempVal.toFixed(2)),
      fahrenheit: Number((tempVal * 1.8 + 32).toFixed(1)),
      status: tempStatus,
      tone: tempTone,
    },
    vibration: {
      filtered: Number(vibVal.toFixed(2)),
      status: vibStatus,
      tone: vibTone,
    },
    hasAnomaly: isFire || smokeTone === 'danger' || tempTone === 'danger' || vibTone === 'danger',
  };
}

/**
 * Subscribe to real-time readings from Firebase RTDB.
 * Returns an unsubscribe callback function.
 */
export function subscribeToReadings(room = 'room', onData, onError, limitCount = 50) {
  const dbPath = room === 'room01' ? 'hospital/room01/readings' : 'hospital/room/reading';
  const readingsRef = query(ref(securityDb, dbPath), limitToLast(limitCount));

  const unsubscribe = onValue(
    readingsRef,
    (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data)
        .map(([id, val]) => normalizeReading(id, val))
        .filter(Boolean);

      // Sort newest first
      list.sort((a, b) => {
        const timeA = a.timeFormatted.dateObj ? a.timeFormatted.dateObj.getTime() : 0;
        const timeB = b.timeFormatted.dateObj ? b.timeFormatted.dateObj.getTime() : 0;
        return timeB - timeA;
      });

      onData(list);
    },
    (err) => {
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

/**
 * Fallback direct REST fetch for testing or offline verification
 */
export async function fetchReadingsRest(room = 'room') {
  const dbPath = room === 'room01' ? 'hospital/room01/readings' : 'hospital/room/reading';
  const url = `${RTDB_URL}/${dbPath}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch RTDB readings: ${res.statusText}`);
  }
  const data = await res.json();
  const list = Object.entries(data || {})
    .map(([id, val]) => normalizeReading(id, val))
    .filter(Boolean);

  list.sort((a, b) => {
    const timeA = a.timeFormatted.dateObj ? a.timeFormatted.dateObj.getTime() : 0;
    const timeB = b.timeFormatted.dateObj ? b.timeFormatted.dateObj.getTime() : 0;
    return timeB - timeA;
  });

  return list;
}

const SEC_ALERT_STATES_KEY = 'hospital_security_alert_states';
const SEC_DELETED_ALERTS_KEY = 'hospital_deleted_alert_ids';

export function getSecurityAlertStates() {
  try {
    if (typeof localStorage === 'undefined') return {};
    return JSON.parse(localStorage.getItem(SEC_ALERT_STATES_KEY) || '{}');
  } catch {
    return {};
  }
}

export function setSecurityAlertState(alertId, state) {
  try {
    if (typeof localStorage === 'undefined') return;
    const map = getSecurityAlertStates();
    map[alertId] = state;
    localStorage.setItem(SEC_ALERT_STATES_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Failed to save security alert state:', err);
  }
}

export function getDeletedAlertIds() {
  try {
    if (typeof localStorage === 'undefined') return new Set();
    const list = JSON.parse(localStorage.getItem(SEC_DELETED_ALERTS_KEY) || '[]');
    return new Set(Array.isArray(list) ? list : []);
  } catch {
    return new Set();
  }
}

export function markAlertDeleted(alertId) {
  try {
    if (typeof localStorage === 'undefined' || !alertId) return;
    const current = getDeletedAlertIds();
    current.add(alertId);
    localStorage.setItem(SEC_DELETED_ALERTS_KEY, JSON.stringify(Array.from(current)));
  } catch (err) {
    console.warn('Failed to mark alert as deleted:', err);
  }
}

export function markAlertsDeleted(alertIds = []) {
  try {
    if (typeof localStorage === 'undefined' || !alertIds?.length) return;
    const current = getDeletedAlertIds();
    alertIds.forEach((id) => {
      if (id) current.add(id);
    });
    localStorage.setItem(SEC_DELETED_ALERTS_KEY, JSON.stringify(Array.from(current)));
  } catch (err) {
    console.warn('Failed to mark alerts as deleted:', err);
  }
}

/**
 * Extract active security incident alerts (Fire, Earthquake/Vibration, Smoke, Temperature)
 * from live Firebase telemetry readings for central dashboard and alerts page display.
 * Groups contiguous packets into distinct incident events to prevent alert flood.
 */
export function extractAlertsFromSecurityReadings(readings = [], roomLabel = 'Main Hospital Ward') {
  if (!readings || readings.length === 0) return [];
  const alertList = [];
  const states = getSecurityAlertStates();
  const deletedIds = getDeletedAlertIds();

  // Load configured thresholds
  let smokeThreshold = 1400;
  let vibThreshold = 0.8;
  let tempThreshold = 38.0;
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = JSON.parse(localStorage.getItem('hospital_security_notification_settings') || '{}');
      if (saved.smokeThreshold) {
        // Auto-migrate threshold below 1350 to 1400 to account for normal ambient room AQI in India
        smokeThreshold = Number(saved.smokeThreshold) < 1350 ? 1400 : Number(saved.smokeThreshold);
      }
      if (saved.vibrationThreshold) vibThreshold = Number(saved.vibrationThreshold);
      if (saved.tempThreshold) tempThreshold = Number(saved.tempThreshold);
    }
  } catch {
    /* fallback to defaults */
  }

  // Sort chronological order (oldest to newest) to detect incident boundaries
  const chronological = [...readings].sort((a, b) => {
    const timeA = a.timeFormatted?.dateObj ? a.timeFormatted.dateObj.getTime() : new Date(a.timestamp).getTime();
    const timeB = b.timeFormatted?.dateObj ? b.timeFormatted.dateObj.getTime() : new Date(b.timestamp).getTime();
    return timeA - timeB;
  });

  // Generic incident builder for contiguous sensor events
  function buildIncidents(type, conditionFn, createAlertFn) {
    let current = null;
    for (const r of chronological) {
      if (conditionFn(r)) {
        if (!current) {
          current = { first: r, peak: r, latest: r, count: 1 };
        } else {
          current.latest = r;
          current.count++;
          if (type === 'EARTHQUAKE' && r.vibration.filtered > current.peak.vibration.filtered) current.peak = r;
          if (type === 'SMOKE' && r.smoke.filtered > current.peak.smoke.filtered) current.peak = r;
          if (type === 'TEMPERATURE' && r.temperature.filtered > current.peak.temperature.filtered) current.peak = r;
        }
      } else {
        if (current) {
          alertList.push(createAlertFn(current));
          current = null;
        }
      }
    }
    if (current) {
      alertList.push(createAlertFn(current));
    }
  }

  // 1. Optical Flame Sensor (Fire Incidents - Standard Emergency Alert)
  buildIncidents(
    'FIRE',
    (r) => r.fire?.isFire,
    (inc) => {
      const alertId = `sec-fire-${inc.first.id}`;
      return {
        id: alertId,
        type: 'FIRE',
        severity: 'critical',
        state: states[alertId] || 'new',
        title: `🔥 Active Fire Hazard in ${roomLabel}`,
        message: `Optical flame sensor triggered emergency fire alarm. Smoke density: ${inc.latest.smoke.filtered} raw, Temperature: ${inc.latest.temperature.filtered} °C. Evacuate zone immediately.`,
        checkpoint: roomLabel,
        timestamp: inc.latest.timestamp,
        isSecurityAlert: true,
        readingId: inc.latest.id,
      };
    }
  );

  // 2. Vibration Sensor (Earthquake / Seismic Shock - Standard Emergency Alert)
  buildIncidents(
    'EARTHQUAKE',
    (r) => r.vibration?.filtered >= vibThreshold,
    (inc) => {
      const alertId = `sec-vib-${inc.first.id}`;
      const countNote = inc.count > 1 ? ` (Sustained across ${inc.count} shock telemetry pulses)` : '';
      return {
        id: alertId,
        type: 'EARTHQUAKE',
        severity: 'critical',
        state: states[alertId] || 'new',
        title: `🚨 Severe Earthquake / Structural Impact in ${roomLabel}`,
        message: `Seismic accelerometer detected earthquake shock. Peak vibration: ${inc.peak.vibration.filtered} filtered (Latest: ${inc.latest.vibration.filtered}).${countNote} Inspect structural integrity and medical gas pipelines immediately.`,
        checkpoint: roomLabel,
        timestamp: inc.latest.timestamp,
        isSecurityAlert: true,
        readingId: inc.latest.id,
      };
    }
  );

  // 3. Smoke Density Anomaly (Standard Emergency Alert)
  buildIncidents(
    'SMOKE',
    (r) => r.smoke?.filtered >= smokeThreshold,
    (inc) => {
      const alertId = `sec-smoke-${inc.first.id}`;
      const countNote = inc.count > 1 ? ` (Peak: ${inc.peak.smoke.filtered} raw, Current: ${inc.latest.smoke.filtered} raw)` : '';
      return {
        id: alertId,
        type: 'SMOKE',
        severity: 'critical',
        state: states[alertId] || 'new',
        title: `💨 Dangerous Smoke Density in ${roomLabel}`,
        message: `Air quality sensor measured elevated smoke density of ${inc.latest.smoke.filtered} raw${countNote} (threshold: ${smokeThreshold}). Check HVAC ventilation and smoldering risks.`,
        checkpoint: roomLabel,
        timestamp: inc.latest.timestamp,
        isSecurityAlert: true,
        readingId: inc.latest.id,
      };
    }
  );

  // 4. Critical Thermal Heat Spike (Standard Emergency Alert)
  buildIncidents(
    'TEMPERATURE',
    (r) => r.temperature?.filtered >= tempThreshold,
    (inc) => {
      const alertId = `sec-temp-${inc.first.id}`;
      return {
        id: alertId,
        type: 'TEMPERATURE',
        severity: 'critical',
        state: states[alertId] || 'new',
        title: `🌡️ Critical Thermal Spike in ${roomLabel}`,
        message: `Ambient ward temperature reached ${inc.latest.temperature.filtered} °C (${inc.latest.temperature.fahrenheit} °F). Check room climate controls and equipment overheat.`,
        checkpoint: roomLabel,
        timestamp: inc.latest.timestamp,
        isSecurityAlert: true,
        readingId: inc.latest.id,
      };
    }
  );

  // Filter out alerts that have been deleted by the user
  const activeAlerts = alertList.filter((a) => !deletedIds.has(a.id));

  // Sort newest first
  activeAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return activeAlerts;
}
