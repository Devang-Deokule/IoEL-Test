import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Activity, CheckCircle2, Copy, Wrench } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { usePageTitle } from '../hooks/usePageTitle';
import { ASSET_STATUSES } from '../data/constants';
import { formatFull, formatTimestamp } from '../utils/format';
import { Card, CardHeader } from '../components/Card';
import { EventBadge, StatusBadge } from '../components/Badge';
import EmptyState from '../components/EmptyState';

const STATUS_VISUAL = {
  Available: { icon: CheckCircle2, tile: 'bg-ok-bg text-ok', note: 'Free to be assigned.' },
  'In Use': { icon: Activity, tile: 'bg-info-bg text-info', note: 'Currently being used by staff.' },
  Maintenance: { icon: Wrench, tile: 'bg-warn-bg text-warn', note: 'Not available until maintenance is done.' },
};

const DOT_BY_EVENT = { ENTRY: 'bg-ok', EXIT: 'bg-amber-500', ALERT: 'bg-danger' };

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-xs text-ink-mute">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{children}</dd>
    </div>
  );
}

export default function AssetDetails() {
  const { id } = useParams();
  const { assets, history, updateAssetStatus, notify } = useApp();
  const asset = assets.find((a) => a.id === id);
  usePageTitle(asset ? `${asset.name} ${asset.id}` : 'Asset not found');

  const [pending, setPending] = useState(asset?.status ?? 'Available');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (asset) setPending(asset.status);
  }, [asset]);

  if (!asset) {
    return (
      <Card>
        <EmptyState
          title="Asset not found"
          message={`There is no asset with the ID ${id}.`}
          action={
            <Link to="/assets" className="btn btn-primary">
              Back to assets
            </Link>
          }
        />
      </Card>
    );
  }

  const events = history.filter((h) => h.assetId === asset.id);
  const visual = STATUS_VISUAL[asset.status];
  const VisualIcon = visual.icon;

  const save = async () => {
    setSaving(true);
    await updateAssetStatus(asset.id, pending);
    setSaving(false);
  };

  const copyUid = async () => {
    try {
      await navigator.clipboard.writeText(asset.rfidUid);
      notify('RFID UID copied.', 'success');
    } catch {
      notify('Could not copy to the clipboard.', 'danger');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link to="/assets" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
          <ArrowLeft size={15} aria-hidden /> All assets
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{asset.name}</h1>
          <span className="rounded-md bg-canvas px-2 py-0.5 font-mono text-sm text-ink-soft">{asset.id}</span>
          <StatusBadge status={asset.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Asset information" />
            <dl className="grid gap-x-6 gap-y-4 px-5 pb-5 sm:grid-cols-2">
              <Detail label="Asset ID">
                <span className="font-mono">{asset.id}</span>
              </Detail>
              <Detail label="RFID UID">
                <span className="inline-flex items-center gap-2">
                  <span className="font-mono">{asset.rfidUid}</span>
                  <button type="button" onClick={copyUid} aria-label="Copy RFID UID" className="rounded p-1 text-ink-mute hover:bg-canvas hover:text-ink">
                    <Copy size={14} />
                  </button>
                </span>
              </Detail>
              <Detail label="Type">{asset.type}</Detail>
              <Detail label="Department">{asset.department}</Detail>
              <Detail label="Current location">{asset.location}</Detail>
              <Detail label="Status">
                <StatusBadge status={asset.status} />
              </Detail>
              <Detail label="Last detected">{formatFull(asset.lastDetected)}</Detail>
              {asset.expectedLocation && <Detail label="Expected location">{asset.expectedLocation}</Detail>}
            </dl>
          </Card>

          <Card>
            <CardHeader title="Tracking history" description="RFID events for this asset, newest first." />
            {events.length === 0 ? (
              <EmptyState title="No scans yet" message="This asset has not been detected at any checkpoint." />
            ) : (
              <>
                <ol className="ml-8 mr-5 border-l border-line pb-1 sm:hidden">
                  {events.map((e) => (
                    <li key={e.id} className="relative pb-5 pl-5">
                      <span className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-surface ${DOT_BY_EVENT[e.event]}`} aria-hidden />
                      <div className="flex flex-wrap items-center gap-2">
                        <EventBadge event={e.event} />
                        <span className="text-sm text-ink-soft">{formatTimestamp(e.timestamp)}</span>
                      </div>
                      <p className="mt-1 text-sm">
                        {e.previousLocation} &rarr; {e.newLocation}
                      </p>
                      <p className="text-xs text-ink-mute">{e.checkpoint}</p>
                    </li>
                  ))}
                </ol>

                <div className="hidden overflow-x-auto sm:block">
                  <table className="data-table w-full border-collapse">
                    <thead>
                      <tr>
                        {['Time', 'Event', 'Previous location', 'New location', 'Checkpoint'].map((h) => (
                          <th key={h} scope="col" className="th">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((e) => (
                        <tr key={e.id}>
                          <td className="td text-ink-soft">{formatTimestamp(e.timestamp)}</td>
                          <td className="td">
                            <EventBadge event={e.event} />
                          </td>
                          <td className="td">{e.previousLocation}</td>
                          <td className="td">{e.newLocation}</td>
                          <td className="td">{e.checkpoint}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${visual.tile}`}>
                <VisualIcon size={28} aria-hidden />
              </span>
              <div>
                <p className="text-lg font-semibold text-ink">{asset.status}</p>
                <p className="text-sm text-ink-soft">{visual.note}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line p-3">
                <p className="text-xs text-ink-mute">Last RFID event</p>
                <div className="mt-1.5">
                  <EventBadge event={asset.lastEvent} />
                </div>
                <p className="mt-1.5 text-xs text-ink-soft">{formatTimestamp(asset.lastDetected)}</p>
              </div>
              <div className="rounded-lg border border-line p-3">
                <p className="text-xs text-ink-mute">Staff status</p>
                <div className="mt-1.5">
                  <StatusBadge status={asset.status} />
                </div>
                <p className="mt-1.5 text-xs text-ink-soft">Set manually</p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-ink-mute">
              A scan only tells us where the tag was detected. The status is set by staff and does not change when the tag is scanned.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Update status</h2>
            <div role="radiogroup" aria-label="Asset status" className="mt-3 space-y-2">
              {ASSET_STATUSES.map((s) => {
                const selected = pending === s;
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPending(s)}
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-left text-sm transition-colors ${
                      selected ? 'border-brand-500 bg-brand-50 font-medium text-brand-700' : 'border-line hover:bg-canvas'
                    }`}
                  >
                    {s}
                    <span className={`h-4 w-4 rounded-full border-2 ${selected ? 'border-brand-600 bg-brand-600 ring-2 ring-inset ring-surface' : 'border-slate-300'}`} aria-hidden />
                  </button>
                );
              })}
            </div>
            <button type="button" className="btn btn-primary mt-4 w-full" disabled={pending === asset.status || saving} onClick={save}>
              {saving ? 'Saving...' : 'Save status'}
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
