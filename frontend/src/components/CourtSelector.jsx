import { animate } from 'animejs';
import { prefersReducedMotion } from '../animations/heroAnimations';

export default function CourtSelector({ courts, selectedCourt, onSelect }) {
  const handleSelect = (courtId, e) => {
    onSelect(courtId);
    if (!prefersReducedMotion()) {
      animate(e.currentTarget, {
        scale: [1, 1.03, 1],
        duration: 400,
        easing: 'outElastic(1, .5)',
      });
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {courts.map((court) => (
        <button
          key={court.id}
          onClick={(e) => handleSelect(court.id, e)}
          disabled={!court.available}
          className={`relative p-5 text-left transition-all duration-300 border font-heading ${
            !court.available
              ? 'bg-unavailable border-transparent cursor-not-allowed opacity-50'
              : selectedCourt === court.id
              ? 'bg-accent/10 border-accent-ink'
              : 'bg-bg-card border-border hover:border-text-muted'
          }`}
          aria-pressed={selectedCourt === court.id}
          aria-disabled={!court.available}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold tracking-wide">{court.name}</p>
              <p className="text-xs text-text-muted tracking-widest uppercase mt-1">
                {court.type}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">
                ₹{court.pricePerHour}
                <span className="text-xs text-text-muted font-normal">/hr</span>
              </p>
              {!court.available && (
                <p className="text-xs text-danger mt-1">Maintenance</p>
              )}
            </div>
          </div>

          {/* Selection indicator */}
          {selectedCourt === court.id && (
            <div
              className="absolute top-0 left-0 w-1 h-full bg-accent"
              aria-hidden="true"
            />
          )}
        </button>
      ))}
    </div>
  );
}
