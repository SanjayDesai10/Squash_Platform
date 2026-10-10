import { useEffect, useState } from 'react';
import ModalPortal from '../ModalPortal';
import { InlineAlert } from '../StatusMessage';
import { formatFullDate, formatTimeRange } from '../../lib/time';
import { SLOT_STATUS, slotKind } from './slotStatus';
import { Badge } from './ui';

function formatRequestedAt(createdAt) {
  return new Date(createdAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function Detail({ label, children }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-text-secondary">{label}</span>
      <span className="text-right break-all">{children}</span>
    </div>
  );
}

/** Admin actions for one slot: confirm/reject requests, block, cancel. */
export default function SlotModal({ court, date, slot, onAction, onClose }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const kind = slotKind(slot);
  const status = SLOT_STATUS[kind];
  const { booking } = slot;
  const requests = slot.isPast ? [] : (slot.requests ?? []);

  const run = async (action, bookingId) => {
    if (action === 'reject' && !window.confirm('Reject this request?')) return;

    const key = bookingId ? `${action}:${bookingId}` : action;
    setBusy(key);
    setError(null);
    try {
      await onAction(action, bookingId);
    } catch (err) {
      setError(err.message);
      setBusy(null);
    }
  };

  const button = (action, label, tone = 'primary', bookingId) => {
    const key = bookingId ? `${action}:${bookingId}` : action;
    return (
      <button
        type="button"
        onClick={() => run(action, bookingId)}
        disabled={busy !== null}
        className={`justify-center disabled:opacity-50 ${
          tone === 'danger'
            ? 'magnetic-btn border border-danger/60 text-danger hover:bg-danger hover:text-on-accent'
            : tone === 'secondary'
            ? 'magnetic-btn magnetic-btn-secondary'
            : 'magnetic-btn magnetic-btn-primary'
        }`}
      >
        {busy === key ? 'Working…' : label}
      </button>
    );
  };

  return (
    <ModalPortal>
    <div
      className="fixed inset-0 z-[60] flex overflow-y-auto p-4 sm:p-8 bg-bg-primary/80 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Slot actions"
    >
      <div className="m-auto bg-bg-secondary border border-border p-6 md:p-8 w-full max-w-lg">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-widest font-heading">{court.name}</p>
            <h2 className="font-heading text-2xl font-bold mt-1">{formatTimeRange(slot.startTime, slot.endTime)}</h2>
            <p className="text-sm text-text-secondary mt-1">{formatFullDate(date)}</p>
          </div>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>

        {/* Confirmed booking */}
        {booking && (
          <div className="mt-6 bg-bg-card border border-border p-4 space-y-2 text-sm">
            <Detail label="Player"><span className="font-heading font-semibold">{booking.user?.name ?? '-'}</span></Detail>
            {booking.user?.email && <Detail label="Email">{booking.user.email}</Detail>}
            <Detail label="Booking ID"><span className="tracking-wider">{booking.id}</span></Detail>
            <Detail label="Price"><span className="font-heading font-semibold">₹{booking.price}</span></Detail>
          </div>
        )}

        {/* Payment requests */}
        {requests.length > 0 && (
          <div className="mt-6">
            <p className="text-xs text-text-muted uppercase tracking-widest font-heading">
              Awaiting payment ({requests.length})
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Confirm a request once the player has paid. Any other requests for this slot are rejected automatically.
            </p>
            <ul className="mt-4 space-y-3">
              {requests.map((request) => (
                <li key={request.id} className="bg-bg-card border border-warning/30 p-4 text-sm">
                  <div className="space-y-1.5">
                    <Detail label="Player"><span className="font-heading font-semibold">{request.user?.name ?? '-'}</span></Detail>
                    {request.user?.email && <Detail label="Email">{request.user.email}</Detail>}
                    <Detail label="Booking ID"><span className="tracking-wider">{request.id}</span></Detail>
                    <Detail label="Amount"><span className="font-heading font-semibold">₹{request.price}</span></Detail>
                    <Detail label="Requested">{formatRequestedAt(request.createdAt)}</Detail>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {button('confirm', 'Confirm (paid)', 'primary', request.id)}
                    {button('reject', 'Reject', 'danger', request.id)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Explanation */}
        <p className="mt-6 text-sm text-text-secondary">
          {slot.isPast
            ? 'This slot has already started, so it can no longer be changed.'
            : slot.state === 'available' && requests.length === 0
            ? 'This slot is free. Block it to stop players from requesting it.'
            : slot.state === 'available'
            ? 'You can also block this slot, which rejects all requests above.'
            : slot.state === 'booked'
            ? 'Cancel the booking to free the slot, or cancel and block it so nobody can rebook.'
            : 'This slot is blocked. Players see it as unavailable.'}
        </p>

        {error && <div className="mt-4"><InlineAlert>{error}</InlineAlert></div>}

        {/* Slot actions */}
        <div className="mt-6 flex flex-col gap-3">
          {!slot.isPast && slot.state === 'available' && button('block', 'Block Slot', 'danger')}
          {!slot.isPast && slot.state === 'booked' && (
            <>
              {button('cancel', 'Cancel Booking', 'danger')}
              {button('cancelAndBlock', 'Cancel Booking & Block Slot', 'danger')}
            </>
          )}
          {!slot.isPast && slot.state === 'blocked' && button('unblock', 'Unblock Slot')}
          <button
            type="button"
            onClick={onClose}
            className="magnetic-btn magnetic-btn-secondary w-full justify-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
