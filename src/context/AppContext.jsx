import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import { IN_TRANSIT, LOCATIONS } from '../data/constants';
import {
  subscribeToReadings,
  extractAlertsFromSecurityReadings,
} from '../services/securityMonitoringService';
import { syncAlertNotifications } from '../services/notificationService';
import { sirenService } from '../services/sirenService';

export const AppContext = createContext(null);

const LED_FLASH_MS = 3000;
const TOAST_MS = 4500;

export function AppProvider({ children }) {
  const [assets, setAssets] = useState([]);
  const [history, setHistory] = useState([]);
  const [assetAlerts, setAssetAlerts] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sirenMuted, setSirenMuted] = useState(false);

  // Subscribe to live Firebase RTDB security telemetry to generate central alerts
  useEffect(() => {
    let unsubscribe;
    try {
      unsubscribe = subscribeToReadings('room', (readings) => {
        if (readings && readings.length > 0) {
          const secAlerts = extractAlertsFromSecurityReadings(readings, 'Main Hospital Ward');
          setSecurityAlerts(secAlerts);

          // Synchronize Desktop Push Notifications & Emails directly with active website alerts
          syncAlertNotifications(secAlerts, 'Main Hospital Ward', readings[0]);
        }
      });
    } catch (err) {
      console.warn('Real-time security alert subscription error:', err);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Merged alerts list: Live Security Alerts (Fire, Earthquake, Smoke, Temp) + Asset Alerts
  const alerts = useMemo(() => {
    const combined = [...securityAlerts, ...assetAlerts];
    combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return combined;
  }, [securityAlerts, assetAlerts]);

  // Emergency Siren Sound Control: Active when ANY security hazard alert is unacknowledged ('new')
  const hasActiveEmergency = useMemo(
    () => alerts.some((a) => a.isSecurityAlert && a.state === 'new'),
    [alerts]
  );

  useEffect(() => {
    if (hasActiveEmergency && !sirenMuted) {
      sirenService.start();
    } else {
      sirenService.stop();
    }
    return () => {
      sirenService.stop();
    };
  }, [hasActiveEmergency, sirenMuted]);

  const toggleSilenceSiren = useCallback(() => {
    setSirenMuted((prev) => {
      const next = !prev;
      if (next) {
        sirenService.stop();
      } else if (hasActiveEmergency) {
        sirenService.start();
      }
      return next;
    });
  }, [hasActiveEmergency]);

  const silenceSiren = useCallback(() => {
    setSirenMuted(true);
    sirenService.stop();
  }, []);

  const [scanning, setScanning] = useState(false);
  const [led, setLed] = useState('ready'); // ready | entry | exit | alert
  const [toast, setToast] = useState(null);

  const ledTimer = useRef(null);
  const toastTimer = useRef(null);

  const notify = useCallback((message, tone = 'info') => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, tone });
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  // Mirrors the hardware: a result LED lights briefly, then the blue "ready" LED returns.
  const flashLed = useCallback((state) => {
    clearTimeout(ledTimer.current);
    setLed(state);
    ledTimer.current = setTimeout(() => setLed('ready'), LED_FLASH_MS);
  }, []);

  const loadAll = useCallback(async () => {
    const [a, h, al, c] = await Promise.all([
      api.getAssets(),
      api.getHistory(),
      api.getAlerts(),
      api.getCheckpoints(),
    ]);
    setAssets(a);
    setHistory(h);
    setAssetAlerts(al);
    setCheckpoints(c);
  }, []);

  const initialLoad = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await loadAll();
    } catch (e) {
      setError(e.message || 'Could not load data');
    } finally {
      setLoading(false);
    }
  }, [loadAll]);

  useEffect(() => {
    initialLoad();
    return () => {
      clearTimeout(ledTimer.current);
      clearTimeout(toastTimer.current);
    };
  }, [initialLoad]);

  const currentCheckpoint = useMemo(
    () => checkpoints.find((c) => c.status === 'active') ?? null,
    [checkpoints],
  );

  // ---- actions ------------------------------------------------------------

  const selectCheckpoint = useCallback(
    async (id) => {
      try {
        const list = await api.activateCheckpoint(id);
        setCheckpoints(list);
        setLed('ready');
        const cp = list.find((c) => c.id === id);
        notify(`RC522 #1 is now the ${cp.title} checkpoint.`, 'success');
      } catch (e) {
        notify(e.message, 'danger');
      }
    },
    [notify],
  );

  // Frontend-only helper. In production the ESP32 calls POST /scan and the UI just reloads data.
  const simulateScan = useCallback(
    async (rfidUid) => {
      if (!currentCheckpoint || scanning) return null;
      setScanning(true);
      try {
        const result = await api.postScan({ rfidUid, checkpointId: currentCheckpoint.id });
        await loadAll();

        if (result.event === 'ALERT') {
          flashLed('alert');
          notify(`Unknown RFID ${result.historyEntry.rfidUid} detected at ${currentCheckpoint.title}.`, 'danger');
        } else if (result.event === 'ENTRY') {
          flashLed('entry');
          notify(`${result.asset.name} ${result.asset.id} entered ${result.asset.location}.`, 'success');
        } else {
          flashLed('exit');
          notify(`${result.asset.name} ${result.asset.id} left ${result.historyEntry.previousLocation}.`, 'warning');
        }
        if (result.alert) notify(result.alert.message, 'warning');
        return result;
      } catch (e) {
        flashLed('alert');
        notify(e.message || 'Scan failed', 'danger');
        return null;
      } finally {
        setScanning(false);
      }
    },
    [currentCheckpoint, scanning, loadAll, flashLed, notify],
  );

  const updateAssetStatus = useCallback(
    async (id, status) => {
      try {
        const updated = await api.updateAssetStatus(id, status);
        setAssets((prev) => prev.map((a) => (a.id === id ? updated : a)));
        notify(`${updated.name} ${updated.id} status set to ${status}.`, 'success');
        return updated;
      } catch (e) {
        notify(e.message, 'danger');
        return null;
      }
    },
    [notify],
  );

  const addAsset = useCallback(
    async (payload) => {
      // Errors are thrown to the form so it can show them next to the fields.
      const created = await api.createAsset(payload);
      setAssets((prev) => [...prev, created]);
      notify(`${created.name} added as ${created.id}.`, 'success');
      return created;
    },
    [notify],
  );

  const setAlertState = useCallback(
    async (id, state) => {
      try {
        await api.updateAlertState(id, state);
        if (String(id).startsWith('sec-')) {
          setSecurityAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, state } : a)));
        } else {
          setAssetAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, state } : a)));
        }
        notify(`Alert state changed to ${state}.`, 'success');
      } catch (e) {
        notify(e.message || 'Could not update alert', 'danger');
      }
    },
    [notify],
  );

  const deleteAlert = useCallback(
    async (id) => {
      try {
        await api.deleteAlert(id);
        if (String(id).startsWith('sec-')) {
          setSecurityAlerts((prev) => prev.filter((a) => a.id !== id));
        } else {
          setAssetAlerts((prev) => prev.filter((a) => a.id !== id));
        }
        notify('Alert deleted successfully.', 'success');
      } catch (e) {
        notify(e.message || 'Could not delete alert', 'danger');
      }
    },
    [notify],
  );

  const deleteAcknowledgedAlerts = useCallback(async () => {
    const ackAlerts = alerts.filter((a) => a.state === 'acknowledged');
    if (ackAlerts.length === 0) {
      notify('No acknowledged alerts to delete.', 'info');
      return 0;
    }

    const count = ackAlerts.length;
    const ackIds = ackAlerts.map((a) => a.id);

    try {
      if (api.deleteAlerts) {
        await api.deleteAlerts(ackIds);
      } else {
        await Promise.allSettled(ackIds.map((id) => api.deleteAlert(id)));
      }
      setSecurityAlerts((prev) => prev.filter((a) => a.state !== 'acknowledged'));
      setAssetAlerts((prev) => prev.filter((a) => a.state !== 'acknowledged'));
      notify(`Deleted ${count} acknowledged alert${count > 1 ? 's' : ''}.`, 'success');
      return count;
    } catch (e) {
      notify(e.message || 'Could not delete acknowledged alerts', 'danger');
      return 0;
    }
  }, [alerts, notify]);

  const resetDemo = useCallback(async () => {
    try {
      await api.resetDemo();
      await loadAll();
      setLed('ready');
      notify('Demo data restored.', 'success');
    } catch (e) {
      notify(e.message, 'danger');
    }
  }, [loadAll, notify]);

  // ---- derived data -------------------------------------------------------

  const stats = useMemo(() => {
    const count = (status) => assets.filter((a) => a.status === status).length;
    return {
      total: assets.length,
      available: count('Available'),
      inUse: count('In Use'),
      maintenance: count('Maintenance'),
      openAlerts: alerts.filter((a) => a.state === 'new').length,
    };
  }, [assets, alerts]);

  const locationCounts = useMemo(() => {
    const rows = LOCATIONS.map((l) => ({
      name: l.name,
      short: l.short,
      count: assets.filter((a) => a.location === l.name).length,
    }));
    const transit = assets.filter((a) => a.location === IN_TRANSIT).length;
    if (transit > 0) rows.push({ name: IN_TRANSIT, short: IN_TRANSIT, count: transit });
    return rows;
  }, [assets]);

  // history is newest-first
  const lastValidScan = useMemo(() => history.find((h) => h.event !== 'ALERT') ?? null, [history]);
  const lastInvalidScan = useMemo(() => (history[0]?.event === 'ALERT' ? history[0] : null), [history]);

  const value = {
    assets,
    history,
    alerts,
    checkpoints,
    currentCheckpoint,
    stats,
    locationCounts,
    lastValidScan,
    lastInvalidScan,
    led,
    scanning,
    loading,
    error,
    toast,
    retry: initialLoad,
    notify,
    dismissToast,
    selectCheckpoint,
    simulateScan,
    updateAssetStatus,
    addAsset,
    setAlertState,
    deleteAlert,
    deleteAcknowledgedAlerts,
    hasActiveEmergency,
    sirenActive: hasActiveEmergency && !sirenMuted,
    sirenMuted,
    toggleSilenceSiren,
    silenceSiren,
    resetDemo,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
