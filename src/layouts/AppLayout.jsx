import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Toast from '../components/Toast';

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const { loading, error, retry } = useApp();

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="min-h-screen lg:pl-60">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-h-screen flex-col">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {loading ? (
              <p className="py-20 text-center text-sm text-ink-soft">Loading hospital data...</p>
            ) : error ? (
              <div role="alert" className="mx-auto max-w-md rounded-xl border border-line bg-surface p-6 text-center">
                <h2 className="text-base font-semibold text-ink">Could not load data</h2>
                <p className="mt-1 text-sm text-ink-soft">{error}</p>
                <button type="button" className="btn btn-primary mt-4" onClick={retry}>
                  Try again
                </button>
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>
      <Toast />
    </div>
  );
}
