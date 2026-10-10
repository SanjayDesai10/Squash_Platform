import { useRef, useEffect } from 'react';
import { animate, utils } from 'animejs';
import { prefersReducedMotion } from '../animations/heroAnimations';

export default function DateSelector({ dates, selectedDate, onSelect }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion() || !containerRef.current) return;
    animate(containerRef.current.querySelectorAll('.date-item'), {
      translateY: [20, 0],
      opacity: [0, 1],
      duration: 500,
      delay: utils.stagger(60),
      easing: 'outCubic',
    });
  }, []);

  return (
    <div ref={containerRef} className="flex flex-wrap gap-2 md:gap-3">
      {dates.map((date, i) => (
        <button
          key={date.id}
          className={`date-item flex flex-col items-center px-4 py-3 md:px-6 md:py-4 transition-all duration-300 border font-heading ${
            selectedDate === i
              ? 'bg-accent text-bg-primary border-accent'
              : 'bg-transparent text-text-secondary border-border hover:border-text-muted hover:text-text-primary'
          }`}
          onClick={() => onSelect(i)}
          aria-pressed={selectedDate === i}
          style={{ opacity: 0 }}
        >
          <span className="text-xs tracking-widest uppercase">
            {i === 0 ? 'Today' : i === 1 ? 'Tmrw' : date.dayName}
          </span>
          <span className="text-xl font-bold mt-1">{date.dayNumber}</span>
        </button>
      ))}
    </div>
  );
}
