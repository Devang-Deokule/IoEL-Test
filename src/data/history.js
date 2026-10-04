import { at } from './time';
import { seedAssets } from './assets';
import { seedCheckpoints } from './checkpoints';

const byId = Object.fromEntries(seedAssets.map((a) => [a.id, a]));
const cpLabel = (location) => seedCheckpoints.find((c) => c.location === location).label;

// move(daysAgo, hour, minute, assetId, event, from, to, checkpointLocation)
const move = (d, h, m, assetId, event, previousLocation, newLocation, cp) => ({
  assetId,
  assetName: byId[assetId].name,
  rfidUid: byId[assetId].rfidUid,
  event,
  previousLocation,
  newLocation,
  checkpoint: cpLabel(cp),
  timestamp: at(d, h, m),
  note: null,
});

const invalid = (d, h, m, rfidUid, cp, note) => ({
  assetId: null,
  assetName: 'Unknown tag',
  rfidUid,
  event: 'ALERT',
  previousLocation: null,
  newLocation: null,
  checkpoint: cpLabel(cp),
  timestamp: at(d, h, m),
  note,
});

const rows = [
  invalid(0, 10, 42, '9F-3A-77-C1', 'ICU', 'Unregistered tag'),
  move(0, 10, 32, 'A001', 'ENTRY', 'Storage', 'ICU', 'ICU'),
  move(0, 10, 25, 'A002', 'EXIT', 'ICU', 'Storage', 'ICU'),
  move(0, 10, 8, 'A004', 'ENTRY', 'Storage', 'ICU', 'ICU'),
  move(0, 9, 50, 'A011', 'ENTRY', 'General Ward', 'Emergency', 'Emergency'),
  move(0, 9, 35, 'A016', 'ENTRY', 'Storage', 'General Ward', 'General Ward'),
  move(0, 9, 20, 'A007', 'ENTRY', 'Storage', 'General Ward', 'General Ward'),
  move(0, 9, 15, 'A001', 'EXIT', 'ICU', 'Storage', 'ICU'),
  move(0, 9, 0, 'A019', 'ENTRY', 'Storage', 'Emergency', 'Emergency'),
  invalid(0, 8, 57, null, 'Emergency', 'Tag could not be read'),
  move(0, 8, 55, 'A005', 'ENTRY', 'Storage', 'ICU', 'ICU'),
  move(0, 8, 40, 'A006', 'ENTRY', 'Storage', 'Emergency', 'Emergency'),
  move(0, 8, 25, 'A021', 'ENTRY', 'Storage', 'General Ward', 'General Ward'),
  move(0, 8, 12, 'A009', 'ENTRY', 'Storage', 'Operation Theatre', 'Operation Theatre'),
  move(0, 8, 5, 'A008', 'ENTRY', 'Storage', 'Operation Theatre', 'Operation Theatre'),
  move(0, 7, 45, 'A014', 'ENTRY', 'Storage', 'General Ward', 'General Ward'),
  move(1, 18, 10, 'A012', 'ENTRY', 'Storage', 'Emergency', 'Emergency'),
  move(1, 16, 40, 'A003', 'ENTRY', 'General Ward', 'Storage', 'Storage'),
  move(1, 15, 30, 'A010', 'ENTRY', 'Storage', 'Operation Theatre', 'Operation Theatre'),
  move(1, 14, 5, 'A001', 'ENTRY', 'Storage', 'ICU', 'ICU'),
  move(1, 13, 45, 'A013', 'ENTRY', 'Storage', 'ICU', 'ICU'),
  move(1, 12, 10, 'A002', 'ENTRY', 'Storage', 'ICU', 'ICU'),
  move(1, 10, 20, 'A017', 'ENTRY', 'Storage', 'General Ward', 'General Ward'),
  move(1, 9, 5, 'A023', 'ENTRY', 'ICU', 'Storage', 'Storage'),
  move(1, 8, 35, 'A020', 'ENTRY', 'Storage', 'Emergency', 'Emergency'),
  move(1, 8, 30, 'A001', 'EXIT', 'ICU', 'Storage', 'ICU'),
  move(2, 17, 15, 'A022', 'ENTRY', 'General Ward', 'Storage', 'Storage'),
  move(2, 16, 40, 'A001', 'ENTRY', 'Storage', 'ICU', 'ICU'),
  move(2, 12, 0, 'A024', 'ENTRY', 'Storage', 'ICU', 'ICU'),
  move(2, 11, 0, 'A015', 'ENTRY', 'Storage', 'General Ward', 'General Ward'),
  move(3, 14, 5, 'A018', 'ENTRY', 'Storage', 'General Ward', 'General Ward'),
];

rows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

// Newest entry gets the highest id.
export const seedHistory = rows.map((r, i) => ({
  id: `H-${String(rows.length - i).padStart(4, '0')}`,
  ...r,
}));
