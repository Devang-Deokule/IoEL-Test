import { at } from './time';

// status           -> set by hospital staff (Available | In Use | Maintenance)
// lastEvent        -> from RFID scans (ENTRY | EXIT | null)
// expectedLocation -> if set, an ENTRY anywhere else raises an "Unexpected movement" alert
const asset = (
  id, name, rfidUid, type, department, location, status, lastEvent, lastDetected, expectedLocation = null,
) => ({ id, name, rfidUid, type, department, location, status, lastEvent, lastDetected, expectedLocation });

export const seedAssets = [
  asset('A001', 'Ventilator', '21-28-2F-66', 'Critical Equipment', 'ICU', 'ICU', 'Available', 'ENTRY', at(0, 10, 32), 'ICU'),
  asset('A002', 'Wheelchair', '4B-9E-10-C3', 'Mobility', 'General Ward', 'Storage', 'Available', 'EXIT', at(0, 10, 25)),
  asset('A003', 'Oxygen Concentrator', '7D-31-A5-08', 'Respiratory', 'Storage', 'Storage', 'Maintenance', 'ENTRY', at(1, 16, 40)),
  asset('A004', 'Patient Monitor', '93-C2-6E-1F', 'Monitoring', 'ICU', 'ICU', 'In Use', 'ENTRY', at(0, 10, 8)),
  asset('A005', 'Infusion Pump', '5A-E7-42-B9', 'Infusion', 'ICU', 'ICU', 'In Use', 'ENTRY', at(0, 8, 55)),
  asset('A006', 'Defibrillator', 'C8-14-9D-73', 'Critical Equipment', 'Emergency', 'Emergency', 'Available', 'ENTRY', at(0, 8, 40), 'Emergency'),
  asset('A007', 'ECG Machine', '3F-A0-D6-52', 'Diagnostic', 'General Ward', 'General Ward', 'Available', 'ENTRY', at(0, 9, 20)),
  asset('A008', 'Portable X-Ray Unit', 'B1-67-2C-E4', 'Imaging', 'Operation Theatre', 'Operation Theatre', 'In Use', 'ENTRY', at(0, 8, 5)),
  asset('A009', 'Anesthesia Machine', '06-F9-8A-3D', 'Critical Equipment', 'Operation Theatre', 'Operation Theatre', 'In Use', 'ENTRY', at(0, 8, 12), 'Operation Theatre'),
  asset('A010', 'Surgical Light', 'E2-5B-71-A8', 'Surgical', 'Operation Theatre', 'Operation Theatre', 'Available', 'ENTRY', at(1, 15, 30)),
  asset('A011', 'Stretcher', '84-0D-C9-16', 'Mobility', 'Emergency', 'Emergency', 'In Use', 'ENTRY', at(0, 9, 50)),
  asset('A012', 'Suction Unit', '1C-D3-F0-6B', 'Respiratory', 'Emergency', 'Emergency', 'Available', 'ENTRY', at(1, 18, 10)),
  asset('A013', 'Syringe Pump', 'AF-48-25-97', 'Infusion', 'ICU', 'ICU', 'Available', 'ENTRY', at(1, 13, 45)),
  asset('A014', 'Pulse Oximeter', '69-B2-0E-D1', 'Monitoring', 'General Ward', 'General Ward', 'Available', 'ENTRY', at(0, 7, 45)),
  asset('A015', 'Hospital Bed', 'D7-81-34-5C', 'Patient Care', 'General Ward', 'General Ward', 'In Use', 'ENTRY', at(2, 11, 0)),
  asset('A016', 'Wheelchair', '2E-6A-B8-F3', 'Mobility', 'General Ward', 'General Ward', 'Available', 'ENTRY', at(0, 9, 35)),
  asset('A017', 'Nebulizer', 'F5-19-C7-40', 'Respiratory', 'General Ward', 'General Ward', 'Available', 'ENTRY', at(1, 10, 20)),
  asset('A018', 'Infusion Pump', '38-CE-93-A2', 'Infusion', 'General Ward', 'General Ward', 'Maintenance', 'ENTRY', at(3, 14, 5)),
  asset('A019', 'Ultrasound Scanner', '9A-05-6D-E8', 'Imaging', 'Emergency', 'Emergency', 'Available', 'ENTRY', at(0, 9, 0)),
  asset('A020', 'Crash Cart', '70-F4-1B-2A', 'Critical Equipment', 'Emergency', 'Emergency', 'Available', 'ENTRY', at(1, 8, 35), 'Emergency'),
  asset('A021', 'Patient Monitor', 'C3-A9-57-0E', 'Monitoring', 'General Ward', 'General Ward', 'Available', 'ENTRY', at(0, 8, 25)),
  asset('A022', 'Portable Suction Pump', '15-8B-E2-D6', 'Respiratory', 'Storage', 'Storage', 'Available', 'ENTRY', at(2, 17, 15)),
  asset('A023', 'BP Monitor', 'BE-72-48-91', 'Monitoring', 'Storage', 'Storage', 'Available', 'ENTRY', at(1, 9, 5)),
  asset('A024', 'Ventilator', '4D-0C-F6-B5', 'Critical Equipment', 'ICU', 'ICU', 'Maintenance', 'ENTRY', at(2, 12, 0), 'ICU'),
];
