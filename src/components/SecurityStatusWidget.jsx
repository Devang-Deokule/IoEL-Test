import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, ShieldCheck, ShieldAlert, Wind, Thermometer, Activity, ArrowRight } from 'lucide-react';
import { subscribeToReadings } from '../services/securityMonitoringService';

export default function SecurityStatusWidget() {
  const [latest, setLatest] = useState(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let unsubscribe;
    try {
      unsubscribe = subscribeToReadings(
        'room',
        (list) => {
          if (list && list.length > 0) {
            setLatest(list[0]);
            setIsLive(true);
          }
        },
        () => setIsLive(false),
        1
      );
    } catch {
      setIsLive(false);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const isFire = latest?.fire?.isFire ?? false;
  const hasHazard = isFire || latest?.hasAnomaly;

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        hasHazard
          ? 'border-danger bg-danger-bg/40 animate-pulse'
          : 'border-line bg-surface hover:shadow-sm'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              hasHazard ? 'bg-danger text-white' : 'bg-brand-50 text-brand-700'
            }`}
          >
            {hasHazard ? <Flame size={20} /> : <ShieldAlert size={20} />}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-ink">Room Security & IoT Telemetry</h3>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  isLive ? 'bg-ok-bg text-ok' : 'bg-warn-bg text-warn'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-ok animate-ping' : 'bg-warn'}`} />
                {isLive ? 'Live Stream' : 'Connecting'}
              </span>
            </div>
            <p className="text-xs text-ink-mute">
              Monitored Zone: <strong className="text-ink">Main Hospital Ward</strong>
              {latest ? ` • Last signal: ${latest.timeFormatted.time}` : ''}
            </p>
          </div>
        </div>

        {/* Telemetry pill badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Fire Status */}
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold ${
              isFire ? 'bg-danger text-white' : 'bg-ok-bg text-ok'
            }`}
          >
            {isFire ? <Flame size={13} /> : <ShieldCheck size={13} />}
            <span>{latest ? latest.fire.status : 'Checking...'}</span>
          </span>

          {/* Smoke */}
          {latest && (
            <span className="inline-flex items-center gap-1 rounded-md border border-line bg-canvas px-2.5 py-1 text-ink-soft">
              <Wind size={13} className="text-warn" />
              <span>{latest.smoke.filtered}</span>
            </span>
          )}

          {/* Temp */}
          {latest && (
            <span className="inline-flex items-center gap-1 rounded-md border border-line bg-canvas px-2.5 py-1 text-ink-soft">
              <Thermometer size={13} className="text-brand-600" />
              <span>{latest.temperature.filtered} °C</span>
            </span>
          )}

          {/* Vibration */}
          {latest && (
            <span className="inline-flex items-center gap-1 rounded-md border border-line bg-canvas px-2.5 py-1 text-ink-soft">
              <Activity size={13} className="text-purple-600" />
              <span>{latest.vibration.filtered}</span>
            </span>
          )}

          <Link
            to="/security-monitoring"
            className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1 font-medium text-white hover:bg-brand-700 transition-colors"
          >
            <span>Live Console</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
