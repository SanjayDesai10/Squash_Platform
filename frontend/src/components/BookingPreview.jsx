import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useScrollAnimation } from '../animations/cursorAnimations';
import { animateOnScroll, animateBookingSelection, prefersReducedMotion } from '../animations/heroAnimations';
import { generateDates, quickBookingSlots } from '../data/mockData';

export default function BookingPreview() {
  const dates = generateDates(5);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const sectionRef = useRef(null);

  useScrollAnimation(sectionRef, useCallback((el) => {
    animateOnScroll(el.querySelectorAll('.scroll-reveal'), { stagger: 80 });
  }, []));

  const handleDateSelect = (index) => {
    setSelectedDate(index);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (index, e) => {
    if (!quickBookingSlots[index].available) return;
    setSelectedSlot(index);
    if (!prefersReducedMotion()) {
      animateBookingSelection(e.currentTarget);
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative -mt-16 z-20 pb-20 md:pb-32"
      aria-label="Quick Booking"
    >
      <div className="container">
        <div className="bg-bg-secondary border border-border p-6 md:p-10 lg:p-12 max-w-4xl mx-auto">
          {/* Header */}
          <div className="scroll-reveal" style={{ opacity: 0 }}>
            <span className="section-label">Quick Book</span>
            <h2 className="font-heading text-2xl md:text-3xl font-bold mt-2">
              BOOK YOUR COURT
            </h2>
          </div>

          {/* Date Selector */}
          <div className="scroll-reveal mt-8" style={{ opacity: 0 }}>
            <p className="text-xs text-text-muted uppercase tracking-widest mb-4 font-heading">
              Select Date
            </p>
            <div className="flex flex-wrap gap-2">
              {dates.map((date, i) => (
                <button
                  key={date.id}
                  onClick={() => handleDateSelect(i)}
                  className={`px-4 py-2.5 text-sm font-heading tracking-wide transition-all duration-300 border ${
                    selectedDate === i
                      ? 'bg-accent text-bg-primary border-accent'
                      : 'bg-transparent text-text-secondary border-border hover:border-text-muted'
                  }`}
                  aria-pressed={selectedDate === i}
                >
                  {date.label}
                </button>
              ))}
            </div>
          </div>

          {/* Court Label */}
          <div className="scroll-reveal mt-8" style={{ opacity: 0 }}>
            <p className="text-xs text-text-muted uppercase tracking-widest mb-1 font-heading">
              Court
            </p>
            <p className="text-lg font-heading font-semibold">Court 01</p>
          </div>

          {/* Time Slots */}
          <div className="scroll-reveal mt-6" style={{ opacity: 0 }}>
            <p className="text-xs text-text-muted uppercase tracking-widest mb-4 font-heading">
              Available Times
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {quickBookingSlots.map((slot, i) => (
                <button
                  key={slot.time}
                  onClick={(e) => handleSlotSelect(i, e)}
                  disabled={!slot.available}
                  className={`py-3 px-2 text-sm font-heading tracking-wide transition-all duration-300 border ${
                    !slot.available
                      ? 'bg-unavailable text-unavailable-text border-transparent cursor-not-allowed'
                      : selectedSlot === i
                      ? 'bg-accent text-bg-primary border-accent'
                      : 'bg-transparent text-text-secondary border-border hover:border-accent hover:text-accent'
                  }`}
                  aria-label={`${slot.label}${!slot.available ? ' - Unavailable' : ''}`}
                  aria-disabled={!slot.available}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="scroll-reveal mt-8 flex justify-end" style={{ opacity: 0 }}>
            <Link
              to="/book"
              className={`magnetic-btn magnetic-btn-primary text-sm ${
                selectedSlot === null ? 'opacity-50 pointer-events-none' : ''
              }`}
              aria-disabled={selectedSlot === null}
            >
              Continue Booking →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
