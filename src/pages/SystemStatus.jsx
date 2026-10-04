import { useApp } from '../hooks/useApp';
import { usePageTitle } from '../hooks/usePageTitle';
import { API_BASE_URL, isMockMode } from '../services/api';
import { Badge } from '../components/Badge';
import { Card, CardHeader } from '../components/Card';
import { LEDS, LedLamp } from '../components/LedIndicator';
import PageHeader from '../components/PageHeader';

export default function SystemStatus() {
  usePageTitle('System Status');
  const { currentCheckpoint } = useApp();

  const components = [
    { name: 'Web dashboard', detail: 'React frontend', tone: 'ok', label: 'Running' },
    {
      name: 'Backend API',
      detail: isMockMode ? 'FastAPI service, not built yet' : API_BASE_URL,
      tone: isMockMode ? 'neutral' : 'ok',
      label: isMockMode ? 'Not connected' : 'Configured',
    },
    { name: 'Database', detail: isMockMode ? 'Using in-browser mock data' : 'Managed by the backend', tone: isMockMode ? 'neutral' : 'ok', label: isMockMode ? 'Mock data' : 'Backend' },
    { name: 'ESP32 controller', detail: 'Sends scans to the backend', tone: 'neutral', label: 'Not connected' },
    {
      name: 'RC522 reader',
      detail: currentCheckpoint ? `Assigned to ${currentCheckpoint.title}` : 'Not assigned',
      tone: isMockMode ? 'info' : 'ok',
      label: isMockMode ? 'Simulated' : 'Online',
    },
  ];

  return (
    <>
      <PageHeader title="System status" description="Which parts of the system are live and which are still simulated in this frontend." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Components" />
          <ul className="divide-y divide-line px-5 pb-2">
            {components.map((c) => (
              <li key={c.name} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{c.name}</p>
                  <p className="text-xs text-ink-mute">{c.detail}</p>
                </div>
                <Badge tone={c.tone} dot>
                  {c.label}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Checkpoint indicators" description="What each LED on the hardware means." />
            <ul className="space-y-3 px-5 pb-5">
              {LEDS.map((led) => (
                <li key={led.key} className="flex items-start gap-3 rounded-lg bg-ink px-4 py-3 text-white">
                  <span className="mt-1">
                    <LedLamp ledKey={led.key} />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{led.hardware}</p>
                    <p className="text-xs text-white/70">{led.meaning}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="How scans are read" />
            <ul className="space-y-2 px-5 pb-5 text-sm text-ink-soft">
              <li>First valid scan of a tag at a checkpoint is an <strong className="font-medium text-ink">ENTRY</strong>.</li>
              <li>The next valid scan of the same tag at that checkpoint is an <strong className="font-medium text-ink">EXIT</strong>.</li>
              <li>A tag that is not registered, or cannot be read, is an <strong className="font-medium text-ink">ALERT</strong>.</li>
              <li>Asset status (Available, In Use, Maintenance) is separate and is only changed by staff.</li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
