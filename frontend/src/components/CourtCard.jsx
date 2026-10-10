import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { animate } from 'animejs';
import { prefersReducedMotion } from '../animations/heroAnimations';

export default function CourtCard({ court, index = 0 }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (prefersReducedMotion()) return;
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;

    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;

    animate(card, {
      rotateX: 0,
      rotateY: 0,
      duration: 600,
      easing: 'outElastic(1, .5)',
    });

    card.style.transform = '';
  };

  return (
    <div
      ref={cardRef}
      className="group relative bg-bg-card border border-border p-6 md:p-8 transition-colors duration-500 hover:bg-bg-card-hover hover:border-border-accent"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ willChange: 'transform' }}
    >
      {/* Court visual */}
      <div
        className="relative h-48 md:h-56 mb-6 overflow-hidden flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${court.color}08, ${court.color}15)` }}
      >
        {/* Stylized court diagram */}
        <svg viewBox="0 0 200 260" className="w-24 h-32 opacity-30 group-hover:opacity-60 transition-opacity duration-500">
          <rect x="10" y="10" width="180" height="240" fill="none" stroke={court.color} strokeWidth="1.5" />
          <line x1="10" y1="130" x2="190" y2="130" stroke={court.color} strokeWidth="1" />
          <rect x="50" y="70" width="100" height="120" fill="none" stroke={court.color} strokeWidth="1" opacity="0.5" />
          <line x1="100" y1="70" x2="100" y2="190" stroke={court.color} strokeWidth="0.5" opacity="0.3" />
          <circle cx="100" cy="130" r="4" fill={court.color} opacity="0.6" />
        </svg>

        {/* Court number watermark */}
        <div
          className="absolute bottom-2 right-4 font-heading text-7xl font-bold opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-500"
          style={{ color: court.color }}
        >
          {court.id.toString().padStart(2, '0')}
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-heading text-lg font-bold tracking-wide">{court.name}</h3>
          <p className="text-xs text-text-muted uppercase tracking-widest mt-1">{court.type}</p>
        </div>
        <span
          className={`text-xs px-2 py-1 font-heading tracking-wider uppercase ${
            court.available
              ? 'text-success bg-success/10'
              : 'text-danger bg-danger/10'
          }`}
        >
          {court.available ? 'Available' : 'Maintenance'}
        </span>
      </div>

      <p className="text-sm text-text-secondary leading-relaxed mb-6">
        {court.description}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <span className="font-heading text-xl font-bold">
          ₹{court.pricePerHour}
          <span className="text-sm text-text-muted font-normal">/hr</span>
        </span>
        <Link
          to="/book"
          className="text-sm font-heading tracking-wider uppercase text-accent hover:text-accent-dim transition-colors duration-300"
        >
          Book →
        </Link>
      </div>
    </div>
  );
}
