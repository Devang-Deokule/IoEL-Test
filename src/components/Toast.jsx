import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react';
import { useApp } from '../hooks/useApp';

const TONES = {
  success: { icon: CheckCircle2, color: 'text-emerald-400' },
  warning: { icon: TriangleAlert, color: 'text-amber-400' },
  danger: { icon: XCircle, color: 'text-red-400' },
  info: { icon: Info, color: 'text-sky-400' },
};

export default function Toast() {
  const { toast, dismissToast } = useApp();
  if (!toast) return <div aria-live="polite" className="sr-only" />;
  const { icon: Icon, color } = TONES[toast.tone] ?? TONES.info;

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-end sm:inset-x-auto sm:right-6">
      <div
        key={toast.id}
        role="status"
        className="pointer-events-auto flex max-w-sm items-start gap-3 rounded-lg bg-ink px-4 py-3 text-sm text-white shadow-lg"
      >
        <Icon size={18} className={`mt-0.5 shrink-0 ${color}`} aria-hidden />
        <p className="flex-1">{toast.message}</p>
        <button type="button" onClick={dismissToast} aria-label="Dismiss notification" className="text-white/60 hover:text-white">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
