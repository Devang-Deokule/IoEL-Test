import { Link } from 'react-router-dom';
import { EventBadge } from './Badge';
import EmptyState from './EmptyState';
import { formatTimestamp } from '../utils/format';

// 'dashboard' mirrors the compact "Recent Tracking Activity" layout,
// 'history' is the full Tracking History layout.
const LAYOUTS = {
  dashboard: ['assetId', 'equipment', 'uid', 'event', 'prev', 'next', 'checkpoint', 'time'],
  history: ['time', 'asset', 'uid', 'event', 'prev', 'next', 'checkpoint'],
};

const HEADERS = {
  assetId: 'Asset ID',
  equipment: 'Equipment',
  asset: 'Asset',
  uid: 'RFID UID',
  event: 'Event',
  prev: 'Previous location',
  next: 'New location',
  checkpoint: 'Checkpoint',
  time: 'Timestamp',
};

const Dash = () => <span className="text-ink-mute">&mdash;</span>;

function Cell({ col, row }) {
  switch (col) {
    case 'assetId':
      return row.assetId ? (
        <Link to={`/assets/${row.assetId}`} className="font-mono text-[13px] text-brand-700 hover:underline">
          {row.assetId}
        </Link>
      ) : (
        <Dash />
      );
    case 'equipment':
      return <span className={row.assetId ? '' : 'text-ink-soft'}>{row.assetName}</span>;
    case 'asset':
      return (
        <div>
          {row.assetId ? (
            <Link to={`/assets/${row.assetId}`} className="font-medium text-ink hover:text-brand-700 hover:underline">
              {row.assetName}
            </Link>
          ) : (
            <span className="font-medium text-ink-soft">{row.assetName}</span>
          )}
          <div className="text-xs text-ink-mute">
            {row.assetId ? <span className="font-mono">{row.assetId}</span> : row.note}
          </div>
        </div>
      );
    case 'uid':
      return row.rfidUid ? <span className="font-mono text-[13px]">{row.rfidUid}</span> : <Dash />;
    case 'event':
      return <EventBadge event={row.event} />;
    case 'prev':
      return row.previousLocation ?? <Dash />;
    case 'next':
      return row.newLocation ?? <Dash />;
    case 'checkpoint':
      return row.checkpoint;
    case 'time':
      return <span className="text-ink-soft">{formatTimestamp(row.timestamp)}</span>;
    default:
      return null;
  }
}

export default function ActivityTable({
  rows,
  variant = 'dashboard',
  emptyTitle = 'No tracking events yet',
  emptyMessage = 'Events appear here when a tag is scanned at a checkpoint.',
}) {
  if (rows.length === 0) return <EmptyState title={emptyTitle} message={emptyMessage} />;
  const columns = LAYOUTS[variant];

  return (
    <div className="overflow-x-auto">
      <table className="data-table w-full min-w-[860px] border-collapse">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col" className="th">
                {HEADERS[c]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-canvas/60">
              {columns.map((c) => (
                <td key={c} className="td">
                  <Cell col={c} row={row} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
