// Shared constants used by mock data, the mock server and the UI.

export const LOCATIONS = [
  { name: 'ICU', short: 'ICU' },
  { name: 'General Ward', short: 'General Ward' },
  { name: 'Storage', short: 'Storage' },
  { name: 'Operation Theatre', short: 'OT' },
  { name: 'Emergency', short: 'Emergency' },
];

// With a single reader, an EXIT only tells us the asset left the checkpoint area.
// Its next location is unknown until it is scanned again somewhere.
export const IN_TRANSIT = 'In Transit';

export const ALL_LOCATIONS = [...LOCATIONS.map((l) => l.name), IN_TRANSIT];

// Staff-managed status. Separate from RFID events.
export const ASSET_STATUSES = ['Available', 'In Use', 'Maintenance'];

export const ASSET_TYPES = [
  'Critical Equipment',
  'Monitoring',
  'Infusion',
  'Diagnostic',
  'Imaging',
  'Respiratory',
  'Mobility',
  'Surgical',
  'Patient Care',
];

// RFID-derived events. Separate from asset status.
export const EVENT_TYPES = ['ENTRY', 'EXIT', 'ALERT'];

// Tags used by the "Simulate RFID scan" control (frontend testing only).
export const DEFAULT_SIM_UID = '21-28-2F-66'; // A001 Ventilator
export const UNKNOWN_SIM_UID = '9F-3A-77-C1'; // not registered to any asset
