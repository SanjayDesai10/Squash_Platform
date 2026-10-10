import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { EmptyState, ErrorState, InlineAlert, LoadingState } from '../StatusMessage';
import CourtFormModal from './CourtFormModal';
import { ActionButton, Badge } from './ui';

function getStatus(court) {
  if (!court.isActive) return { label: 'Removed', tone: 'grey' };
  if (!court.available) return { label: 'Maintenance', tone: 'amber' };
  return { label: 'Open', tone: 'green' };
}

export default function AdminCourts() {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  // null = closed, 'new' = adding, court object = editing
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return api.admin.getCourts()
      .then((data) => setCourts(data.courts))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const runAction = async (court, action) => {
    setActionError(null);
    setBusyId(court.id);
    try {
      await action();
      await load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const toggleMaintenance = (court) => runAction(court, () =>
    api.admin.updateCourt(court.id, { available: !court.available }));

  const removeCourt = (court) => {
    if (!window.confirm(`Remove ${court.name}? It will be hidden from the site and can't be booked. Existing bookings are kept, and you can restore it later.`)) return;
    runAction(court, () => api.admin.deactivateCourt(court.id));
  };

  const restoreCourt = (court) => runAction(court, () =>
    api.admin.updateCourt(court.id, { isActive: true, available: true }));

  const handleSave = async (payload) => {
    if (editing === 'new') await api.admin.createCourt(payload);
    else await api.admin.updateCourt(editing.id, payload);
    setEditing(null);
    load();
  };

  const closeModal = useCallback(() => setEditing(null), []);

  // Removed courts go last.
  const sorted = [...courts].sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.id - b.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-text-secondary">
          {courts.filter((c) => c.isActive).length} active court{courts.filter((c) => c.isActive).length === 1 ? '' : 's'}
        </p>
        <button type="button" onClick={() => setEditing('new')} className="magnetic-btn magnetic-btn-primary text-xs py-3 px-6">
          + Add Court
        </button>
      </div>

      {actionError && <InlineAlert>{actionError}</InlineAlert>}

      {loading && courts.length === 0 ? (
        <LoadingState label="Loading courts…" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : courts.length === 0 ? (
        <EmptyState>No courts yet. Add your first court to start taking bookings.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {sorted.map((court) => {
            const status = getStatus(court);
            const busy = busyId === court.id;
            return (
              <li
                key={court.id}
                className={`relative bg-bg-card border border-border p-5 flex flex-col md:flex-row md:items-center gap-4 ${court.isActive ? '' : 'opacity-60'}`}
              >
                <div className="absolute left-0 top-0 w-1 h-full" style={{ background: court.color }} aria-hidden="true" />

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-heading font-bold tracking-wide">{court.name}</p>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">
                    {[court.type, `₹${court.pricePerHour}/hr`].filter(Boolean).join(' · ')}
                  </p>
                  {court.features.length > 0 && (
                    <p className="mt-1 text-xs text-text-muted truncate">{court.features.join(' · ')}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {court.isActive ? (
                    <>
                      <ActionButton onClick={() => setEditing(court)} disabled={busy}>Edit</ActionButton>
                      <ActionButton onClick={() => toggleMaintenance(court)} disabled={busy}>
                        {court.available ? 'Close for maintenance' : 'Reopen'}
                      </ActionButton>
                      <ActionButton tone="danger" onClick={() => removeCourt(court)} disabled={busy}>Remove</ActionButton>
                    </>
                  ) : (
                    <ActionButton onClick={() => restoreCourt(court)} disabled={busy}>Restore</ActionButton>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <CourtFormModal
          court={editing === 'new' ? null : editing}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
