import { useRef, useEffect } from 'react';
import { animate, utils } from 'animejs';
import { prefersReducedMotion } from '../animations/heroAnimations';

export default function TimeSlotGrid({ slots, selectedSlot, onSelect }) {
  const gridRef = useRef(null);

  // Group slots by period
  const grouped = slots.reduce((acc, slot) => {
    if (!acc[slot.period]) acc[slot.period] = [];
    acc[slot.period].push(slot);
    return acc;
  }, {});

  useEffect(() => {
    if (prefersReducedMotion() || !gridRef.current) return;
    animate(gridRef.current.querySelectorAll('.time-slot'), {
      translateY: [15, 0],
      opacity: [0, 1],
      duration: 400,
      delay: utils.stagger(40),
      easing: 'outCubic',
    });
  }, [slots]);

  const handleSelect = (slotTime, e) => {
    onSelect(slotTime);
    if (!prefersReducedMotion()) {
      animate(e.currentTarget, {
        scale: [1, 1.08, 1],
        duration: 400,
        easing: 'outElastic(1, .5)',
      });
    }
  };

  return (
    <div ref={gridRef} className="space-y-6">
      {Object.entries(grouped).map(([period, periodSlots]) => (
        <div key={period}>
          <p className="text-xs text-text-muted uppercase tracking-widest mb-3 font-heading">
            {period}
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {periodSlots.map((slot) => (
              <button
                key={slot.time}
                className={`time-slot py-3 px-3 text-sm font-heading tracking-wide transition-all duration-300 border ${
                  !slot.available
                    ? 'bg-unavailable text-unavailable-text border-transparent cursor-not-allowed line-through'
                    : selectedSlot === slot.time
                    ? 'bg-accent text-bg-primary border-accent'
                    : 'bg-transparent text-text-secondary border-border hover:border-accent hover:text-accent'
                }`}
                onClick={(e) => slot.available && handleSelect(slot.time, e)}
                disabled={!slot.available}
                aria-label={`${slot.label}${!slot.available ? ' — Unavailable' : ''}`}
                aria-pressed={selectedSlot === slot.time}
                style={{ opacity: 0 }}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
