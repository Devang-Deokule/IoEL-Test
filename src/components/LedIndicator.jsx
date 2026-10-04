// Mirrors the LEDs on the physical checkpoint:
//   blue = ready, green = entry, yellow = exit, red (+ buzzer) = invalid scan.
export const LEDS = [
  {
    key: 'ready',
    label: 'Ready',
    hardware: 'Blue LED',
    meaning: 'Checkpoint is powered and waiting for a tag.',
    dot: 'bg-sky-400',
    on: 'bg-sky-400 shadow-[0_0_12px_3px_rgba(56,189,248,0.55)]',
    off: 'bg-sky-400/20',
  },
  {
    key: 'entry',
    label: 'Entry',
    hardware: 'Green LED',
    meaning: 'First valid scan. The asset entered this checkpoint.',
    dot: 'bg-emerald-400',
    on: 'bg-emerald-400 shadow-[0_0_12px_3px_rgba(52,211,153,0.55)]',
    off: 'bg-emerald-400/20',
  },
  {
    key: 'exit',
    label: 'Exit',
    hardware: 'Yellow LED',
    meaning: 'Second valid scan. The asset left this checkpoint.',
    dot: 'bg-amber-400',
    on: 'bg-amber-400 shadow-[0_0_12px_3px_rgba(251,191,36,0.55)]',
    off: 'bg-amber-400/20',
  },
  {
    key: 'alert',
    label: 'Alert',
    hardware: 'Red LED + buzzer',
    meaning: 'Unknown tag or failed read.',
    dot: 'bg-red-500',
    on: 'bg-red-500 shadow-[0_0_12px_3px_rgba(239,68,68,0.6)]',
    off: 'bg-red-500/20',
  },
];

export const LED_BY_KEY = Object.fromEntries(LEDS.map((l) => [l.key, l]));

export function LedLamp({ ledKey, lit = true }) {
  const led = LED_BY_KEY[ledKey];
  return <span className={`inline-block h-3.5 w-3.5 rounded-full ${lit ? led.on : led.off}`} aria-hidden />;
}

// A row of four lamps for use on a dark background. Only the active lamp is lit.
export default function LedStrip({ active = 'ready' }) {
  return (
    <ul className="flex items-center justify-between gap-2" aria-label={`Checkpoint indicator: ${LED_BY_KEY[active].label}`}>
      {LEDS.map((led) => {
        const lit = led.key === active;
        return (
          <li key={led.key} className="flex flex-1 flex-col items-center gap-2">
            <LedLamp ledKey={led.key} lit={lit} />
            <span className={`text-[11px] ${lit ? 'text-white' : 'text-white/50'}`}>{led.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
