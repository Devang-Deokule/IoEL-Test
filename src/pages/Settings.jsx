import { useApp } from '../hooks/useApp';
import { usePageTitle } from '../hooks/usePageTitle';
import { API_BASE_URL, isMockMode } from '../services/api';
import { Card, CardHeader } from '../components/Card';
import PageHeader from '../components/PageHeader';

function Row({ label, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-3">
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}

export default function Settings() {
  usePageTitle('Settings');
  const { resetDemo } = useApp();

  const reset = () => {
    if (window.confirm('Restore the original demo data? Scans, new assets and alert changes will be lost.')) resetDemo();
  };

  return (
    <>
      <PageHeader title="Settings" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Data source" description="Set in the .env file, then restart the dev server." />
          <dl className="divide-y divide-line px-5 pb-3">
            <Row label="Mode">{isMockMode ? 'Mock data' : 'FastAPI backend'}</Row>
            <Row label="API base URL">
              <span className="font-mono text-[13px]">{API_BASE_URL}</span>
            </Row>
            <Row label="Switch to the backend">
              <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-xs">VITE_USE_MOCK=false</code>
            </Row>
          </dl>
        </Card>

        <Card>
          <CardHeader title="Demo data" description="Changes made in the browser live in memory and are lost on refresh." />
          <div className="px-5 pb-5">
            <button type="button" className="btn btn-secondary" onClick={reset} disabled={!isMockMode}>
              Restore demo data
            </button>
            {!isMockMode && <p className="mt-2 text-xs text-ink-mute">Only available in mock mode.</p>}
          </div>
        </Card>
      </div>
    </>
  );
}
