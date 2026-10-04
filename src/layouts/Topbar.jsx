import { Link, useLocation } from 'react-router-dom';
import { Bell, Menu, Radio, Volume2, VolumeX, Download, WifiOff } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { usePwa } from '../hooks/usePwa';
import { isMockMode } from '../services/api';

const TITLES = {
  '': 'Dashboard',
  assets: 'Assets',
  'security-monitoring': 'Security Monitoring System',
  history: 'Tracking History',
  checkpoints: 'Checkpoints',
  alerts: 'Alerts',
  'system-status': 'System Status',
  settings: 'Settings',
};

function titleFor(pathname) {
  const [first, second] = pathname.split('/').filter(Boolean);
  if (first === 'assets' && second) return 'Asset Details';
  return TITLES[first ?? ''] ?? 'Not found';
}

export default function Topbar({ onMenu }) {
  const { pathname } = useLocation();
  const { currentCheckpoint, stats, hasActiveEmergency, sirenActive, toggleSilenceSiren } = useApp();
  const { isInstallable, isOffline, installApp } = usePwa();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-chrome px-4 sm:px-6 lg:px-8">
      <button type="button" onClick={onMenu} aria-label="Open menu" className="rounded-md p-2 text-ink-soft hover:bg-canvas lg:hidden">
        <Menu size={20} />
      </button>

      <h2 className="text-lg font-semibold tracking-tight text-ink">{titleFor(pathname)}</h2>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {hasActiveEmergency && (
          <button
            type="button"
            onClick={toggleSilenceSiren}
            title={sirenActive ? 'Emergency Siren Sounding! (Click to Silence)' : 'Emergency Siren Silenced (Click to Resume)'}
            className="flex items-center gap-1.5 rounded-full border border-danger/40 bg-danger/10 px-2.5 py-1 text-xs font-semibold text-danger shadow-xs hover:bg-danger/20 transition-all"
          >
            {sirenActive ? <Volume2 size={14} className="animate-bounce" /> : <VolumeX size={14} />}
            <span className="hidden md:inline">{sirenActive ? 'Siren Active' : 'Siren Silenced'}</span>
          </button>
        )}

        {isOffline && (
          <span
            className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800"
            title="Working offline via cached PWA application shell"
          >
            <WifiOff size={13} />
            <span className="hidden sm:inline">Offline Mode</span>
          </span>
        )}

        {isInstallable && (
          <button
            type="button"
            onClick={installApp}
            className="flex items-center gap-1.5 rounded-lg border border-brand-300 bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 shadow-xs transition-colors"
            title="Install Hospital IoT Management System to your desktop or home screen"
          >
            <Download size={14} className="text-brand-600 animate-pulse" />
            <span>Install App</span>
          </button>
        )}

        <Link
          to="/checkpoints"
          className="flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-sm hover:bg-canvas"
          title="Change the checkpoint the RC522 reader is assigned to"
        >
          <Radio size={15} className="text-brand-600" aria-hidden />
          <span className="hidden text-ink-soft sm:inline">Checkpoint</span>
          <span className="font-medium text-ink">{currentCheckpoint?.title ?? 'None'}</span>
        </Link>

        <span
          className="hidden items-center gap-2 text-sm text-ink-soft md:flex"
          title={isMockMode ? 'Running on mock data. No backend connected.' : 'Connected to the backend API'}
        >
          <span className={`h-2 w-2 rounded-full ${isMockMode ? 'bg-brand-500' : 'bg-ok'}`} aria-hidden />
          {isMockMode ? 'Demo mode' : 'Connected'}
        </span>

        <Link
          to="/alerts"
          aria-label={`Notifications, ${stats.openAlerts} new alerts`}
          className="relative rounded-md p-2 text-ink-soft hover:bg-canvas"
        >
          <Bell size={19} />
          {stats.openAlerts > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-medium leading-none text-white">
              {stats.openAlerts}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-2.5 border-l border-line pl-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700" aria-hidden>
            AD
          </span>
          <div className="hidden leading-tight lg:block">
            <p className="text-sm font-medium text-ink">Admin</p>
            <p className="text-xs text-ink-mute">Biomedical engineering</p>
          </div>
        </div>
      </div>
    </header>
  );
}
