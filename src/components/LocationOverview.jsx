import { Link } from 'react-router-dom';
import { Radio } from 'lucide-react';
import { useApp } from '../hooks/useApp';

export default function LocationOverview() {
  const { locationCounts, currentCheckpoint, stats } = useApp();

  return (
    <div className="grid grid-cols-2 gap-3 px-5 pb-5 sm:grid-cols-3">
      {locationCounts.map((loc) => {
        const isReaderHere = currentCheckpoint?.location === loc.name;
        const share = stats.total ? Math.round((loc.count / stats.total) * 100) : 0;
        return (
          <Link
            key={loc.name}
            to={`/assets?location=${encodeURIComponent(loc.name)}`}
            className="block rounded-lg border border-line p-4 transition-colors hover:border-brand-400"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium text-ink">{loc.short}</span>
              {isReaderHere && (
                <span
                  title="The RC522 reader is currently placed here"
                  className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700"
                >
                  <Radio size={11} aria-hidden /> Reader
                </span>
              )}
            </div>
            <p className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold tabular-nums text-ink">{loc.count}</span>
              <span className="text-sm text-ink-soft">{loc.count === 1 ? 'asset' : 'assets'}</span>
            </p>
            <div className="mt-3 h-1 rounded-full bg-canvas" aria-hidden>
              <div className="h-1 rounded-full bg-brand-500" style={{ width: `${share}%` }} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
