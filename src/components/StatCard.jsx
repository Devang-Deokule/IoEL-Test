import { Link } from 'react-router-dom';

const TONES = {
  brand: 'bg-brand-50 text-brand-600',
  ok: 'bg-ok-bg text-ok',
  info: 'bg-info-bg text-info',
  warn: 'bg-warn-bg text-warn',
  danger: 'bg-danger-bg text-danger',
};

export default function StatCard({ label, value, icon: Icon, tone = 'brand', to }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-brand-400"
    >
      <div>
        <p className="text-sm text-ink-soft">{label}</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums text-ink">{value}</p>
      </div>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TONES[tone]}`}>
        <Icon size={20} aria-hidden />
      </span>
    </Link>
  );
}
