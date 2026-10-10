import { useRef, useEffect } from 'react';
import ModalPortal from './ModalPortal';
import { Link } from 'react-router-dom';
import { createTimeline } from 'animejs';
import { prefersReducedMotion } from '../animations/heroAnimations';
import { formatTimeRange } from '../lib/time';

import { CONTACT_PHONE, CONTACT_PHONE_HREF } from '../lib/contact';

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

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const hiddenUntilAnimated = prefersReducedMotion() ? undefined : { opacity: 0 };

  return (
    <ModalPortal>
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[60] flex overflow-y-auto p-4 sm:p-8 bg-bg-primary/80 backdrop-blur-sm"
      style={hiddenUntilAnimated}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Complete your booking"
    >
      <div
        ref={modalRef}
        className="m-auto bg-bg-secondary border border-border p-8 md:p-12 max-w-md w-full text-center"
        style={hiddenUntilAnimated}
      >
        {/* Phone icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent-ink"
            aria-hidden="true"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </div>

        <p className="text-xs text-accent-ink uppercase tracking-widest font-heading mb-3">Request received</p>
        <h2 className="font-heading text-xl md:text-2xl font-bold tracking-tight leading-snug">
          To confirm your slot, please call{' '}
          <a href={CONTACT_PHONE_HREF} className="text-accent-ink whitespace-nowrap hover:text-accent-dim transition-colors">
            {CONTACT_PHONE}
          </a>{' '}
          and complete the payment.
        </h2>
        <p className="mt-3 text-sm text-text-secondary">
          Online payments are coming soon - our payment gateway is currently being set up.
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          The slot is not reserved until your payment is confirmed. Please keep your booking ID handy when you call.
        </p>

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
              {formatTimeRange(booking.startTime, booking.endTime)}
            </span>
          </div>
          <div className="flex justify-between pt-3 border-t border-border">
            <span className="text-sm text-text-secondary">Amount</span>
            <span className="font-heading font-bold text-accent-ink">₹{booking.price}</span>
          </div>
        </div>

        <div className="mt-6 py-3 bg-bg-card border border-border">
          <p className="text-xs text-text-muted uppercase tracking-widest">Booking ID</p>
          <p className="font-heading text-lg font-bold tracking-wider mt-1">{booking.id}</p>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            to="/bookings"
            className="magnetic-btn magnetic-btn-primary w-full justify-center"
            onClick={onClose}
          >
            View My Bookings
          </Link>
          <button
            type="button"
            className="magnetic-btn magnetic-btn-secondary w-full justify-center"
            onClick={onClose}
          >
            Book Another
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
