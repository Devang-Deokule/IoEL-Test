import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { ASSET_STATUSES, ASSET_TYPES, LOCATIONS } from '../data/constants';

const EMPTY = { name: '', rfidUid: '', type: ASSET_TYPES[0], location: LOCATIONS[0].name, status: 'Available' };

export default function AssetFormModal({ onClose, onCreated }) {
  const { addAsset } = useApp();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const created = await addAsset(form);
      onCreated?.(created);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-asset-title"
        className="w-full max-w-lg rounded-xl bg-surface p-6"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 id="add-asset-title" className="text-lg font-semibold text-ink">
              Add asset
            </h2>
            <p className="mt-0.5 text-sm text-ink-soft">Register a new piece of equipment and its RFID tag.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-ink-mute hover:bg-canvas">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="asset-name" className="mb-1.5 block text-sm font-medium">
              Equipment name
            </label>
            <input id="asset-name" className="field" value={form.name} onChange={set('name')} placeholder="Ventilator" autoFocus required />
          </div>

          <div>
            <label htmlFor="asset-uid" className="mb-1.5 block text-sm font-medium">
              RFID UID
            </label>
            <input
              id="asset-uid"
              className="field font-mono"
              value={form.rfidUid}
              onChange={set('rfidUid')}
              placeholder="21-28-2F-66"
              required
              aria-describedby="asset-uid-help"
            />
            <p id="asset-uid-help" className="mt-1 text-xs text-ink-mute">
              Four hex bytes, as printed by the RC522 reader.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="asset-type" className="mb-1.5 block text-sm font-medium">
                Type
              </label>
              <select id="asset-type" className="field" value={form.type} onChange={set('type')}>
                {ASSET_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="asset-location" className="mb-1.5 block text-sm font-medium">
                Department / location
              </label>
              <select id="asset-location" className="field" value={form.location} onChange={set('location')}>
                {LOCATIONS.map((l) => (
                  <option key={l.name}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="asset-status" className="mb-1.5 block text-sm font-medium">
              Status
            </label>
            <select id="asset-status" className="field" value={form.status} onChange={set('status')}>
              {ASSET_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          {error && (
            <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Add asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
