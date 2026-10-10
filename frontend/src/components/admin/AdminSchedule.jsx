import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { formatTime, getIndiaToday } from '../../lib/time';
import { EmptyState, ErrorState, InlineAlert, LoadingState } from '../StatusMessage';
import SlotModal from './SlotModal';
import { SLOT_STATUS, slotKind } from './slotStatus';
import { DateNav, StatCard } from './ui';

const SLOT_STYLES = {
  available: 'border-border text-text-secondary hover:border-accent-ink hover:text-accent-ink',
  requested: 'bg-warning/10 border-warning/50 text-warning hover:bg-warning/20',
  booked: 'bg-accent/15 border-accent-ink/50 text-accent-ink hover:bg-accent/25',
  blocked: 'bg-danger/10 border-danger/40 text-danger hover:bg-danger/20',
  past: 'border-border text-text-muted opacity-50',
};

function slotCaption(slot) {
  if (slot.state === 'booked') return slot.booking?.user?.name ?? 'Booked';
  if (slot.state === 'blocked') return 'Blocked';
  if (slot.isPast) return 'Passed';
  const count = slot.requests?.length ?? 0;
  if (count > 0) return `${count} request${count === 1 ? '' : 's'}`;
  return 'Free';
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-text-secondary">
      {['available', 'requested', 'booked', 'blocked', 'past'].map((kind) => (
        <span key={kind} className="flex items-center gap-2">
          <span className={`w-3 h-3 border ${SLOT_STYLES[kind]}`} aria-hidden="true" />
          {SLOT_STATUS[kind].label}
        </span>
      ))}
    </div>
  );
}

function CourtSchedule({ court, slots, onSlotClick, onStatusChange, statusBusy }) {
  return (
    <div className="relative bg-bg-card border border-border">
      <div className="absolute left-0 top-0 w-1 h-full" style={{ background: court.color }} aria-hidden="true" />

      {/* Court header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 pt-5">
        <div>
          <p className="font-heading font-bold text-lg tracking-wide">{court.name}</p>
          <p className="text-xs text-text-muted">
            {[court.type, `₹${court.pricePerHour}/hr`].filter(Boolean).join(' · ')}
          </p>
        </div>
        <label className="flex items-center gap-3">
          <span className="text-xs text-text-muted uppercase tracking-widest font-heading">Court status</span>
          <select
            value={court.available ? 'open' : 'maintenance'}
            onChange={(e) => onStatusChange(court, e.target.value === 'open')}
            disabled={statusBusy}
            className={`bg-bg-secondary border px-3 py-2 text-sm font-heading focus:outline-none focus:border-accent-ink disabled:opacity-50 ${
              court.available ? 'border-success/50 text-success' : 'border-warning/60 text-warning'
            }`}
          >
            <option value="open">Open</option>
            <option value="maintenance">Under maintenance</option>
          </select>
        </label>
      </div>

      {!court.available && (
        <p className="mx-5 mt-4 px-3 py-2 text-xs border border-warning/40 bg-warning/5 text-warning">
          Under maintenance - players can't book this court. Existing bookings below are not cancelled automatically.
        </p>
      )}

      {/* Slots */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 p-5">
        {slots.map((slot) => {
          const kind = slotKind(slot);
          return (
            <button
              key={slot.startTime}
              type="button"
              onClick={() => onSlotClick(court, slot)}
              className={`border px-2 py-2.5 text-left transition-colors duration-200 ${SLOT_STYLES[kind]}`}
              aria-label={`${court.name}, ${formatTime(slot.startTime)}: ${slotCaption(slot)}`}
            >
              <span className="block font-heading text-sm font-semibold">{formatTime(slot.startTime)}</span>
              <span className="block text-[11px] truncate mt-0.5">{slotCaption(slot)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminSchedule() {
  const [date, setDate] = useState(getIndiaToday);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [statusBusyId, setStatusBusyId] = useState(null);
  const [selected, setSelected] = useState(null); // { court, slot }

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return api.admin.getSchedule(date)
      .then((data) => setSchedule(data.schedule))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const handleDateChange = (value) => {
    setNotice(null);
    setActionError(null);
    setDate(value);
  };

  const handleStatusChange = async (court, open) => {
    setNotice(null);
    setActionError(null);
    setStatusBusyId(court.id);
    try {
      await api.admin.updateCourt(court.id, { available: open });
      setNotice(`${court.name} is now ${open ? 'open' : 'under maintenance'}.`);
      await load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setStatusBusyId(null);
    }
  };

  const handleSlotAction = async (action, bookingId) => {
    const { court, slot } = selected;
    const target = { courtId: court.id, date, startTime: slot.startTime };
    const time = formatTime(slot.startTime);

    if (action === 'block') {
      await api.admin.blockSlot(target);
      setNotice(`${court.name} at ${time} is now blocked.`);
    } else if (action === 'unblock') {
      await api.admin.unblockSlot(target);
      setNotice(`${court.name} at ${time} is open for booking again.`);
    } else if (action === 'cancel') {
      await api.admin.cancelBooking(slot.booking.id);
      setNotice(`Booking ${slot.booking.id} was cancelled. The slot is free again.`);
    } else if (action === 'confirm') {
      const result = await api.admin.confirmBooking(bookingId);
      const others = result.rejectedRequests?.length ?? 0;
      setNotice(`Booking ${bookingId} is confirmed for ${court.name} at ${time}.${others ? ` ${others} other request${others === 1 ? ' was' : 's were'} rejected.` : ''}`);
    } else if (action === 'reject') {
      await api.admin.cancelBooking(bookingId);
      setNotice(`Request ${bookingId} was rejected.`);
    } else if (action === 'cancelAndBlock') {
      await api.admin.blockSlot(target);
      setNotice(`Booking ${slot.booking.id} was cancelled and ${time} is blocked.`);
    }

    setSelected(null);
    await load();
  };

  const closeModal = useCallback(() => setSelected(null), []);

  // Day totals across all courts (upcoming slots only for free/blocked).
  const allSlots = schedule.flatMap((c) => c.slots);
  const bookedCount = allSlots.filter((s) => s.state === 'booked').length;
  const freeCount = allSlots.filter((s) => s.state === 'available' && !s.isPast).length;
  const blockedCount = allSlots.filter((s) => s.state === 'blocked').length;
  const requestCount = allSlots
    .filter((s) => !s.isPast)
    .reduce((sum, s) => sum + (s.requests?.length ?? 0), 0);

  return (
    <div className="space-y-6">
      <DateNav date={date} onChange={handleDateChange} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Awaiting payment" value={requestCount} />
        <StatCard label="Booked" value={bookedCount} />
        <StatCard label="Free (upcoming)" value={freeCount} />
        <StatCard label="Blocked" value={blockedCount} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Legend />
        <p className="text-xs text-text-muted">Click any slot to manage it.</p>
      </div>

      {notice && <InlineAlert tone="success">{notice}</InlineAlert>}
      {actionError && <InlineAlert>{actionError}</InlineAlert>}

      {loading && schedule.length === 0 ? (
        <LoadingState label="Loading schedule…" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : schedule.length === 0 ? (
        <EmptyState>No courts yet. Add one in the Courts tab.</EmptyState>
      ) : (
        <div className={`space-y-4 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {schedule.map(({ court, slots }) => (
            <CourtSchedule
              key={court.id}
              court={court}
              slots={slots}
              onSlotClick={(c, s) => setSelected({ court: c, slot: s })}
              onStatusChange={handleStatusChange}
              statusBusy={statusBusyId === court.id}
            />
          ))}
        </div>
      )}

      {selected && (
        <SlotModal
          court={selected.court}
          date={date}
          slot={selected.slot}
          onAction={handleSlotAction}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
