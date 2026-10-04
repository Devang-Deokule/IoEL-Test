import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Flame,
  ShieldAlert,
  ShieldCheck,
  Wind,
  Thermometer,
  Activity,
  Volume2,
  VolumeX,
  RefreshCw,
  AlertTriangle,
  Radio,
  Eye,
  Download,
  Filter,
  Sliders,
  CheckCircle2,
  Clock,
  Zap,
  Mail,
  Bell,
} from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { Card, CardHeader } from '../components/Card';
import SensorTelemetryChart from '../components/SensorTelemetryChart';
import NotificationSettingsModal from '../components/NotificationSettingsModal';
import {
  DEFAULT_ROOMS,
  subscribeToReadings,
  fetchReadingsRest,
  extractAlertsFromSecurityReadings,
} from '../services/securityMonitoringService';
import { syncAlertNotifications } from '../services/notificationService';
import { sirenService } from '../services/sirenService';

// Web Audio API emergency beep generator
function playEmergencySiren() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1100, ctx.currentTime + 0.15);
    osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (err) {
    // Audio autoplay might be suspended until user interaction
  }
}

export default function SecurityMonitoring() {
  usePageTitle('Security Monitoring');

  const [selectedRoom, setSelectedRoom] = useState('room');
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'alerts' | 'fire'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalItem, setActiveModalItem] = useState(null);

  // Notification Modal state
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Siren interval ref
  const sirenIntervalRef = useRef(null);

  // Real-time Firebase RTDB Subscription
  useEffect(() => {
    setLoading(true);
    setError(null);
    let unsubscribe = null;

    try {
      unsubscribe = subscribeToReadings(
        selectedRoom,
        (data) => {
          setReadings(data);
          setLoading(false);
          setIsLive(true);
          setLastUpdated(new Date());

          // Automatically evaluate and dispatch Email & Push Notifications if anomalies occur
          if (data && data.length > 0) {
            const roomLabel = selectedRoom === 'room' ? 'Main Hospital Ward' : 'Room 01';
            const secAlerts = extractAlertsFromSecurityReadings(data, roomLabel);
            syncAlertNotifications(secAlerts, roomLabel, data[0]);
          }
        },
        (err) => {
          console.warn('RTDB onValue error, trying REST fallback:', err);
          setError(err.message);
          // Attempt REST fallback
          fetchReadingsRest(selectedRoom)
            .then((data) => {
              setReadings(data);
              setLoading(false);
              setLastUpdated(new Date());
            })
            .catch((e) => {
              setError(e.message);
              setLoading(false);
            });
        }
      );
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedRoom]);

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setLoading(true);
    try {
      const data = await fetchReadingsRest(selectedRoom);
      setReadings(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Strictly use live real-time Firebase RTDB reading
  const latestReading = useMemo(() => {
    return readings[0] || null;
  }, [readings]);

  const isCurrentFireAlert = latestReading?.fire?.isFire ?? false;
  const isCurrentSmokeAlert = latestReading?.smoke?.tone === 'danger';
  const isCurrentTempAlert = latestReading?.temperature?.tone === 'danger';
  const isCurrentVibAlert = latestReading?.vibration?.tone === 'danger';
  const isCurrentEmergencyAlert =
    isCurrentFireAlert || isCurrentSmokeAlert || isCurrentTempAlert || isCurrentVibAlert;

  // Audio siren effect on any active emergency threat
  useEffect(() => {
    if (isCurrentEmergencyAlert && soundEnabled) {
      playEmergencySiren();
      sirenIntervalRef.current = setInterval(playEmergencySiren, 1200);
    } else {
      if (sirenIntervalRef.current) {
        clearInterval(sirenIntervalRef.current);
        sirenIntervalRef.current = null;
      }
    }
    return () => {
      if (sirenIntervalRef.current) clearInterval(sirenIntervalRef.current);
    };
  }, [isCurrentEmergencyAlert, soundEnabled]);

  // Filtered readings list
  const filteredReadings = useMemo(() => {
    return readings.filter((r) => {
      const matchesSearch =
        searchQuery === '' ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.timeFormatted.full.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterType === 'fire') {
        return r.fire?.isFire;
      }
      if (filterType === 'earthquake') {
        return r.vibration?.tone === 'danger' || r.vibration?.filtered >= 0.8;
      }
      if (filterType === 'smoke') {
        return r.smoke?.tone === 'danger' || r.smoke?.filtered >= 1400;
      }
      if (filterType === 'temp') {
        return r.temperature?.tone === 'danger' || r.temperature?.filtered >= 38.0;
      }
      if (filterType === 'alerts') {
        return (
          r.hasAnomaly ||
          r.fire?.isFire ||
          r.smoke?.tone === 'danger' ||
          r.temperature?.tone === 'danger' ||
          r.vibration?.tone === 'danger'
        );
      }
      return true;
    });
  }, [readings, filterType, searchQuery]);

  // Stats calculation across all threats
  const totalReadings = readings.length;
  const anomaliesCount = readings.filter(
    (r) =>
      r.hasAnomaly ||
      r.fire?.isFire ||
      r.smoke?.tone === 'danger' ||
      r.temperature?.tone === 'danger' ||
      r.vibration?.tone === 'danger'
  ).length;
  const fireCount = readings.filter((r) => r.fire?.isFire).length;
  const earthquakeCount = readings.filter(
    (r) => r.vibration?.tone === 'danger' || r.vibration?.filtered >= 0.8
  ).length;
  const smokeCount = readings.filter(
    (r) => r.smoke?.tone === 'danger' || r.smoke?.filtered >= 1400
  ).length;
  const tempCount = readings.filter(
    (r) => r.temperature?.tone === 'danger' || r.temperature?.filtered >= 38.0
  ).length;

  // Export CSV
  const handleExportCSV = () => {
    if (readings.length === 0) return;
    const headers = ['ID', 'Timestamp', 'Fire Status', 'Smoke Level', 'Temperature (C)', 'Vibration'];
    const rows = readings.map((r) => [
      r.id,
      r.timestamp,
      r.fire.status,
      r.smoke.filtered,
      r.temperature.filtered,
      r.vibration.filtered,
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security_telemetry_${selectedRoom}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Live Stream Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-line bg-gradient-to-r from-chrome to-surface p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
              <ShieldAlert size={18} />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-ink">Security & Environmental Telemetry</h1>
          </div>
          <p className="text-xs text-ink-soft sm:text-sm">
            Continuous multi-sensor telemetry for ward safety, optical flame detection, smoke, and vibration.
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Room Selector */}
          <div className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs">
            <span className="font-medium text-ink-soft">Zone:</span>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="bg-transparent font-semibold text-ink focus:outline-none cursor-pointer"
            >
              {DEFAULT_ROOMS.map((rm) => (
                <option key={rm.id} value={rm.id}>
                  {rm.label}
                </option>
              ))}
            </select>
          </div>

          {/* Connection Status Pill */}
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              isLive ? 'bg-ok-bg text-ok' : 'bg-warn-bg text-warn'
            }`}
            title="Real-time WebSocket connection to Firebase RTDB"
          >
            <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-ok animate-pulse' : 'bg-warn'}`} />
            <span>{isLive ? 'RTDB Live' : 'Polling'}</span>
          </div>

          {/* Alert Channels (Email & Push Notifications) */}
          <button
            type="button"
            onClick={() => setIsNotificationModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-canvas transition-colors"
            title="Configure automated email alerts and desktop push notifications"
          >
            <Bell size={14} className="text-brand-600" />
            <span className="hidden sm:inline">Alert Channels</span>
          </button>

          {/* Audio Siren Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              soundEnabled
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-line bg-surface text-ink-soft hover:bg-canvas'
            }`}
            title={soundEnabled ? 'Emergency sound enabled' : 'Emergency sound muted'}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span className="hidden sm:inline">{soundEnabled ? 'Siren On' : 'Siren Muted'}</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-canvas disabled:opacity-50"
            title="Fetch latest telemetry"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* CRITICAL EMERGENCY FIRE BANNER (when fire detected) */}
      {isCurrentFireAlert && (
        <div className="relative overflow-hidden rounded-xl border-2 border-danger bg-danger-bg p-5 text-ink shadow-md animate-pulse">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-danger text-white shadow-lg">
                <Flame size={28} className="animate-bounce" />
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-danger px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
                    Emergency Alert
                  </span>
                  <span className="text-xs font-semibold text-danger">
                    Detected at {latestReading?.timeFormatted?.time || 'Just now'}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-danger">
                  CRITICAL: FIRE HAZARD DETECTED IN MONITORED WARD
                </h2>
                <p className="text-xs text-ink-soft md:text-sm">
                  The optical flame detector has triggered an active fire hazard signal. Smoke density is currently{' '}
                  <strong className="text-ink">{latestReading?.smoke?.filtered} raw</strong> and ambient temperature is{' '}
                  <strong className="text-ink">{latestReading?.temperature?.filtered} °C</strong>.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => alert('Fire alarm dispatched to Central Security & Hospital Fire Marshall!')}
                className="btn btn-sm bg-danger font-semibold text-white hover:bg-danger/90 shadow-sm"
              >
                Dispatch Fire Response
              </button>
              <button
                type="button"
                onClick={() => alert('Zone evacuation alert broadcasted to nursing station.')}
                className="btn btn-sm btn-secondary"
              >
                Evacuate Ward
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4 CORE SENSOR TELEMETRY METRIC CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Flame / Fire Sensor */}
        <div
          className={`flex flex-col justify-between rounded-xl border p-5 transition-shadow hover:shadow-md ${
            isCurrentFireAlert
              ? 'border-danger bg-danger-bg/40'
              : 'border-line bg-surface'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-ink-mute">Fire Detection</p>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-ink">
                {latestReading ? latestReading.fire.status : 'Connecting...'}
              </h3>
            </div>
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                isCurrentFireAlert ? 'bg-danger text-white' : 'bg-ok-bg text-ok'
              }`}
            >
              {isCurrentFireAlert ? <Flame size={22} /> : <ShieldCheck size={22} />}
            </span>
          </div>

          <div className="mt-4 border-t border-line/60 pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-soft">Sensor Status</span>
              <span
                className={`font-semibold ${
                  isCurrentFireAlert ? 'text-danger' : 'text-ok'
                }`}
              >
                {isCurrentFireAlert ? 'Hazard Active' : 'Normal / Secure'}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-ink-mute">
              Optical flame sensor with automatic noise cancellation.
            </p>
          </div>
        </div>

        {/* Card 2: Smoke Density Sensor */}
        <div
          className={`flex flex-col justify-between rounded-xl border p-5 transition-shadow hover:shadow-md ${
            isCurrentSmokeAlert
              ? 'border-danger bg-danger-bg/40 animate-pulse'
              : 'border-line bg-surface'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-ink-mute">Smoke Density</p>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-ink">
                {latestReading ? `${latestReading.smoke.filtered}` : '--'}
                <span className="ml-1 text-xs font-normal text-ink-mute">raw</span>
              </h3>
            </div>
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                isCurrentSmokeAlert ? 'bg-danger text-white' : 'bg-warn-bg text-warn'
              }`}
            >
              <Wind size={22} />
            </span>
          </div>

          <div className="mt-4 space-y-2 border-t border-line/60 pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-soft">Air Status</span>
              <span
                className={`font-semibold ${
                  latestReading?.smoke.tone === 'danger'
                    ? 'text-danger'
                    : latestReading?.smoke.tone === 'warn'
                    ? 'text-warn'
                    : 'text-ok'
                }`}
              >
                {latestReading ? latestReading.smoke.status : 'Normal'}
              </span>
            </div>
            {/* Visual Level Bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-line">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  latestReading?.smoke.filtered >= 1400
                    ? 'bg-danger'
                    : latestReading?.smoke.filtered >= 1280
                    ? 'bg-warn'
                    : 'bg-ok'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(10, ((latestReading?.smoke.filtered || 800) / 1600) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Ambient Temperature */}
        <div
          className={`flex flex-col justify-between rounded-xl border p-5 transition-shadow hover:shadow-md ${
            isCurrentTempAlert
              ? 'border-danger bg-danger-bg/40 animate-pulse'
              : 'border-line bg-surface'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-ink-mute">Ambient Temperature</p>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-ink">
                {latestReading ? `${latestReading.temperature.filtered} °C` : '--'}
                <span className="ml-1.5 text-xs font-normal text-ink-mute">
                  ({latestReading ? latestReading.temperature.fahrenheit : '--'} °F)
                </span>
              </h3>
            </div>
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                isCurrentTempAlert ? 'bg-danger text-white' : 'bg-brand-100 text-brand-600'
              }`}
            >
              <Thermometer size={22} />
            </span>
          </div>

          <div className="mt-4 border-t border-line/60 pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-soft">Thermal Range</span>
              <span
                className={`font-semibold ${
                  latestReading?.temperature.tone === 'danger'
                    ? 'text-danger'
                    : latestReading?.temperature.tone === 'warn'
                    ? 'text-warn'
                    : 'text-ok'
                }`}
              >
                {latestReading ? latestReading.temperature.status : 'Optimal'}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-ink-mute">
              Target Ward Temp: 20.0 °C – 26.0 °C
            </p>
          </div>
        </div>

        {/* Card 4: Earthquake & Vibration Detection */}
        <div
          className={`flex flex-col justify-between rounded-xl border p-5 transition-shadow hover:shadow-md ${
            isCurrentVibAlert
              ? 'border-danger bg-danger-bg/40 animate-pulse'
              : 'border-line bg-surface'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-ink-mute">Earthquake & Seismic Shock</p>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-ink">
                {latestReading ? `${latestReading.vibration.filtered}` : '--'}
                <span className="ml-1 text-xs font-normal text-ink-mute">filtered</span>
              </h3>
            </div>
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                isCurrentVibAlert ? 'bg-danger text-white' : 'bg-brand-50 text-brand-700'
              }`}
            >
              <Activity size={22} />
            </span>
          </div>

          <div className="mt-4 border-t border-line/60 pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-soft">Seismic Activity</span>
              <span
                className={`font-semibold ${
                  latestReading?.vibration.tone === 'danger'
                    ? 'text-danger'
                    : latestReading?.vibration.tone === 'warn'
                    ? 'text-warn'
                    : 'text-ok'
                }`}
              >
                {latestReading ? latestReading.vibration.status : 'Stable'}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-ink-mute">
              Real-time seismic accelerometer for earthquake and structural disturbance detection.
            </p>
          </div>
        </div>
      </div>

      {/* INTERACTIVE TELEMETRY TRENDS SECTION */}
      <Card>
        <CardHeader
          title="Live Sensor Telemetry Trends"
          description="Interactive multi-channel telemetry streams from the room security IoT nodes."
          action={
            <div className="flex items-center gap-2 text-xs text-ink-mute">
              <Clock size={13} />
              <span>
                Last reading: {latestReading?.timeFormatted?.time || 'Awaiting stream...'}
              </span>
            </div>
          }
        />
        <div className="p-5">
          <SensorTelemetryChart readings={readings} />
        </div>
      </Card>

      {/* FILTERABLE SENSOR HISTORY & AUDIT LOG */}
      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">Telemetry Stream History</h2>
            <p className="text-xs text-ink-mute">
              Real-time chronologically indexed sensor packets stored in Firebase RTDB.
            </p>
          </div>

          {/* Table Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-line bg-canvas p-1 text-xs">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-surface text-ink shadow-sm'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                All ({totalReadings})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('alerts')}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  filterType === 'alerts'
                    ? 'bg-danger text-white shadow-sm font-semibold'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                All Alerts ({anomaliesCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('fire')}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  filterType === 'fire'
                    ? 'bg-danger text-white shadow-sm font-semibold'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                🔥 Fire ({fireCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('earthquake')}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  filterType === 'earthquake'
                    ? 'bg-danger text-white shadow-sm font-semibold'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                🚨 Earthquake ({earthquakeCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('smoke')}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  filterType === 'smoke'
                    ? 'bg-danger text-white shadow-sm font-semibold'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                💨 Smoke ({smokeCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('temp')}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  filterType === 'temp'
                    ? 'bg-danger text-white shadow-sm font-semibold'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                🌡️ Temp Spike ({tempCount})
              </button>
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search packet ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-36 rounded-md border border-line bg-surface px-2.5 text-xs text-ink placeholder:text-ink-mute focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-44"
            />

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-xs font-medium text-ink-soft hover:bg-canvas hover:text-ink"
              title="Export readings to CSV"
            >
              <Download size={13} />
              <span className="hidden md:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas text-xs font-medium text-ink-soft">
              <tr>
                <th className="px-5 py-3">Packet ID</th>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Fire Status</th>
                <th className="px-5 py-3">Smoke Density</th>
                <th className="px-5 py-3">Temperature</th>
                <th className="px-5 py-3">Vibration / Seismic</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {filteredReadings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-ink-mute">
                    No telemetry records matched the current filter.
                  </td>
                </tr>
              ) : (
                filteredReadings.map((row) => {
                  const isFire = row.fire?.isFire;
                  const isSmokeAlert = row.smoke?.tone === 'danger' || row.smoke?.filtered >= 1400;
                  const isSmokeWarn = !isSmokeAlert && row.smoke?.tone === 'warn';
                  const isTempAlert = row.temperature?.tone === 'danger' || row.temperature?.filtered >= 38.0;
                  const isTempWarn = !isTempAlert && row.temperature?.tone === 'warn';
                  const isVibAlert = row.vibration?.tone === 'danger' || row.vibration?.filtered >= 0.8;
                  const isVibWarn = !isVibAlert && (row.vibration?.tone === 'warn' || row.vibration?.filtered >= 0.3);
                  const hasRowAlert = isFire || isSmokeAlert || isTempAlert || isVibAlert;

                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors hover:bg-canvas/50 ${
                        hasRowAlert ? 'bg-danger-bg/40 font-medium' : ''
                      }`}
                    >
                      {/* ID */}
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs font-medium text-ink">
                        <span className="rounded bg-brand-50 px-1.5 py-0.5 text-brand-700">
                          {row.id}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-ink-soft">
                        <div className="font-medium text-ink">{row.timeFormatted.time}</div>
                        <div className="text-[11px] text-ink-mute">{row.timeFormatted.date} ({row.timeFormatted.relative})</div>
                      </td>

                      {/* Fire Status */}
                      <td className="whitespace-nowrap px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isFire
                              ? 'bg-danger text-white shadow-sm animate-pulse'
                              : 'bg-ok-bg text-ok'
                          }`}
                        >
                          {isFire ? <Flame size={12} /> : <CheckCircle2 size={12} />}
                          <span>{row.fire.status}</span>
                        </span>
                      </td>

                      {/* Smoke */}
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isSmokeAlert
                              ? 'bg-danger text-white shadow-sm animate-pulse'
                              : isSmokeWarn
                              ? 'bg-amber-100 text-amber-800'
                              : 'text-ink'
                          }`}
                        >
                          {isSmokeAlert && <Wind size={12} />}
                          <span>{row.smoke.filtered}</span>
                          {isSmokeAlert && <span className="text-[10px] uppercase font-bold">(Smoke Alert)</span>}
                        </span>
                      </td>

                      {/* Temperature */}
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isTempAlert
                              ? 'bg-danger text-white shadow-sm animate-pulse'
                              : isTempWarn
                              ? 'bg-amber-100 text-amber-800'
                              : 'text-ink'
                          }`}
                        >
                          {isTempAlert && <Thermometer size={12} />}
                          <span>{row.temperature.filtered} °C</span>
                          {isTempAlert && <span className="text-[10px] uppercase font-bold">(Heat Spike)</span>}
                          {!isTempAlert && (
                            <span className="ml-1 text-[11px] text-ink-mute font-normal">
                              ({row.temperature.fahrenheit} °F)
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Vibration */}
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isVibAlert
                              ? 'bg-danger text-white shadow-sm animate-pulse'
                              : isVibWarn
                              ? 'bg-amber-100 text-amber-800'
                              : 'text-ink'
                          }`}
                        >
                          {isVibAlert && <Activity size={12} />}
                          <span>{row.vibration.filtered}</span>
                          {isVibAlert && <span className="text-[10px] uppercase font-bold">(Earthquake)</span>}
                          {isVibWarn && <span className="text-[10px] uppercase font-medium">(Disturbance)</span>}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setActiveModalItem(row)}
                          className="inline-flex items-center gap-1 rounded border border-line px-2 py-1 text-xs text-ink-soft hover:bg-canvas hover:text-ink"
                        >
                          <Eye size={12} />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* INSPECT MODAL */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-surface p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-base font-bold text-ink">Telemetry Node Inspection</h3>
                <p className="text-xs text-ink-mute font-mono">{activeModalItem.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                className="rounded-md p-1 text-ink-mute hover:bg-canvas hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-line bg-canvas p-3">
                  <p className="text-ink-mute">Timestamp</p>
                  <p className="font-semibold text-ink">{activeModalItem.timeFormatted.full}</p>
                  <p className="text-[11px] text-ink-mute">{activeModalItem.timestamp}</p>
                </div>
                <div className="rounded-lg border border-line bg-canvas p-3">
                  <p className="text-ink-mute">Fire Detector</p>
                  <p
                    className={`font-bold ${
                      activeModalItem.fire.isFire ? 'text-danger' : 'text-ok'
                    }`}
                  >
                    {activeModalItem.fire.status}
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-canvas p-3">
                  <p className="text-ink-mute">Smoke Level</p>
                  <p
                    className={`font-bold ${
                      activeModalItem.smoke.tone === 'danger'
                        ? 'text-danger'
                        : activeModalItem.smoke.tone === 'warn'
                        ? 'text-warn'
                        : 'text-ink'
                    }`}
                  >
                    {activeModalItem.smoke.filtered} raw
                  </p>
                  <p className="text-ink-mute">Status: {activeModalItem.smoke.status}</p>
                </div>
                <div className="rounded-lg border border-line bg-canvas p-3">
                  <p className="text-ink-mute">Temperature</p>
                  <p
                    className={`font-bold ${
                      activeModalItem.temperature.tone === 'danger'
                        ? 'text-danger'
                        : activeModalItem.temperature.tone === 'warn'
                        ? 'text-warn'
                        : 'text-ink'
                    }`}
                  >
                    {activeModalItem.temperature.filtered} °C
                  </p>
                  <p className="text-ink-mute">{activeModalItem.temperature.fahrenheit} °F</p>
                </div>
                <div className="rounded-lg border border-line bg-canvas p-3 sm:col-span-2">
                  <p className="text-ink-mute">Earthquake & Vibration</p>
                  <p
                    className={`font-bold ${
                      activeModalItem.vibration.tone === 'danger'
                        ? 'text-danger'
                        : activeModalItem.vibration.tone === 'warn'
                        ? 'text-warn'
                        : 'text-ink'
                    }`}
                  >
                    {activeModalItem.vibration.filtered} filtered
                  </p>
                  <p className="text-ink-mute">Status: {activeModalItem.vibration.status}</p>
                </div>
              </div>

              <div className="rounded-lg border border-line bg-canvas p-3">
                <p className="font-semibold text-ink mb-1">Raw Database Payload</p>
                <pre className="overflow-x-auto font-mono text-[11px] text-ink-soft bg-surface p-2 rounded border border-line">
                  {JSON.stringify(
                    {
                      id: activeModalItem.id,
                      fire: { status: activeModalItem.fire.status },
                      smoke: { filtered: activeModalItem.smoke.filtered },
                      temperature: { filtered: activeModalItem.temperature.filtered },
                      vibration: { filtered: activeModalItem.vibration.filtered },
                      timestamp: activeModalItem.timestamp,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                className="btn btn-primary btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATION SETTINGS MODAL */}
      <NotificationSettingsModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />
    </div>
  );
}
