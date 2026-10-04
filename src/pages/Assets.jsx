import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, SearchX } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { usePageTitle } from '../hooks/usePageTitle';
import { ALL_LOCATIONS, ASSET_STATUSES } from '../data/constants';
import { formatTimestamp } from '../utils/format';
import { Card } from '../components/Card';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { StatusBadge } from '../components/Badge';
import AssetFormModal from '../components/AssetFormModal';

export default function Assets() {
  usePageTitle('Assets');
  const { assets } = useApp();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);

  const q = params.get('q') ?? '';
  const location = params.get('location') ?? '';
  const status = params.get('status') ?? '';

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return assets.filter((a) => {
      if (location && a.location !== location) return false;
      if (status && a.status !== status) return false;
      if (!needle) return true;
      return [a.id, a.name, a.rfidUid, a.type].some((v) => v.toLowerCase().includes(needle));
    });
  }, [assets, q, location, status]);

  const hasFilters = Boolean(q || location || status);

  return (
    <>
      <PageHeader
        title="Hospital assets"
        description="Every tagged piece of equipment, where it was last detected, and its current staff-set status."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} aria-hidden /> Add asset
          </button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" aria-hidden />
            <input
              type="search"
              aria-label="Search assets"
              placeholder="Search by name, asset ID or RFID UID"
              className="field pl-9"
              value={q}
              onChange={(e) => setFilter('q', e.target.value)}
            />
          </div>
          <select aria-label="Filter by location" className="field w-auto" value={location} onChange={(e) => setFilter('location', e.target.value)}>
            <option value="">All locations</option>
            {ALL_LOCATIONS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <select aria-label="Filter by status" className="field w-auto" value={status} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            {ASSET_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          {hasFilters && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setParams({}, { replace: true })}>
              Clear filters
            </button>
          )}
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No assets match these filters"
            message="Try a different search term or clear the filters."
            action={
              <button type="button" className="btn btn-secondary" onClick={() => setParams({}, { replace: true })}>
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full min-w-[900px] border-collapse">
              <thead>
                <tr>
                  {['Asset ID', 'Equipment', 'RFID UID', 'Type', 'Current location', 'Status', 'Last detected', ''].map((h, i) => (
                    <th key={h || i} scope="col" className="th">
                      {h || <span className="sr-only">Actions</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="cursor-pointer hover:bg-canvas/60" onClick={() => navigate(`/assets/${a.id}`)}>
                    <td className="td font-mono text-[13px]">{a.id}</td>
                    <td className="td font-medium">{a.name}</td>
                    <td className="td font-mono text-[13px]">{a.rfidUid}</td>
                    <td className="td text-ink-soft">{a.type}</td>
                    <td className="td">{a.location}</td>
                    <td className="td">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="td text-ink-soft">{formatTimestamp(a.lastDetected)}</td>
                    <td className="td text-right">
                      <Link
                        to={`/assets/${a.id}`}
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`View ${a.name} ${a.id}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="border-t border-line px-5 py-3 text-xs text-ink-mute">
          Showing {rows.length} of {assets.length} assets
        </p>
      </Card>

      {showForm && <AssetFormModal onClose={() => setShowForm(false)} onCreated={(a) => navigate(`/assets/${a.id}`)} />}
    </>
  );
}
