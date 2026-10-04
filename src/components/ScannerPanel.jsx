import { useState } from 'react';
import { Radio, ScanLine } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { isMockMode } from '../services/api';
import { DEFAULT_SIM_UID, UNKNOWN_SIM_UID } from '../data/constants';
import { EventBadge } from './Badge';
import LedStrip, { LED_BY_KEY } from './LedIndicator';
import { formatTimestamp } from '../utils/format';

const STATUS_TEXT = {
  ready: 'Ready',
  entry: 'Entry recorded',
  exit: 'Exit recorded',
  alert: 'Invalid tag',
};

export default function ScannerPanel() {
  const { currentCheckpoint, assets, led, scanning, simulateScan, lastValidScan, lastInvalidScan } = useApp();
  const [tag, setTag] = useState(DEFAULT_SIM_UID);

  const sortedAssets = [...assets].sort((a, b) => a.id.localeCompare(b.id));

  return (
    <section aria-label="RFID checkpoint" className="rounded-xl bg-ink p-5 text-white">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Radio size={16} aria-hidden /> RFID checkpoint
        </h2>
        {isMockMode && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/70">Simulated</span>}
      </div>

      <div className="mt-5">
        <p className="text-xs text-white/60">Current checkpoint</p>
        <p className="mt-0.5 text-2xl font-semibold">{currentCheckpoint?.title ?? 'None selected'}</p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-xs text-white/60">Reader</dt>
          <dd className="mt-0.5">{currentCheckpoint?.reader ?? 'Not assigned'}</dd>
        </div>
        <div>
          <dt className="text-xs text-white/60">Status</dt>
          <dd className="mt-0.5 flex items-center gap-2" aria-live="polite">
            <span className={`h-2 w-2 rounded-full ${LED_BY_KEY[led].dot}`} aria-hidden />
            {STATUS_TEXT[led]}
          </dd>
        </div>
      </dl>

      <div className="mt-5 rounded-lg bg-white/5 px-3 py-3">
        <LedStrip active={led} />
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="text-xs text-white/60">Last scan</p>
        {lastValidScan ? (
          <div className="mt-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {lastValidScan.assetName} <span className="font-mono text-white/70">{lastValidScan.assetId}</span>
              </p>
              <p className="mt-0.5 font-mono text-xs text-white/60">{lastValidScan.rfidUid}</p>
            </div>
            <div className="shrink-0 text-right">
              <EventBadge event={lastValidScan.event} />
              <p className="mt-1 text-xs text-white/60">{formatTimestamp(lastValidScan.timestamp)}</p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-white/70">No scans yet.</p>
        )}
        {lastInvalidScan && (
          <p className="mt-3 text-xs text-red-300">
            Invalid tag{lastInvalidScan.rfidUid ? ` ${lastInvalidScan.rfidUid}` : ''} at {formatTimestamp(lastInvalidScan.timestamp)}
          </p>
        )}
      </div>

      <div className="mt-5">
        <label htmlFor="sim-tag" className="text-xs text-white/60">
          Tag to simulate
        </label>
        <select
          id="sim-tag"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="mt-1.5 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white [color-scheme:dark] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          {sortedAssets.map((a) => (
            <option key={a.id} value={a.rfidUid}>
              {a.id} - {a.name} ({a.rfidUid})
            </option>
          ))}
          <option value={UNKNOWN_SIM_UID}>Unregistered tag ({UNKNOWN_SIM_UID})</option>
        </select>

        <button
          type="button"
          onClick={() => simulateScan(tag)}
          disabled={scanning || !currentCheckpoint}
          className="btn mt-3 w-full bg-surface text-ink hover:bg-brand-50"
        >
          <ScanLine size={16} aria-hidden />
          {scanning ? 'Reading tag...' : 'Simulate RFID scan'}
        </button>
        <p className="mt-2 text-xs text-white/50">
          For frontend testing only. The ESP32 will send real scans to the backend later.
        </p>
      </div>
    </section>
  );
}
