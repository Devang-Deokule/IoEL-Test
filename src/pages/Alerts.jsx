import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { usePageTitle } from '../hooks/usePageTitle';
import { Card } from '../components/Card';
import PageHeader from '../components/PageHeader';
import AlertItem from '../components/AlertItem';
import EmptyState from '../components/EmptyState';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'acknowledged', label: 'Acknowledged' },
  { key: 'resolved', label: 'Resolved' },
];

export default function Alerts() {
  usePageTitle('Alerts');
  const { alerts } = useApp();
  const [tab, setTab] = useState('new');

  const count = (key) => (key === 'all' ? alerts.length : alerts.filter((a) => a.state === key).length);
  const rows = tab === 'all' ? alerts : alerts.filter((a) => a.state === tab);

  return (
    <>
      <PageHeader
        title="Alerts"
        description="Problems detected by the checkpoint. Acknowledge an alert when you have seen it and resolve it once it is dealt with."
        actions={
          <p className="flex items-center gap-3 text-xs text-ink-soft">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger" aria-hidden /> Critical</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden /> Warning</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-500" aria-hidden /> Information</span>
          </p>
        }
      />

      <div role="tablist" aria-label="Alert state" className="mb-4 inline-flex rounded-lg border border-line bg-surface p-1">
        {TABS.map((t) => {
          const selected = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(t.key)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                selected ? 'bg-brand-600 font-medium text-white' : 'text-ink-soft hover:bg-canvas'
              }`}
            >
              {t.label} <span className={selected ? 'text-white/80' : 'text-ink-mute'}>{count(t.key)}</span>
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={ShieldCheck}
            title={tab === 'new' ? 'No new alerts' : 'Nothing here'}
            message={tab === 'new' ? 'You are all caught up.' : 'No alerts are in this state.'}
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {rows.map((a) => (
            <AlertItem key={a.id} alert={a} />
          ))}
        </ul>
      )}
    </>
  );
}
