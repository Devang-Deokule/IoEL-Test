import { useState } from 'react';
import { ShieldCheck, Trash2, Volume2, VolumeX, AlertOctagon } from 'lucide-react';
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
  const {
    alerts,
    deleteAcknowledgedAlerts,
    hasActiveEmergency,
    sirenActive,
    sirenMuted,
    toggleSilenceSiren,
  } = useApp();
  const [tab, setTab] = useState('new');
  const [isDeletingAck, setIsDeletingAck] = useState(false);

  const count = (key) => (key === 'all' ? alerts.length : alerts.filter((a) => a.state === key).length);
  const rows = tab === 'all' ? alerts : alerts.filter((a) => a.state === tab);

  const handleDeleteAck = async () => {
    const ackCount = count('acknowledged');
    if (ackCount === 0) return;
    if (window.confirm(`Are you sure you want to permanently delete all ${ackCount} acknowledged alert${ackCount > 1 ? 's' : ''}?`)) {
      setIsDeletingAck(true);
      await deleteAcknowledgedAlerts();
      setIsDeletingAck(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Alerts"
        description="Active facility hazard alarms and security events. All critical alerts trigger synchronized audio sirens, desktop push notifications, and emergency emails."
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSilenceSiren}
              className={`btn btn-sm inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors ${
                sirenActive
                  ? 'border-red-300 bg-red-50 text-danger hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
                  : 'border-line bg-surface text-ink-soft hover:bg-canvas'
              }`}
              title={sirenActive ? 'Click to silence the emergency siren' : 'Emergency siren audio status'}
            >
              {sirenActive ? (
                <>
                  <Volume2 size={15} className="text-danger animate-bounce" />
                  <span>Siren Sounding</span>
                </>
              ) : (
                <>
                  <VolumeX size={15} />
                  <span>{sirenMuted ? 'Siren Muted' : 'Siren Standby'}</span>
                </>
              )}
            </button>
            <p className="hidden md:flex items-center gap-3 text-xs text-ink-soft">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger" aria-hidden /> Critical Emergency</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden /> Warning</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-500" aria-hidden /> Information</span>
            </p>
          </div>
        }
      />

      {/* EMERGENCY SIREN ACTIVE BANNER */}
      {hasActiveEmergency && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-red-500 bg-red-500/10 p-4 text-ink shadow-md animate-pulse">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-danger text-white shadow-lg">
              <AlertOctagon size={24} className="animate-spin" style={{ animationDuration: '3s' }} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-danger px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
                  Emergency Siren Active
                </span>
                <span className="text-xs font-medium text-danger">Real-Time Hazard Alert</span>
              </div>
              <p className="mt-0.5 text-sm font-semibold text-ink">
                Unacknowledged emergency incident detected in hospital ward. Siren audio is sounding.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSilenceSiren}
              className="btn btn-sm inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3.5 py-1.5 text-xs font-bold text-danger hover:bg-red-50 shadow-sm"
            >
              {sirenMuted ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span>{sirenMuted ? 'Resume Siren Audio' : 'Silence Siren Audio'}</span>
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Alert state" className="inline-flex rounded-lg border border-line bg-surface p-1">
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

        {count('acknowledged') > 0 && (
          <button
            type="button"
            onClick={handleDeleteAck}
            disabled={isDeletingAck}
            className="btn btn-sm inline-flex items-center gap-1.5 border border-rose-300 bg-rose-50/70 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 hover:border-rose-400 transition-colors shadow-xs"
            title="Delete all acknowledged alerts"
          >
            <Trash2 size={14} className="text-rose-600" />
            <span>
              {isDeletingAck ? 'Deleting...' : `Delete All Acknowledged (${count('acknowledged')})`}
            </span>
          </button>
        )}
      </div>

      {tab === 'acknowledged' && rows.length > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-brand-200/60 bg-brand-50/40 px-3.5 py-2 text-xs text-brand-800">
          <span>Acknowledged alerts have been verified. You can resolve them, delete them individually, or clear all acknowledged alerts at once.</span>
        </div>
      )}

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
