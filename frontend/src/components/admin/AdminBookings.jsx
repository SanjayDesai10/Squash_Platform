import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { formatTimeRange, getIndiaToday, hasStarted } from '../../lib/time';
import { EmptyState, ErrorState, InlineAlert, LoadingState } from '../StatusMessage';
import { ActionButton, Badge, DateNav, StatCard, Table, Td } from './ui';

function getStatus(booking) {
  const started = hasStarted(booking.date, booking.startTime);
  if (booking.status === 'cancelled') return { key: 'cancelled', label: 'Cancelled', tone: 'red' };
  if (booking.status === 'pending') {
    return started
      ? { key: 'expired', label: 'Expired', tone: 'grey' }
      : { key: 'pending', label: 'Awaiting payment', tone: 'amber' };
  }
  if (started) return { key: 'completed', label: 'Completed', tone: 'grey' };
  return { key: 'upcoming', label: 'Confirmed', tone: 'green' };
}

export default function AdminBookings() {
  const [date, setDate] = useState(getIndiaToday);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [busy, setBusy] = useState(null); // `${action}:${bookingId}`
  const [notice, setNotice] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return api.admin.getBookings(date)
      .then((data) => setBookings(data.bookings))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const runAction = async (action, booking) => {
    const who = booking.user?.name ?? 'this player';
    const slotLabel = `${booking.court?.name ?? 'this court'} at ${formatTimeRange(booking.startTime, booking.endTime)}`;
    const prompts = {
      cancel: `Cancel ${who}'s booking on ${slotLabel}?`,
      reject: `Reject ${who}'s request for ${slotLabel}?`,
    };
    if (prompts[action] && !window.confirm(prompts[action])) return;

    setActionError(null);
    setNotice(null);
    setBusy(`${action}:${booking.id}`);
    try {
      if (action === 'confirm') {
        const result = await api.admin.confirmBooking(booking.id);
        const others = result.rejectedRequests?.length ?? 0;
        setNotice(`Booking ${booking.id} confirmed.${others ? ` ${others} other request${others === 1 ? ' was' : 's were'} rejected.` : ''}`);
      } else {
        await api.admin.cancelBooking(booking.id);
        setNotice(action === 'reject' ? `Request ${booking.id} rejected.` : `Booking ${booking.id} cancelled.`);
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(null);
      load();
    }
  };

  const confirmed = bookings.filter((b) => b.status === 'confirmed');
  const pendingCount = bookings.filter((b) => getStatus(b).key === 'pending').length;
  const revenue = confirmed.reduce((sum, b) => sum + b.price, 0);

  return (
    <div className="space-y-6">
      <DateNav date={date} onChange={setDate} />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Awaiting payment" value={pendingCount} />
        <StatCard label="Confirmed" value={confirmed.length} />
        <StatCard label="Cancelled" value={bookings.filter((b) => b.status === 'cancelled').length} />
        <StatCard label="Revenue" value={`₹${revenue.toLocaleString('en-IN')}`} />
      </div>

      {notice && <InlineAlert tone="success">{notice}</InlineAlert>}
      {actionError && <InlineAlert>{actionError}</InlineAlert>}

      {loading && bookings.length === 0 ? (
        <LoadingState label="Loading bookings…" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : bookings.length === 0 ? (
        <EmptyState>No bookings on this day.</EmptyState>
      ) : (
        <Table headers={['Time', 'Court', 'Player', 'Booking ID', 'Price', 'Status', '']}>
          {bookings.map((booking) => {
            const status = getStatus(booking);
            return (
              <tr key={booking.id} className={booking.status === 'cancelled' ? 'opacity-60' : ''}>
                <Td className="whitespace-nowrap font-heading font-semibold">
                  {formatTimeRange(booking.startTime, booking.endTime)}
                </Td>
                <Td className="whitespace-nowrap">
                  <span className="inline-block w-2 h-2 mr-2 align-middle" style={{ background: booking.court?.color }} aria-hidden="true" />
                  {booking.court?.name ?? `Court ${booking.courtId}`}
                </Td>
                <Td>
                  <p>{booking.user?.name ?? '-'}</p>
                  {booking.user?.email && <p className="text-xs text-text-muted">{booking.user.email}</p>}
                </Td>
                <Td className="whitespace-nowrap text-xs text-text-muted tracking-wider">{booking.id}</Td>
                <Td className="whitespace-nowrap font-heading">₹{booking.price}</Td>
                <Td><Badge tone={status.tone}>{status.label}</Badge></Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-2">
                    {status.key === 'pending' && (
                      <>
                        <ActionButton onClick={() => runAction('confirm', booking)} disabled={busy !== null}>
                          {busy === `confirm:${booking.id}` ? 'Confirming…' : 'Confirm (paid)'}
                        </ActionButton>
                        <ActionButton tone="danger" onClick={() => runAction('reject', booking)} disabled={busy !== null}>
                          {busy === `reject:${booking.id}` ? 'Rejecting…' : 'Reject'}
                        </ActionButton>
                      </>
                    )}
                    {status.key === 'upcoming' && (
                      <ActionButton tone="danger" onClick={() => runAction('cancel', booking)} disabled={busy !== null}>
                        {busy === `cancel:${booking.id}` ? 'Cancelling…' : 'Cancel'}
                      </ActionButton>
                    )}
                  </div>
                </Td>
              </tr>
            );
          })}
        </Table>
      )}
    </div>
  );
}
