import { useEffect, useState } from 'react';
import ModalPortal from '../ModalPortal';
import FormField from '../FormField';
import { InlineAlert } from '../StatusMessage';

const EMPTY_COURT = {
  name: '',
  type: '',
  description: '',
  features: '',
  pricePerHour: '',
  color: '#c8ff00',
};

/** Add / edit court dialog. `court` is null when adding. */
export default function CourtFormModal({ court, onSave, onClose }) {
  const isEditing = Boolean(court);
  const [form, setForm] = useState(() => (court
    ? {
      name: court.name,
      type: court.type ?? '',
      description: court.description ?? '',
      features: court.features.join(', '),
      pricePerHour: String(court.pricePerHour),
      color: court.color,
    }
    : EMPTY_COURT));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const price = Number(form.pricePerHour);
    if (!Number.isInteger(price) || price <= 0) {
      setError('Price must be a whole number greater than 0.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      type: form.type.trim() || null,
      description: form.description.trim() || null,
      features: form.features.split(',').map((f) => f.trim()).filter(Boolean),
      pricePerHour: price,
      color: form.color,
    };

    setSaving(true);
    try {
      await onSave(payload);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <ModalPortal>
    <div
      className="fixed inset-0 z-[60] flex overflow-y-auto p-4 sm:p-8 bg-bg-primary/80 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? 'Edit court' : 'Add court'}
    >
      <form
        onSubmit={handleSubmit}
        className="m-auto bg-bg-secondary border border-border p-6 md:p-8 w-full max-w-lg space-y-5"
      >
        <h2 className="font-heading text-2xl font-bold">{isEditing ? 'Edit Court' : 'Add Court'}</h2>

        {error && <InlineAlert>{error}</InlineAlert>}

        <FormField id="court-name" label="Name" value={form.name} onChange={set('name')} hint="e.g. Court 05" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField id="court-type" label="Type" value={form.type} onChange={set('type')} required={false} hint="e.g. Premium" />
          <FormField id="court-price" label="Price per hour (₹)" type="number" value={form.pricePerHour} onChange={set('pricePerHour')} />
        </div>
        <div>
          <label htmlFor="court-description" className="block text-xs text-text-muted uppercase tracking-widest mb-2 font-heading">
            Description
          </label>
          <textarea
            id="court-description"
            value={form.description}
            onChange={(e) => set('description')(e.target.value)}
            rows={3}
            className="w-full bg-bg-card border border-border px-4 py-3 text-text-primary transition-colors duration-300 focus:border-accent-ink focus:outline-none resize-y"
          />
        </div>
        <FormField
          id="court-features"
          label="Features"
          value={form.features}
          onChange={set('features')}
          required={false}
          hint="Separate with commas, e.g. LED Lighting, Tournament Net"
        />
        <div>
          <label htmlFor="court-color" className="block text-xs text-text-muted uppercase tracking-widest mb-2 font-heading">
            Colour
          </label>
          <div className="flex items-center gap-3">
            <input
              id="court-color"
              type="color"
              value={form.color}
              onChange={(e) => set('color')(e.target.value)}
              className="w-12 h-10 bg-bg-card border border-border cursor-pointer"
            />
            <span className="text-sm text-text-secondary font-heading">{form.color}</span>
          </div>
          <p className="mt-2 text-xs text-text-muted">Used to tell courts apart on the site.</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="magnetic-btn magnetic-btn-primary flex-1 justify-center disabled:opacity-50">
            {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Court'}
          </button>
          <button type="button" onClick={onClose} className="magnetic-btn magnetic-btn-secondary flex-1 justify-center">
            Cancel
          </button>
        </div>
      </form>
    </div>
    </ModalPortal>
  );
}
