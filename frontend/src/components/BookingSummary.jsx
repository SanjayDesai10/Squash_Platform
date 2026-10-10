import { formatTime } from '../lib/time';

export default function BookingSummary({ court, date, timeSlot, price }) {
  if (!court || !date || !timeSlot) return null;

  const endTime = `${String(parseInt(timeSlot, 10) + 1).padStart(2, '0')}:00`;

  return (
    <div className="bg-bg-secondary border border-border p-6 md:p-8">
      <h3 className="font-heading text-xs tracking-widest uppercase text-text-muted mb-6">
        Booking Summary
      </h3>

      <div className="space-y-4">
        <div className="flex justify-between items-center py-3 border-b border-border">
          <span className="text-sm text-text-secondary">Court</span>
          <span className="font-heading font-bold">{court.name}</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-border">
          <span className="text-sm text-text-secondary">Date</span>
          <span className="font-heading font-semibold">{date.fullLabel}</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-border">
          <span className="text-sm text-text-secondary">Time</span>
          <span className="font-heading font-semibold">
            {formatTime(timeSlot)} – {formatTime(endTime)}
          </span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-border">
          <span className="text-sm text-text-secondary">Type</span>
          <span className="font-heading font-semibold">{court.type}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6 pt-4">
        <span className="font-heading text-sm tracking-widest uppercase text-text-muted">Total</span>
        <span className="font-heading text-3xl font-bold text-accent-ink">₹{price}</span>
      </div>
    </div>
  );
}
