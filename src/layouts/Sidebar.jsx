import { NavLink } from 'react-router-dom';
import { Activity, Boxes, History, LayoutDashboard, ScanLine, Settings, TriangleAlert, X, Radio } from 'lucide-react';
import { useApp } from '../hooks/useApp';

const MAIN_NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/assets', label: 'Assets', icon: Boxes },
  { to: '/history', label: 'Tracking History', icon: History },
  { to: '/checkpoints', label: 'Checkpoints', icon: ScanLine },
  { to: '/alerts', label: 'Alerts', icon: TriangleAlert, badge: true },
];

const FOOT_NAV = [
  { to: '/system-status', label: 'System Status', icon: Activity },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function NavItem({ item, count }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
          isActive ? 'bg-surface font-medium text-brand-700' : 'text-ink-soft hover:bg-brand-100 hover:text-ink'
        }`
      }
    >
      <Icon size={18} aria-hidden />
      <span className="flex-1">{item.label}</span>
      {item.badge && count > 0 && (
        <span className="rounded-full bg-danger px-1.5 py-0.5 text-[11px] font-medium leading-none text-white" aria-label={`${count} new alerts`}>
          {count}
        </span>
      )}
    </NavLink>
  );
}

export default function Sidebar({ open, onClose }) {
  const { stats } = useApp();

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={onClose} aria-hidden />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-line bg-chrome transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Radio size={17} aria-hidden />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-ink">Asset Tracker</p>
              <p className="text-xs text-ink-mute">RFID, indoor</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close menu" className="rounded-md p-1 text-ink-mute hover:bg-canvas lg:hidden">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {MAIN_NAV.map((item) => (
            <NavItem key={item.to} item={item} count={stats.openAlerts} />
          ))}
        </nav>

        <nav className="space-y-1 border-t border-line p-3" aria-label="System">
          {FOOT_NAV.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}
        </nav>
      </aside>
    </>
  );
}
