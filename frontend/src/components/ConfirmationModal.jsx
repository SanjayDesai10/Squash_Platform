import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createTimeline } from 'animejs';
import { prefersReducedMotion } from '../animations/heroAnimations';

export default function ConfirmationModal({ booking, onClose }) {
  const backdropRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const tl = createTimeline({ defaults: { easing: 'outCubic' } });

    tl.add(backdropRef.current, {
      opacity: [0, 1],
      duration: 300,
    }).add(modalRef.current, {
      scale: [0.9, 1],
      opacity: [0, 1],
      duration: 400,
    }, '-=200');

    return () => tl.pause();
  }, []);

  // Parse time for display
  const hour = parseInt(booking.timeSlot.split(':')[0], 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour;
  const endHour = hour + 1 > 12 ? hour + 1 - 12 : hour + 1;
  const endPeriod = (hour + 1) >= 12 ? 'PM' : 'AM';

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-primary/80 backdrop-blur-sm"
      style={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Booking Confirmation"
    >
      <div
        ref={modalRef}
        className="bg-bg-secondary border border-border p-8 md:p-12 max-w-md w-full text-center"
        style={{ opacity: 0 }}
      >
        {/* Success icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-accent"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">
          BOOKING CONFIRMED
        </h2>

        <div className="mt-8 space-y-3 text-left bg-bg-card p-6 border border-border">
          <div className="flex justify-between">
            <span className="text-sm text-text-secondary">Court</span>
            <span className="font-heading font-semibold">{booking.courtName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-text-secondary">Date</span>
            <span className="font-heading font-semibold">{booking.date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-text-secondary">Time</span>
            <span className="font-heading font-semibold">
              {displayHour}:00 {period} – {endHour}:00 {endPeriod}
            </span>
          </div>
          <div className="flex justify-between pt-3 border-t border-border">
            <span className="text-sm text-text-secondary">Amount</span>
            <span className="font-heading font-bold text-accent">₹{booking.price}</span>
          </div>
        </div>

        <div className="mt-6 py-3 bg-bg-card border border-border">
          <p className="text-xs text-text-muted uppercase tracking-widest">Booking ID</p>
          <p className="font-heading text-lg font-bold tracking-wider mt-1">{booking.id}</p>
        </div>

        <Link
          to="/"
          className="magnetic-btn magnetic-btn-primary w-full mt-8 justify-center"
          onClick={onClose}
        >
          Done
        </Link>
      </div>
    </div>
  );
}
