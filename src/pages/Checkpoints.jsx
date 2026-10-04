import { Info, Radio } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatTimestamp } from '../utils/format';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import PageHeader from '../components/PageHeader';

export default function Checkpoints() {
  usePageTitle('Checkpoints');
  const { checkpoints, currentCheckpoint, assets, history, selectCheckpoint } = useApp();

  const lastScanAt = (label) => history.find((h) => h.checkpoint === label && h.event !== 'ALERT');
  const assetsAt = (location) => assets.filter((a) => a.location === location).length;

  return (
    <>
      <PageHeader title="Checkpoints" description="Choose which location the physical RFID reader is currently representing." />

      <div className="mb-6 flex gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-700">
        <Info size={18} className="mt-0.5 shrink-0" aria-hidden />
        <p>
          This project currently has <strong className="font-semibold">one physical RC522 reader</strong>. It can only act as one checkpoint at a time, so the
          other checkpoints stay inactive until the reader is moved and reassigned here.
        </p>
      </div>

      <Card className="mb-6 p-5">
        <p className="text-sm text-ink-soft">Current checkpoint</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-ink">{currentCheckpoint?.title ?? 'None selected'}</p>
        {currentCheckpoint && (
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">
            The physical RC522 reader is currently being used as the {currentCheckpoint.title} checkpoint. Scans are recorded against it.
          </p>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {checkpoints.map((cp) => {
          const active = cp.status === 'active';
          const last = lastScanAt(cp.label);
          return (
            <Card key={cp.id} className={`flex flex-col p-5 ${active ? 'border-brand-500 ring-1 ring-brand-500' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold text-ink">{cp.title}</h2>
                <Badge tone={active ? 'ok' : 'neutral'} dot>
                  {active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-mute">Reader</dt>
                  <dd className="text-right">
                    {cp.reader ? (
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <Radio size={14} className="text-brand-600" aria-hidden />
                        {cp.reader}
                      </span>
                    ) : (
                      <span className="text-ink-soft">Not currently assigned</span>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-mute">Assets here</dt>
                  <dd className="tabular-nums">{assetsAt(cp.location)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-mute">Last scan</dt>
                  <dd className="text-right text-ink-soft">
                    {last ? `${last.assetName} ${last.assetId}, ${formatTimestamp(last.timestamp)}` : 'No scans yet'}
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                disabled={active}
                onClick={() => selectCheckpoint(cp.id)}
                className={`btn mt-5 ${active ? 'btn-secondary' : 'btn-primary'}`}
              >
                {active ? 'Reader is here' : 'Use this checkpoint'}
              </button>
            </Card>
          );
        })}
      </div>
    </>
  );
}
