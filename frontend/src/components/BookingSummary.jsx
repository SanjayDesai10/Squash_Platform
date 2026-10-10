export default function BookingSummary({ court, date, timeSlot, price }) {
  if (!court || !date || !timeSlot) return null;

  // Parse time for display
  const hour = parseInt(timeSlot.split(':')[0], 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour;
  const endHour = hour + 1 > 12 ? hour + 1 - 12 : hour + 1;
  const endPeriod = (hour + 1) >= 12 ? 'PM' : 'AM';

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
            {displayHour}:00 {period} – {endHour}:00 {endPeriod}
          </span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-border">
          <span className="text-sm text-text-secondary">Type</span>
          <span className="font-heading font-semibold">{court.type}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6 pt-4">
        <span className="font-heading text-sm tracking-widest uppercase text-text-muted">Total</span>
        <span className="font-heading text-3xl font-bold text-accent">₹{price}</span>
      </div>
    </div>
  );
}
