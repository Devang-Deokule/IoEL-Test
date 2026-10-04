const timeOpts = { hour: 'numeric', minute: '2-digit' };

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', timeOpts); // "10:32 AM"
}

// Today -> "10:32 AM", yesterday -> "Yesterday, 4:10 PM", else "03 Oct, 4:10 PM"
export function formatTimestamp(iso) {
  if (!iso) return 'Never';
  const d = new Date(iso);
  const dayDiff = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (dayDiff === 0) return formatTime(iso);
  if (dayDiff === 1) return `Yesterday, ${formatTime(iso)}`;
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  return `${date}, ${formatTime(iso)}`;
}

export function formatFull(iso) {
  if (!iso) return 'Never';
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${date}, ${formatTime(iso)}`;
}

// Local YYYY-MM-DD, matches <input type="date"> values.
export function toDateInputValue(iso) {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export const UID_PATTERN = /^([0-9A-F]{2}-){3}[0-9A-F]{2}$/;

// Accepts "21:28:2f:66", "21 28 2F 66" or "21282F66" and returns "21-28-2F-66".
export function normalizeUid(value = '') {
  const raw = value.replace(/[^0-9a-f]/gi, '').toUpperCase();
  if (raw.length === 8) return raw.match(/../g).join('-');
  return value.trim().toUpperCase();
}
