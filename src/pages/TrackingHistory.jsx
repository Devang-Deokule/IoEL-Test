import { useMemo, useState } from 'react';
import { SearchX, Search } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { usePageTitle } from '../hooks/usePageTitle';
import { ALL_LOCATIONS, EVENT_TYPES } from '../data/constants';
import { toDateInputValue } from '../utils/format';
import { Card } from '../components/Card';
import PageHeader from '../components/PageHeader';
import ActivityTable from '../components/ActivityTable';

const INITIAL = { q: '', date: '', location: '', event: '' };

export default function TrackingHistory() {
  usePageTitle('Tracking History');
  const { history } = useApp();
  const [filters, setFilters] = useState(INITIAL);
  const set = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  const rows = useMemo(() => {
    const needle = filters.q.trim().toLowerCase();
    return history.filter((h) => {
      if (filters.event && h.event !== filters.event) return false;
      if (filters.date && toDateInputValue(h.timestamp) !== filters.date) return false;
      if (filters.location && h.previousLocation !== filters.location && h.newLocation !== filters.location) return false;
      if (!needle) return true;
      return [h.assetName, h.assetId, h.rfidUid, h.checkpoint].some((v) => (v ?? '').toLowerCase().includes(needle));
    });
  }, [history, filters]);

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <PageHeader
        title="Tracking history"
        description="Every scan recorded by the checkpoint reader. ENTRY and EXIT come from valid tags; ALERT means the tag was unknown or unreadable."
      />

      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-line p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" aria-hidden />
            <input
              type="search"
              aria-label="Search tracking history"
              placeholder="Search by asset, ID, RFID UID or checkpoint"
              className="field pl-9"
              value={filters.q}
              onChange={set('q')}
            />
          </div>
          <input type="date" aria-label="Filter by date" className="field w-auto" value={filters.date} onChange={set('date')} />
          <select aria-label="Filter by location" className="field w-auto" value={filters.location} onChange={set('location')}>
            <option value="">All locations</option>
            {ALL_LOCATIONS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <select aria-label="Filter by event" className="field w-auto" value={filters.event} onChange={set('event')}>
            <option value="">All events</option>
            {EVENT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          {hasFilters && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFilters(INITIAL)}>
              Clear filters
            </button>
          )}
        </div>

        <ActivityTable
          rows={rows}
          variant="history"
          emptyTitle={hasFilters ? 'No events match these filters' : 'No tracking events yet'}
          emptyMessage={hasFilters ? 'Try a different date, location or event type.' : undefined}
        />

        <p className="flex items-center gap-1.5 border-t border-line px-5 py-3 text-xs text-ink-mute">
          {rows.length === 0 && hasFilters && <SearchX size={13} aria-hidden />}
          Showing {rows.length} of {history.length} events
        </p>
      </Card>
    </>
  );
}
