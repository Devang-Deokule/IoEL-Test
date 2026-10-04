// A checkpoint is a place the single physical RC522 reader can be assigned to.
// Which one is "active" is runtime state (see services/mockServer.js).

export const READER = { id: 'rc522-1', name: 'RC522 #1', controller: 'ESP32 #1' };

export const DEFAULT_CHECKPOINT_ID = 'icu';

export const seedCheckpoints = [
  { id: 'icu', title: 'ICU', location: 'ICU', label: 'ICU Checkpoint' },
  { id: 'general-ward', title: 'General Ward', location: 'General Ward', label: 'General Ward Checkpoint' },
  { id: 'storage', title: 'Storage', location: 'Storage', label: 'Storage Checkpoint' },
  { id: 'operation-theatre', title: 'Operation Theatre', location: 'Operation Theatre', label: 'Operation Theatre Checkpoint' },
  { id: 'emergency', title: 'Emergency Department', location: 'Emergency', label: 'Emergency Department Checkpoint' },
];
