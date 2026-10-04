import { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Wind,
  Thermometer,
  Activity,
  X,
  History,
  ShieldAlert,
} from 'lucide-react';
import {
  getNotificationSettings,
  saveNotificationSettings,
  getPushPermission,
  requestPushPermission,
  sendPushNotification,
  sendEmailAlert,
  getEmailLogs,
} from '../services/notificationService';

export default function NotificationSettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState(getNotificationSettings());
  const [pushStatus, setPushStatus] = useState(getPushPermission());
  const [emailLogs, setEmailLogs] = useState(getEmailLogs());
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'logs'
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getNotificationSettings());
      setPushStatus(getPushPermission());
      setEmailLogs(getEmailLogs());
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveNotificationSettings(settings);
    setStatusMessage({ type: 'success', text: 'Notification settings saved successfully!' });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleRequestPushPermission = async () => {
    const result = await requestPushPermission();
    setPushStatus(result);
    if (result === 'granted') {
      setStatusMessage({ type: 'success', text: 'Push notifications permitted!' });
      sendPushNotification({
        title: '🔔 Push Notifications Enabled',
        body: 'Hospital Security System alerts will now be pushed directly to your desktop.',
      });
    } else if (result === 'denied') {
      setStatusMessage({
        type: 'danger',
        text: 'Notification permission was denied in your browser settings. Please enable them in your site permissions.',
      });
    }
  };

  const handleTestPush = () => {
    if (pushStatus !== 'granted') {
      setStatusMessage({ type: 'warn', text: 'Please grant notification permissions first.' });
      return;
    }
    const sent = sendPushNotification({
      title: '🚨 [TEST] Hospital Fire & Security Alert',
      body: 'This is a test emergency push notification. Telemetry sensors are fully operational.',
      tag: 'test-alert',
    });
    if (sent) {
      setStatusMessage({ type: 'success', text: 'Test push notification sent to your desktop!' });
    }
  };

  const handleTestEmail = async () => {
    setIsSendingTest(true);
    setStatusMessage(null);
    try {
      const res = await sendEmailAlert({
        hazardType: 'TEST VERIFICATION',
        roomName: 'Main Ward',
        subject: `[TEST] Hospital Security Telemetry Verification Alert`,
        message: `This is a test notification confirming email alert delivery for the Hospital Security Monitoring System. All sensors are calibrated.`,
        sensorData: { smoke: 893.73, temperature: 31.81, vibration: 0.0 },
      });

      setEmailLogs(getEmailLogs());
      setStatusMessage({
        type: 'success',
        text: `Test email dispatched to ${settings.emailRecipient} via ${res.provider}!`,
      });
    } catch (err) {
      setStatusMessage({ type: 'danger', text: `Failed to dispatch test email: ${err.message}` });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-line bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
              <Bell size={18} />
            </span>
            <div>
              <h2 className="text-base font-bold text-ink">Alert Channels & Notifications</h2>
              <p className="text-xs text-ink-soft">
                Configure real-time browser desktop push notifications and automated email alerts.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-ink-mute hover:bg-canvas hover:text-ink"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-line px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === 'settings'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            Notification Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === 'logs'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            <span>Email Dispatch Logs</span>
            <span className="rounded-full bg-brand-100 px-1.5 py-0.2 text-[10px] text-brand-700">
              {emailLogs.length}
            </span>
          </button>
        </div>

        {/* Status Message Banner */}
        {statusMessage && (
          <div
            className={`mx-6 mt-4 flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs font-medium ${
              statusMessage.type === 'success'
                ? 'bg-ok-bg text-ok border border-ok/30'
                : statusMessage.type === 'warn'
                ? 'bg-warn-bg text-warn border border-warn/30'
                : 'bg-danger-bg text-danger border border-danger/30'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertTriangle size={16} />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {activeTab === 'settings' ? (
            <>
              {/* Desktop Push Notifications */}
              <div className="rounded-xl border border-line bg-canvas/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell size={18} className="text-brand-600" />
                    <div>
                      <h3 className="text-sm font-semibold text-ink">Desktop Push Notifications</h3>
                      <p className="text-xs text-ink-mute">
                        Displays native OS notifications even when the browser is minimized or tab is in background.
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      pushStatus === 'granted'
                        ? 'bg-ok-bg text-ok'
                        : pushStatus === 'denied'
                        ? 'bg-danger-bg text-danger'
                        : 'bg-warn-bg text-warn'
                    }`}
                  >
                    {pushStatus === 'granted'
                      ? 'Permission Granted'
                      : pushStatus === 'denied'
                      ? 'Blocked by Browser'
                      : 'Permission Required'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/60">
                  {pushStatus !== 'granted' ? (
                    <button
                      type="button"
                      onClick={handleRequestPushPermission}
                      className="btn btn-sm btn-primary"
                    >
                      Enable Desktop Push Notifications
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleTestPush}
                      className="btn btn-sm btn-secondary flex items-center gap-1.5"
                    >
                      <Send size={13} />
                      <span>Send Test Push Notification</span>
                    </button>
                  )}
                  <label className="flex items-center gap-2 text-xs font-medium text-ink cursor-pointer ml-auto">
                    <input
                      type="checkbox"
                      checked={settings.pushEnabled}
                      onChange={(e) => setSettings({ ...settings, pushEnabled: e.target.checked })}
                      className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
                    />
                    <span>Active Push Alerts</span>
                  </label>
                </div>
              </div>

              {/* Email Alerts Configuration */}
              <div className="rounded-xl border border-line bg-canvas/40 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail size={18} className="text-brand-600" />
                    <div>
                      <h3 className="text-sm font-semibold text-ink">Automated Email Alerts</h3>
                      <p className="text-xs text-ink-mute">
                        Dispatches emergency security summaries with sensor telemetry readings.
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-medium text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailEnabled}
                      onChange={(e) => setSettings({ ...settings, emailEnabled: e.target.checked })}
                      className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
                    />
                    <span>Active Email Alerts</span>
                  </label>
                </div>

                <div className="space-y-3 pt-2 border-t border-line/60 text-xs">
                  <div>
                    <label className="block font-medium text-ink mb-1">
                      Recipient Email Address(es)
                    </label>
                    <input
                      type="email"
                      value={settings.emailRecipient}
                      onChange={(e) => setSettings({ ...settings, emailRecipient: e.target.value })}
                      placeholder="e.g. security-team@hospital.org"
                      className="field"
                    />
                    <p className="mt-1 text-[11px] text-ink-mute">
                      Hospital security response dispatch, fire warden, or nursing station inbox.
                    </p>
                  </div>

                  {/* Webhook & Service Keys (collapsible details) */}
                  <details className="rounded-lg border border-line bg-surface p-2.5">
                    <summary className="cursor-pointer font-medium text-brand-700 hover:underline">
                      Advanced Delivery Provider (EmailJS or Webhook)
                    </summary>
                    <div className="mt-3 space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-medium text-ink-soft mb-1">
                          Webhook URL (Slack, Discord, Zapier, Make, Resend, or Custom API)
                        </label>
                        <input
                          type="url"
                          value={settings.webhookUrl}
                          onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                          placeholder="https://hooks.slack.com/services/... or https://maker.ifttt.com/..."
                          className="field text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] font-medium text-ink-soft mb-1">
                            EmailJS Service ID
                          </label>
                          <input
                            type="text"
                            value={settings.emailjsServiceId}
                            onChange={(e) =>
                              setSettings({ ...settings, emailjsServiceId: e.target.value })
                            }
                            placeholder="service_xxx"
                            className="field text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-ink-soft mb-1">
                            EmailJS Template ID
                          </label>
                          <input
                            type="text"
                            value={settings.emailjsTemplateId}
                            onChange={(e) =>
                              setSettings({ ...settings, emailjsTemplateId: e.target.value })
                            }
                            placeholder="template_xxx"
                            className="field text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-ink-soft mb-1">
                            EmailJS Public Key
                          </label>
                          <input
                            type="text"
                            value={settings.emailjsPublicKey}
                            onChange={(e) =>
                              setSettings({ ...settings, emailjsPublicKey: e.target.value })
                            }
                            placeholder="user_xxx"
                            className="field text-xs"
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-ink-mute">
                        Can also be configured via `.env` with `VITE_ALERT_WEBHOOK_URL` or `VITE_EMAILJS_SERVICE_ID`.
                        If left blank, system uses built-in automated delivery simulator with full audit logs.
                      </p>
                    </div>
                  </details>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleTestEmail}
                      disabled={isSendingTest || !settings.emailRecipient}
                      className="btn btn-sm btn-secondary flex items-center gap-1.5"
                    >
                      <Send size={13} className={isSendingTest ? 'animate-spin' : ''} />
                      <span>{isSendingTest ? 'Dispatching...' : 'Send Test Alert Email'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Event Triggers Checklist */}
              <div className="rounded-xl border border-line bg-canvas/40 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-ink">Alert Triggers & Thresholds</h3>
                <p className="text-xs text-ink-mute">
                  Select which sensor anomalies automatically trigger push notifications and emails.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-line/60 text-xs">
                  <label className="flex items-center gap-2.5 rounded-lg border border-line bg-surface p-2.5 cursor-pointer hover:bg-canvas">
                    <input
                      type="checkbox"
                      checked={settings.notifyOnFire}
                      onChange={(e) => setSettings({ ...settings, notifyOnFire: e.target.checked })}
                      className="h-4 w-4 rounded text-danger focus:ring-danger"
                    />
                    <Flame size={16} className="text-danger" />
                    <div>
                      <p className="font-semibold text-ink">Active Fire Detected</p>
                      <p className="text-[11px] text-ink-mute">Instant emergency dispatch</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 rounded-lg border border-line bg-surface p-2.5 cursor-pointer hover:bg-canvas">
                    <input
                      type="checkbox"
                      checked={settings.notifyOnSmoke}
                      onChange={(e) =>
                        setSettings({ ...settings, notifyOnSmoke: e.target.checked })
                      }
                      className="h-4 w-4 rounded text-warn focus:ring-warn"
                    />
                    <Wind size={16} className="text-warn" />
                    <div>
                      <p className="font-semibold text-ink">Dangerous Smoke (&gt; {settings.smokeThreshold ?? 1400} raw)</p>
                      <p className="text-[11px] text-ink-mute">Dangerous air density</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 rounded-lg border border-line bg-surface p-2.5 cursor-pointer hover:bg-canvas">
                    <input
                      type="checkbox"
                      checked={settings.notifyOnTemp}
                      onChange={(e) => setSettings({ ...settings, notifyOnTemp: e.target.checked })}
                      className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
                    />
                    <Thermometer size={16} className="text-brand-600" />
                    <div>
                      <p className="font-semibold text-ink">High Temp (&gt; 38.0 °C)</p>
                      <p className="text-[11px] text-ink-mute">Critical heat buildup</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 rounded-lg border border-line bg-surface p-2.5 cursor-pointer hover:bg-canvas">
                    <input
                      type="checkbox"
                      checked={settings.notifyOnVibration}
                      onChange={(e) =>
                        setSettings({ ...settings, notifyOnVibration: e.target.checked })
                      }
                      className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <Activity size={16} className="text-purple-600" />
                    <div>
                      <p className="font-semibold text-ink">Earthquake & Seismic Shock</p>
                      <p className="text-[11px] text-ink-mute">Accelerometer disturbance alerts</p>
                    </div>
                  </label>
                </div>

                {/* Sensor Threshold Customization */}
                <div className="mt-4 pt-3 border-t border-line/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-ink">Configurable Sensor Alert Thresholds</h4>
                    <span className="text-[11px] text-ink-mute">Fine-tune trigger boundaries</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-ink-soft mb-1">
                        Smoke Threshold (raw)
                      </label>
                      <input
                        type="number"
                        value={settings.smokeThreshold ?? 1400}
                        onChange={(e) =>
                          setSettings({ ...settings, smokeThreshold: Number(e.target.value) })
                        }
                        className="field text-xs"
                        min="1000"
                        max="3000"
                        step="10"
                      />
                      <p className="mt-1 text-[10px] text-ink-mute">
                        Room ambient (India AQI): ~1150–1210 raw. Default threshold: 1400 raw.
                      </p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-ink-soft mb-1">
                        Earthquake / Shock (filtered)
                      </label>
                      <input
                        type="number"
                        value={settings.vibrationThreshold ?? 0.8}
                        onChange={(e) =>
                          setSettings({ ...settings, vibrationThreshold: Number(e.target.value) })
                        }
                        className="field text-xs"
                        min="0.1"
                        max="10.0"
                        step="0.1"
                      />
                      <p className="mt-1 text-[10px] text-ink-mute">
                        Mild motion: 0.3. Severe earthquake: 0.8+ (peaks reach 6.1).
                      </p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-ink-soft mb-1">
                        Temperature Threshold (°C)
                      </label>
                      <input
                        type="number"
                        value={settings.tempThreshold ?? 35.0}
                        onChange={(e) =>
                          setSettings({ ...settings, tempThreshold: Number(e.target.value) })
                        }
                        className="field text-xs"
                        min="25"
                        max="80"
                        step="0.5"
                      />
                      <p className="mt-1 text-[10px] text-ink-mute">
                        Hospital ward standard: 20°C–26°C.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Email Dispatch Logs Tab */
            <div className="space-y-3">
              {emailLogs.length === 0 ? (
                <div className="py-12 text-center text-xs text-ink-mute">
                  No automated emails have been dispatched yet. Send a test email from the Settings tab!
                </div>
              ) : (
                <div className="divide-y divide-line rounded-lg border border-line bg-surface">
                  {emailLogs.map((log) => (
                    <div key={log.id} className="p-3.5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-ink">{log.subject}</span>
                        <span className="rounded bg-ok-bg px-2 py-0.5 text-[10px] font-semibold text-ok">
                          {log.status}
                        </span>
                      </div>
                      <p className="text-ink-soft">
                        Recipient: <strong className="text-ink">{log.recipient}</strong>
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-ink-mute">
                        <span>Incident: {log.hazardType}</span>
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">
          <button type="button" onClick={onClose} className="btn btn-sm btn-secondary">
            Close
          </button>
          <button type="button" onClick={handleSave} className="btn btn-sm btn-primary">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
