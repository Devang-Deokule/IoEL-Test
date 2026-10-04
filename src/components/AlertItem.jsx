import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { AlertStateBadge, SeverityBadge } from './Badge';
import { SEVERITY_STYLES, TYPE_ICONS } from './alertMeta';
import { formatTimestamp } from '../utils/format';

export default function AlertItem({ alert, compact = false }) {
  const { setAlertState, deleteAlert } = useApp();
  const [busy, setBusy] = useState(false);
  const Icon = TYPE_ICONS[alert.type] ?? TYPE_ICONS.DEFAULT;
  const style = SEVERITY_STYLES[alert.severity];

  const change = async (state) => {
    setBusy(true);
    await setAlertState(alert.id, state);
    setBusy(false);
  };

  const remove = async () => {
    if (busy) return;
    setBusy(true);
    await deleteAlert(alert.id);
    setBusy(false);
  };

  return (
    <li className="relative flex gap-3 overflow-hidden rounded-lg border border-line bg-surface p-4 pl-5">
      <span className={`absolute inset-y-0 left-0 w-1 ${style.bar}`} aria-hidden />
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${style.tile}`}>
        <Icon size={18} aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-ink">{alert.title}</h3>
          <SeverityBadge severity={alert.severity} />
          {!compact && <AlertStateBadge state={alert.state} />}
        </div>
        <p className="mt-1 text-sm text-ink-soft">{alert.message}</p>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-mute">
          <span>{alert.checkpoint}</span>
          <span>{formatTimestamp(alert.timestamp)}</span>
          {alert.rfidUid && <span className="font-mono">{alert.rfidUid}</span>}
          {alert.assetId && (
            <Link to={`/assets/${alert.assetId}`} className="text-brand-700 hover:underline">
              View {alert.assetId}
            </Link>
          )}
        </p>
      </div>

      {!compact && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:items-start">
          {alert.state === 'new' && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={busy}
              onClick={() => change('acknowledged')}
            >
              Acknowledge
            </button>
          )}
          {alert.state !== 'resolved' && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={busy}
              onClick={() => change('resolved')}
            >
              Resolve
            </button>
          )}
          {(alert.state === 'acknowledged' || alert.state === 'resolved') && (
            <button
              type="button"
              className="btn btn-sm inline-flex items-center gap-1 border border-rose-200 bg-rose-50/50 text-rose-600 hover:border-rose-300 hover:bg-rose-100 hover:text-rose-700 transition-colors"
              title="Delete this alert"
              disabled={busy}
              onClick={remove}
            >
              <Trash2 size={13} aria-hidden />
              <span>Delete</span>
            </button>
          )}
        </div>
      )}
    </li>
  );
}
