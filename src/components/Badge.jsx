import { LogIn, LogOut, TriangleAlert } from 'lucide-react';

const TONES = {
  ok: 'bg-ok-bg text-ok',
  warn: 'bg-warn-bg text-warn',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
  neutral: 'bg-brand-100 text-ink-soft',
};

const DOTS = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
  info: 'bg-info',
  neutral: 'bg-slate-400',
};

export function Badge({ tone = 'neutral', dot = false, icon: Icon, children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOTS[tone]}`} aria-hidden />}
      {Icon && <Icon size={12} aria-hidden />}
      {children}
    </span>
  );
}

// RFID events carry an icon so they are never mistaken for staff-managed statuses (which carry a dot).
const EVENT_META = {
  ENTRY: { tone: 'ok', icon: LogIn },
  EXIT: { tone: 'warn', icon: LogOut },
  ALERT: { tone: 'danger', icon: TriangleAlert },
};

export function EventBadge({ event }) {
  if (!event) return <span className="text-ink-mute">None yet</span>;
  const meta = EVENT_META[event];
  return (
    <Badge tone={meta.tone} icon={meta.icon}>
      {event}
    </Badge>
  );
}

const STATUS_TONE = { Available: 'ok', 'In Use': 'info', Maintenance: 'warn' };

export function StatusBadge({ status }) {
  return (
    <Badge tone={STATUS_TONE[status] ?? 'neutral'} dot>
      {status}
    </Badge>
  );
}

const SEVERITY = {
  critical: { tone: 'danger', label: 'Critical' },
  warning: { tone: 'warn', label: 'Warning' },
  info: { tone: 'info', label: 'Information' },
};

export function SeverityBadge({ severity }) {
  const meta = SEVERITY[severity];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

const ALERT_STATE = {
  new: 'bg-brand-600 text-white',
  acknowledged: 'bg-brand-100 text-ink-soft',
  resolved: 'bg-ok-bg text-ok',
};
const ALERT_STATE_LABEL = { new: 'New', acknowledged: 'Acknowledged', resolved: 'Resolved' };

export function AlertStateBadge({ state }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${ALERT_STATE[state]}`}>
      {ALERT_STATE_LABEL[state]}
    </span>
  );
}
