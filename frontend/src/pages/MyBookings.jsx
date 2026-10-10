import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { CONTACT_PHONE, CONTACT_PHONE_HREF } from '../lib/contact';
import { formatShortDate, formatTimeRange, hasStarted } from '../lib/time';
import { EmptyState, ErrorState, InlineAlert, LoadingState } from '../components/StatusMessage';
import { animatePageEnter } from '../animations/heroAnimations';

function getDisplayStatus(booking) {
  if (booking.status === 'cancelled') return 'cancelled';
  const started = hasStarted(booking.date, booking.startTime);
  if (booking.status === 'pending') return started ? 'expired' : 'awaiting payment';
  return started ? 'completed' : 'upcoming';
}

// Statuses that are still in the future and can be cancelled.
const OPEN_STATUSES = ['upcoming', 'awaiting payment'];

const STATUS_STYLES = {
  upcoming: 'text-success bg-success/10',
  'awaiting payment': 'text-warning bg-warning/10',
  expired: 'text-text-secondary bg-bg-tertiary',
  completed: 'text-text-secondary bg-bg-tertiary',
  cancelled: 'text-danger bg-danger/10',
};

function BookingRow({ booking, onCancel, cancelling }) {
  const status = getDisplayStatus(booking);
  const color = booking.court?.color || '#c8ff00';

  return (
    <li className="relative bg-bg-card border border-border p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
      <div className="absolute left-0 top-0 w-1 h-full" style={{ background: color }} aria-hidden="true" />

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-heading font-bold tracking-wide">{booking.court?.name ?? `Court ${booking.courtId}`}</p>
          <span className={`text-xs px-2 py-1 font-heading tracking-wider uppercase ${STATUS_STYLES[status]}`}>
            {status}
          </span>
        </div>
        <p className="mt-2 text-sm text-text-secondary">
          {formatShortDate(booking.date)} · {formatTimeRange(booking.startTime, booking.endTime)}
        </p>
        <p className="mt-1 text-xs text-text-muted tracking-wider">{booking.id}</p>
        {status === 'awaiting payment' && (
          <p className="mt-2 text-xs text-warning">
            Call {CONTACT_PHONE} to pay and confirm this slot. Quote booking ID {booking.id}. It isn't reserved until payment is confirmed.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 md:gap-4">
        <span className="font-heading text-xl font-bold mr-auto md:mr-2">₹{booking.price}</span>
        {status === 'awaiting payment' && (
          <a
            href={CONTACT_PHONE_HREF}
            className="inline-flex items-center gap-2 text-xs font-heading tracking-widest uppercase bg-accent text-on-accent px-4 py-2 hover:bg-accent-hover transition-colors"
            aria-label={`Call ${CONTACT_PHONE} to pay for booking ${booking.id}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Call to Pay
          </a>
        )}
        {OPEN_STATUSES.includes(status) && onCancel && (
          <button
            type="button"
            onClick={() => onCancel(booking)}
            disabled={cancelling}
            className="text-xs font-heading tracking-widest uppercase border border-border px-4 py-2 text-text-secondary hover:border-danger hover:text-danger transition-colors disabled:opacity-50"
          >
            {cancelling ? 'Cancelling…' : status === 'awaiting payment' ? 'Withdraw' : 'Cancel'}
          </button>
        )}
      </div>
    </li>
  );
}

export default function MyBookings() {
  const pageRef = useRef(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return api.getMyBookings()
      .then((data) => setBookings(data.bookings))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!pageRef.current) return;
    const anim = animatePageEnter(pageRef.current);
    return () => { if (anim) anim.pause(); };
  }, []);

  const handleCancel = async (booking) => {
    const confirmed = window.confirm(
      `${booking.status === 'pending' ? 'Withdraw your booking request' : 'Cancel your booking'} for ${booking.court?.name ?? 'this court'} on ${formatShortDate(booking.date)} at ${formatTimeRange(booking.startTime, booking.endTime)}?`,
    );
    if (!confirmed) return;

    setActionError(null);
    setCancellingId(booking.id);
    try {
      await api.cancelBooking(booking.id);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setCancellingId(null);
      // Refresh either way: a 409 means it was already cancelled.
      load();
    }
  };

  const upcoming = bookings.filter((b) => OPEN_STATUSES.includes(getDisplayStatus(b)))
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  const past = bookings.filter((b) => !OPEN_STATUSES.includes(getDisplayStatus(b)));

  return (
    <div ref={pageRef}>
      <section className="pt-36 pb-10 md:pt-44 md:pb-14" aria-label="My Bookings Header">
        <div className="container">
          <span className="section-label">Bookings</span>
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold mt-4">
            MY <span className="text-accent-ink">BOOKINGS</span>
          </h1>
        </div>
      </section>

      <section className="pb-24 md:pb-32" aria-label="Bookings">
        <div className="container space-y-12">
          {actionError && <InlineAlert>{actionError}</InlineAlert>}

          {loading && bookings.length === 0 ? (
            <LoadingState label="Loading bookings…" />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : (
            <>
              <div>
                <h2 className="font-heading text-xl font-bold tracking-wide mb-6">Upcoming</h2>
                {upcoming.length === 0 ? (
                  <EmptyState>
                    No upcoming bookings.{' '}
                    <Link to="/book" className="text-accent-ink hover:text-accent-dim transition-colors">Book a court →</Link>
                  </EmptyState>
                ) : (
                  <ul className="space-y-3">
                    {upcoming.map((booking) => (
                      <BookingRow
                        key={booking.id}
                        booking={booking}
                        onCancel={handleCancel}
                        cancelling={cancellingId === booking.id}
                      />
                    ))}
                  </ul>
                )}
              </div>

              {past.length > 0 && (
                <div>
                  <h2 className="font-heading text-xl font-bold tracking-wide mb-6">History</h2>
                  <ul className="space-y-3">
                    {past.map((booking) => (
                      <BookingRow key={booking.id} booking={booking} />
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
