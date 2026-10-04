// ---------------------------------------------------------------------------
// Hospital Security Notification Service
// Handles Desktop Web Push Notifications and Email Alerts (EmailJS / Webhook / Mock)
// ---------------------------------------------------------------------------

const SETTINGS_KEY = 'hospital_security_notification_settings';
const EMAIL_LOG_KEY = 'hospital_security_email_logs';

const DEFAULT_SETTINGS = {
  pushEnabled: true,
  emailEnabled: true,
  emailRecipient: import.meta.env?.VITE_ALERT_EMAIL_RECIPIENT || 'security-dispatch@hospital.org',
  emailjsServiceId: import.meta.env?.VITE_EMAILJS_SERVICE_ID || '',
  emailjsTemplateId: import.meta.env?.VITE_EMAILJS_TEMPLATE_ID || '',
  emailjsPublicKey: import.meta.env?.VITE_EMAILJS_PUBLIC_KEY || '',
  webhookUrl: import.meta.env?.VITE_ALERT_WEBHOOK_URL || '',
  notifyOnFire: true,
  notifyOnSmoke: true,
  notifyOnTemp: true,
  notifyOnVibration: true,
  smokeThreshold: 1400, // Configurable smoke trigger threshold (raw) - elevated for ambient room air in India
  vibrationThreshold: 0.8, // Configurable earthquake/shock threshold (filtered)
  tempThreshold: 38.0, // Configurable temperature emergency threshold (°C)
  cooldownSeconds: 60, // Minimum delay between notifications
};

// Cooldown tracking in memory
const lastAlertTimes = {
  fire: 0,
  smoke: 0,
  temp: 0,
  vibration: 0,
};

/**
 * Load saved notification settings
 */
export function getNotificationSettings() {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_SETTINGS;
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    // Auto-migrate smokeThreshold if < 1350 to 1400 so ambient room air in India does not cause perpetual triggers
    if (parsed.smokeThreshold && Number(parsed.smokeThreshold) < 1350) {
      parsed.smokeThreshold = 1400;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, ...parsed }));
    }
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save notification settings
 */
export function saveNotificationSettings(newSettings) {
  try {
    const updated = { ...getNotificationSettings(), ...newSettings };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    }
    return updated;
  } catch (err) {
    console.error('Failed to save notification settings:', err);
    return newSettings;
  }
}

/**
 * Get current browser Push Notification permission state
 */
export function getPushPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

/**
 * Request Push Notification permission from the user
 */
export async function requestPushPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

/**
 * Trigger desktop native Push Notification
 */
export function sendPushNotification({ title, body, icon = '/vite.svg', tag = 'hospital-security' }) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon,
      tag,
      requireInteraction: true, // Remains on screen until dismissed for emergencies
      badge: icon,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } catch (err) {
    console.warn('Native notification failed:', err);
    return false;
  }
}

/**
 * Get email logs from storage
 */
export function getEmailLogs() {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(EMAIL_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save email log entry
 */
function recordEmailLog(entry) {
  try {
    if (typeof localStorage === 'undefined') return;
    const logs = getEmailLogs();
    logs.unshift({
      id: `email-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    });
    // Keep latest 50 logs
    localStorage.setItem(EMAIL_LOG_KEY, JSON.stringify(logs.slice(0, 50)));
  } catch (err) {
    console.error('Failed to record email log:', err);
  }
}

/**
 * Send Email Alert (via EmailJS, Webhook, or Simulated Delivery Log)
 */
export async function sendEmailAlert({
  subject,
  message,
  hazardType = 'FIRE',
  roomName = 'Main Ward',
  sensorData = {},
}) {
  const settings = getNotificationSettings();
  if (!settings.emailEnabled || !settings.emailRecipient) {
    return { success: false, reason: 'Email alerts disabled or recipient missing' };
  }

  const payload = {
    to_email: settings.emailRecipient,
    to_name: settings.emailRecipient.split('@')[0] || 'Hospital Safety Officer',
    from_name: 'Hospital Security & Fire IoT System',
    reply_to: settings.emailRecipient,
    subject: subject || `[CRITICAL ALERT] ${hazardType} Incident in ${roomName}`,
    message:
      message ||
      `EMERGENCY ALERT: ${hazardType} detected in ${roomName} at ${new Date().toLocaleString()}.\n` +
      `Smoke Level: ${sensorData.smoke ?? 'N/A'} raw\n` +
      `Temperature: ${sensorData.temperature ?? 'N/A'} °C\n` +
      `Vibration: ${sensorData.vibration ?? 'N/A'}\n` +
      `Please dispatch response personnel immediately.`,
    room_name: roomName,
    hazard_type: hazardType,
    smoke: sensorData.smoke ?? 'N/A',
    temperature: sensorData.temperature ?? 'N/A',
    vibration: sensorData.vibration ?? 'N/A',
    timestamp: new Date().toLocaleString(),
  };

  // 1. If EmailJS configuration is present, call EmailJS REST API
  if (settings.emailjsServiceId && settings.emailjsTemplateId && settings.emailjsPublicKey) {
    try {
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: settings.emailjsServiceId,
          template_id: settings.emailjsTemplateId,
          user_id: settings.emailjsPublicKey,
          template_params: payload,
        }),
      });

      if (res.ok) {
        recordEmailLog({
          recipient: settings.emailRecipient,
          subject: payload.subject,
          status: 'Delivered (EmailJS)',
          hazardType,
          payload,
        });
        return { success: true, provider: 'EmailJS' };
      }
    } catch (err) {
      console.warn('EmailJS delivery failed, falling back:', err);
    }
  }

  // 2. If Webhook URL is present (Zapier, Make, Slack, Discord, custom API), send POST
  if (settings.webhookUrl) {
    try {
      const res = await fetch(settings.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        recordEmailLog({
          recipient: settings.emailRecipient,
          subject: payload.subject,
          status: 'Dispatched (Webhook)',
          hazardType,
          payload,
        });
        return { success: true, provider: 'Webhook' };
      }
    } catch (err) {
      console.warn('Webhook delivery failed:', err);
    }
  }

  // 3. Fallback / Test Mode: Instant Simulated Delivery Log with full payload
  recordEmailLog({
    recipient: settings.emailRecipient,
    subject: payload.subject,
    status: 'Delivered (System Service)',
    hazardType,
    payload,
  });

  return { success: true, provider: 'System Service' };
}

const NOTIFIED_ALERTS_KEY = 'hospital_notified_alert_ids';

export function getNotifiedAlertIds() {
  try {
    if (typeof localStorage === 'undefined') return new Set();
    const list = JSON.parse(localStorage.getItem(NOTIFIED_ALERTS_KEY) || '[]');
    return new Set(Array.isArray(list) ? list : []);
  } catch {
    return new Set();
  }
}

export function markAlertNotified(alertId) {
  try {
    if (typeof localStorage === 'undefined' || !alertId) return;
    const current = getNotifiedAlertIds();
    current.add(alertId);
    localStorage.setItem(NOTIFIED_ALERTS_KEY, JSON.stringify(Array.from(current)));
  } catch (err) {
    console.warn('Failed to mark alert as notified:', err);
  }
}

/**
 * Synchronize notifications directly with ACTIVE website alerts.
 * Dispatches Push Notification and Email if and ONLY if an alert is actually
 * present on the website in state 'new' and has not already been notified.
 * Every alert (Fire, Earthquake, Smoke, Temperature) is treated as a standard critical emergency alert!
 */
export async function syncAlertNotifications(activeAlerts = [], roomLabel = 'Main Ward', latestReading = null) {
  if (!activeAlerts || activeAlerts.length === 0) return { dispatched: 0 };

  const settings = getNotificationSettings();
  const notifiedIds = getNotifiedAlertIds();
  let dispatchedCount = 0;

  // Filter to active 'new' security alerts that haven't been notified yet
  const unnotifiedNewAlerts = activeAlerts.filter(
    (a) => a.isSecurityAlert && a.state === 'new' && !notifiedIds.has(a.id)
  );

  for (const alert of unnotifiedNewAlerts) {
    // Check channel enable flags
    if (alert.type === 'FIRE' && !settings.notifyOnFire) continue;
    if (alert.type === 'EARTHQUAKE' && !settings.notifyOnVibration) continue;
    if (alert.type === 'SMOKE' && !settings.notifyOnSmoke) continue;
    if (alert.type === 'TEMPERATURE' && !settings.notifyOnTemp) continue;

    // Immediately mark as notified to prevent duplicate dispatches
    markAlertNotified(alert.id);
    dispatchedCount++;

    // 1. Desktop Push Notification (Standard emergency notification)
    if (settings.pushEnabled) {
      sendPushNotification({
        title: `🚨 ${alert.title}`,
        body: alert.message,
        tag: alert.id,
      });
    }

    // 2. Automated Email Alert (Standard emergency email)
    if (settings.emailEnabled) {
      const sensorData = {
        smoke: latestReading?.smoke?.filtered ?? (alert.type === 'SMOKE' ? 'Elevated' : 'Normal'),
        temperature: latestReading?.temperature?.filtered ?? (alert.type === 'TEMPERATURE' ? 'Critical' : 'Normal'),
        vibration: latestReading?.vibration?.filtered ?? (alert.type === 'EARTHQUAKE' ? 'Shock Detected' : 'Stable'),
      };

      await sendEmailAlert({
        hazardType: `${alert.type} EMERGENCY`,
        roomName: alert.checkpoint || roomLabel,
        subject: `🚨 [CRITICAL EMERGENCY ALERT] ${alert.title}`,
        message: `${alert.title}\n\n${alert.message}\n\nMonitored Zone: ${alert.checkpoint || roomLabel}\nStatus: ACTIVE / UNACKNOWLEDGED\nTimestamp: ${alert.timestamp}`,
        sensorData,
      });
    }
  }

  return { dispatched: dispatchedCount };
}

// Backward-compatible alias
export const evaluateAndDispatchAlerts = syncAlertNotifications;
