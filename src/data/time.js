// Builds an ISO timestamp for "N days ago at HH:MM" (local time).
export function at(daysAgo, hours, minutes) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}
