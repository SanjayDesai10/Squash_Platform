import { useRef, useEffect, useCallback, useState } from 'react';
import { animate, utils } from 'animejs';
import { prefersReducedMotion } from '../animations/heroAnimations';

function ArrowButton({ direction, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'left' ? 'Earlier dates' : 'Later dates'}
      className="hidden md:inline-flex shrink-0 w-10 mt-5 mb-2 items-center justify-center border border-border text-text-secondary hover:border-accent-ink hover:text-accent-ink transition-colors disabled:opacity-30 disabled:pointer-events-none"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
        <polyline points={direction === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
      </svg>
    </button>
  );
}

/**
 * Horizontally scrollable strip of bookable dates (30 days). Shows the
 * month above the first date and wherever a new month starts.
 */
export default function DateSelector({ dates, selectedDate, onSelect }) {
  const scrollerRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    updateEdges();
    window.addEventListener('resize', updateEdges);
    return () => window.removeEventListener('resize', updateEdges);
  }, [updateEdges]);

  // Entrance animation for the first visible tiles
  useEffect(() => {
    if (prefersReducedMotion() || !scrollerRef.current) return;
    animate(scrollerRef.current.querySelectorAll('.date-item'), {
      translateY: [20, 0],
      opacity: [0, 1],
      duration: 500,
      delay: utils.stagger(30, { start: 0 }),
      easing: 'outCubic',
    });
  }, []);

  // Keep the selected date in view (e.g. when preselected from a link)
  // (scrolls only the strip, never the page)
  useEffect(() => {
    const scroller = scrollerRef.current;
    const tile = scroller?.querySelector(`[data-index="${selectedDate}"]`)?.parentElement;
    if (!scroller || !tile) return;
    const left = tile.offsetLeft - scroller.offsetLeft;
    const right = left + tile.offsetWidth;
    if (left < scroller.scrollLeft) {
      scroller.scrollTo({ left, behavior: 'smooth' });
    } else if (right > scroller.scrollLeft + scroller.clientWidth) {
      scroller.scrollTo({ left: right - scroller.clientWidth, behavior: 'smooth' });
    }
  }, [selectedDate]);

  const scrollByPage = (direction) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  return (
    <div className="flex gap-2">
      <ArrowButton direction="left" onClick={() => scrollByPage(-1)} disabled={edges.start} />

      <div
        ref={scrollerRef}
        onScroll={updateEdges}
        className="flex-1 flex gap-2 md:gap-3 overflow-x-auto snap-x scroll-smooth pb-2 [scrollbar-width:thin]"
        role="listbox"
        aria-label="Booking date"
      >
        {dates.map((date, i) => {
          const showMonth = i === 0 || date.dayNumber === 1;
          const selected = selectedDate === i;
          return (
            <div key={date.id} className="shrink-0 snap-start flex flex-col">
              <span className={`h-5 text-[11px] font-heading tracking-widest uppercase ${showMonth ? 'text-text-muted' : 'invisible'}`}>
                {date.monthShort}
              </span>
              <button
                type="button"
                data-index={i}
                role="option"
                aria-selected={selected}
                aria-label={date.fullLabel}
                onClick={() => onSelect(i)}
                className={`date-item w-[4.25rem] md:w-[4.75rem] flex flex-col items-center py-3 md:py-4 transition-all duration-300 border font-heading ${
                  selected
                    ? 'bg-accent text-on-accent border-accent'
                    : 'bg-transparent text-text-secondary border-border hover:border-text-muted hover:text-text-primary'
                }`}
                style={prefersReducedMotion() ? undefined : { opacity: 0 }}
              >
                <span className="text-[11px] tracking-widest uppercase">
                  {i === 0 ? 'Today' : i === 1 ? 'Tmrw' : date.dayName}
                </span>
                <span className="text-xl font-bold mt-1">{date.dayNumber}</span>
              </button>
            </div>
          );
        })}
      </div>

      <ArrowButton direction="right" onClick={() => scrollByPage(1)} disabled={edges.end} />
    </div>
  );
}
