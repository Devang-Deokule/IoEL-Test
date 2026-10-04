import { ArrowLeftRight, Info, Radio, ScanLine, ShieldAlert, WifiOff, Flame, Wind, Activity, Thermometer } from 'lucide-react';

export const TYPE_ICONS = {
  UNKNOWN_RFID: ShieldAlert,
  UNEXPECTED_MOVEMENT: ArrowLeftRight,
  SCAN_FAILED: ScanLine,
  CHECKPOINT_OFFLINE: WifiOff,
  READER_ASSIGNED: Radio,
  FIRE: Flame,
  SMOKE: Wind,
  EARTHQUAKE: Activity,
  VIBRATION: Activity,
  TEMPERATURE: Thermometer,
  DEFAULT: Info,
};

// Red = critical, yellow = warning, blue = information
export const SEVERITY_STYLES = {
  critical: { bar: 'bg-danger', tile: 'bg-danger-bg text-danger' },
  warning: { bar: 'bg-amber-500', tile: 'bg-warn-bg text-warn' },
  info: { bar: 'bg-brand-500', tile: 'bg-info-bg text-info' },
};
