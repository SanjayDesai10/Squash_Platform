import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useScrollAnimation } from '../animations/cursorAnimations';
import { animateOnScroll, animateBookingSelection, prefersReducedMotion } from '../animations/heroAnimations';
import { useCourts } from '../hooks/useCourts';
import { api } from '../lib/api';
import { generateDates, toDisplaySlots } from '../lib/time';

// The widget shows the next few bookable hours; the full grid lives on /book.
const MAX_PREVIEW_SLOTS = 7;

export default function BookingPreview() {
  const dates = useMemo(() => generateDates(5), []);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsState, setSlotsState] = useState('idle'); // idle | loading | error | ready
  const sectionRef = useRef(null);

  const { courts, loading: courtsLoading, error: courtsError } = useCourts();
  const court = courts.find((c) => c.available);

  useScrollAnimation(sectionRef, useCallback((el) => {
    animateOnScroll(el.querySelectorAll('.scroll-reveal'), { stagger: 80 });
  }, []));

  useEffect(() => {
    if (!court) return;

    let cancelled = false;
    setSlotsState('loading');

    api.getAvailability(court.id, dates[selectedDate].value)
      .then((data) => {
        if (cancelled) return;
        // Skip slots that have already passed; keep booked ones so the
        // preview still reflects how busy the day is.
        const upcoming = toDisplaySlots(data.slots).filter((s) => s.status !== 'past');
        setSlots(upcoming.slice(0, MAX_PREVIEW_SLOTS));
        setSlotsState('ready');
      })
      .catch(() => { if (!cancelled) setSlotsState('error'); });

    return () => { cancelled = true; };
  }, [court, dates, selectedDate]);

  const handleDateSelect = (index) => {
    setSelectedDate(index);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (index, e) => {
    if (!slots[index].available) return;
    setSelectedSlot(index);
    if (!prefersReducedMotion()) {
      animateBookingSelection(e.currentTarget);
    }
  };

  const bookingLink = court && selectedSlot !== null && slots[selectedSlot]
    ? `/book?${new URLSearchParams({
      court: String(court.id),
      date: dates[selectedDate].value,
      time: slots[selectedSlot].time,
    })}`
    : '/book';

  const renderSlots = () => {
    if (courtsLoading || slotsState === 'loading' || slotsState === 'idle') {
      if (!courtsLoading && !court && !courtsError) {
        return <p className="text-sm text-text-muted">No courts are open for booking right now.</p>;
      }
      if (courtsError) {
        return <p className="text-sm text-danger">Couldn't load courts. Please try again later.</p>;
      }
      return <p className="text-sm text-text-muted font-heading tracking-widest uppercase animate-pulse">Loading times…</p>;
    }
    if (slotsState === 'error') {
      return <p className="text-sm text-danger">Couldn't load available times.</p>;
    }
    if (slots.length === 0) {
      return <p className="text-sm text-text-muted">No more times today - try another date.</p>;
    }

    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {slots.map((slot, i) => (
          <button
            key={slot.time}
            onClick={(e) => handleSlotSelect(i, e)}
            disabled={!slot.available}
            className={`py-3 px-2 text-sm font-heading tracking-wide transition-all duration-300 border ${
              !slot.available
                ? 'bg-unavailable text-unavailable-text border-transparent cursor-not-allowed'
                : selectedSlot === i
                ? 'bg-accent text-on-accent border-accent-ink'
                : 'bg-transparent text-text-secondary border-border hover:border-accent-ink hover:text-accent-ink'
            }`}
            aria-label={`${slot.label}${!slot.available ? ' - Booked' : ''}`}
            aria-disabled={!slot.available}
          >
            {slot.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <section
      ref={sectionRef}
      className="relative -mt-16 z-20"
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
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {dates.map((date, i) => (
                <button
                  key={date.id}
                  onClick={() => handleDateSelect(i)}
                  className={`px-3 py-2.5 text-sm font-heading tracking-wide transition-all duration-300 border ${
                    selectedDate === i
                      ? 'bg-accent text-on-accent border-accent-ink'
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
            <p className="text-lg font-heading font-semibold">{court ? court.name : '-'}</p>
          </div>

          {/* Time Slots */}
          <div className="scroll-reveal mt-6" style={{ opacity: 0 }}>
            <p className="text-xs text-text-muted uppercase tracking-widest mb-4 font-heading">
              Available Times
            </p>
            {renderSlots()}
          </div>

          {/* CTA */}
          <div className="scroll-reveal mt-8 flex justify-end" style={{ opacity: 0 }}>
            <Link
              to={bookingLink}
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
