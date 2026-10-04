import { useState } from 'react';
import { Bell, Mail, Sliders } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { usePageTitle } from '../hooks/usePageTitle';
import { API_BASE_URL, isMockMode } from '../services/api';
import { Card, CardHeader } from '../components/Card';
import PageHeader from '../components/PageHeader';
import NotificationSettingsModal from '../components/NotificationSettingsModal';
import { getNotificationSettings, getPushPermission } from '../services/notificationService';

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
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  const notifSettings = getNotificationSettings();
  const pushPerm = getPushPermission();

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

        {/* Emergency Alert Channels */}
        <Card>
          <CardHeader
            title="Emergency Alert Channels"
            description="Automated email notifications and browser desktop push alerts for fire and security anomalies."
          />
          <div className="px-5 pb-5 space-y-4">
            <dl className="divide-y divide-line text-xs">
              <Row label="Desktop Push Notifications">
                <span className={`rounded-full px-2 py-0.5 font-semibold text-xs ${
                  pushPerm === 'granted' ? 'bg-ok-bg text-ok' : 'bg-warn-bg text-warn'
                }`}>
                  {pushPerm === 'granted' ? 'Enabled (Granted)' : 'Needs Permission'}
                </span>
              </Row>
              <Row label="Automated Email Alerts">
                <span className="text-xs font-mono text-ink">
                  {notifSettings.emailEnabled ? notifSettings.emailRecipient : 'Disabled'}
                </span>
              </Row>
              <Row label="Trigger Conditions">
                <span>Fire, High Smoke, Critical Temp</span>
              </Row>
            </dl>
            <button
              type="button"
              className="btn btn-secondary btn-sm flex items-center gap-1.5"
              onClick={() => setIsNotificationModalOpen(true)}
            >
              <Sliders size={14} />
              <span>Configure & Test Alert Channels</span>
            </button>
          </div>
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

      <NotificationSettingsModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />
    </>
  );
}
