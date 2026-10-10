import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { animate, utils } from 'animejs';
import { courts } from '../data/mockData';
import { prefersReducedMotion } from '../animations/heroAnimations';
import { useScrollAnimation } from '../animations/cursorAnimations';

export default function CourtExplorer() {
  const [activeCourt, setActiveCourt] = useState(courts[0]);
  const detailRef = useRef(null);
  const sectionRef = useRef(null);

  useScrollAnimation(sectionRef, useCallback((el) => {
    if (prefersReducedMotion()) return;
    animate(el.querySelectorAll('.explorer-reveal'), {
      translateY: [40, 0],
      opacity: [0, 1],
      duration: 700,
      delay: utils.stagger(100),
      easing: 'outCubic',
    });
  }, []));

  const handleCourtSelect = (court) => {
    setActiveCourt(court);

    if (prefersReducedMotion() || !detailRef.current) return;
    animate(detailRef.current, {
      opacity: [0, 1],
      translateX: [20, 0],
      duration: 400,
      easing: 'outCubic',
    });
  };

  return (
    <section ref={sectionRef} className="py-20 md:py-32" aria-label="Court Explorer">
      <div className="container">
        <div className="explorer-reveal" style={{ opacity: 0 }}>
          <span className="section-label">Explore</span>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold mt-2">
            SELECT YOUR COURT
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Court tabs */}
          <div className="lg:col-span-4 space-y-2 explorer-reveal" style={{ opacity: 0 }}>
            {courts.map((court) => (
              <button
                key={court.id}
                onClick={() => handleCourtSelect(court)}
                className={`w-full text-left p-5 transition-all duration-300 border font-heading group ${
                  activeCourt.id === court.id
                    ? 'bg-bg-card border-accent'
                    : 'bg-transparent border-border hover:border-text-muted'
                }`}
                aria-pressed={activeCourt.id === court.id}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-bold tracking-wide ${
                      activeCourt.id === court.id ? 'text-accent' : 'text-text-primary'
                    }`}>
                      {court.name}
                    </p>
                    <p className="text-xs text-text-muted tracking-widest uppercase mt-1">
                      {court.type}
                    </p>
                  </div>
                  <span className="text-lg font-bold">
                    ₹{court.pricePerHour}
                    <span className="text-xs text-text-muted font-normal">/hr</span>
                  </span>
                </div>

                {/* Active indicator */}
                {activeCourt.id === court.id && (
                  <div className="absolute left-0 top-0 w-1 h-full bg-accent" />
                )}
              </button>
            ))}
          </div>

          {/* Court detail */}
          <div
            ref={detailRef}
            className="lg:col-span-8 bg-bg-card border border-border p-6 md:p-10 explorer-reveal"
            style={{ opacity: 0 }}
          >
            {/* Court visual */}
            <div
              className="relative h-64 md:h-80 mb-8 flex items-center justify-center overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${activeCourt.color}05, ${activeCourt.color}12)`,
              }}
            >
              {/* Large court diagram */}
              <svg
                viewBox="0 0 400 520"
                className="w-40 md:w-56 h-auto"
                aria-label={`${activeCourt.name} diagram`}
              >
                {/* Outer walls */}
                <rect
                  x="20" y="20" width="360" height="480"
                  fill="none" stroke={activeCourt.color} strokeWidth="2" opacity="0.6"
                />
                {/* Service line */}
                <line
                  x1="20" y1="260" x2="380" y2="260"
                  stroke={activeCourt.color} strokeWidth="1.5" opacity="0.4"
                />
                {/* Short line */}
                <line
                  x1="20" y1="350" x2="380" y2="350"
                  stroke={activeCourt.color} strokeWidth="1" opacity="0.3"
                />
                {/* Half court line */}
                <line
                  x1="200" y1="260" x2="200" y2="500"
                  stroke={activeCourt.color} strokeWidth="1" opacity="0.3"
                />
                {/* Service boxes */}
                <rect
                  x="80" y="260" width="120" height="90"
                  fill="none" stroke={activeCourt.color} strokeWidth="1" opacity="0.25"
                />
                <rect
                  x="200" y="260" width="120" height="90"
                  fill="none" stroke={activeCourt.color} strokeWidth="1" opacity="0.25"
                />
                {/* Tin line */}
                <line
                  x1="20" y1="480" x2="380" y2="480"
                  stroke={activeCourt.color} strokeWidth="3" opacity="0.5"
                />
                {/* Ball */}
                <circle
                  cx="200" cy="320" r="8"
                  fill={activeCourt.color} opacity="0.7"
                />
              </svg>

              {/* Court number */}
              <div
                className="absolute top-4 right-6 font-heading text-8xl font-bold opacity-[0.05]"
                style={{ color: activeCourt.color }}
              >
                {activeCourt.id.toString().padStart(2, '0')}
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex-1">
                <h3 className="font-heading text-2xl font-bold">{activeCourt.name}</h3>
                <p className="text-sm text-text-muted uppercase tracking-widest mt-1">
                  {activeCourt.type}
                </p>
                <p className="text-text-secondary mt-4 leading-relaxed">
                  {activeCourt.description}
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mt-6">
                  {activeCourt.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-3 py-1.5 text-xs font-heading tracking-wider uppercase border border-border text-text-secondary"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <span className="font-heading text-3xl font-bold text-accent">
                  ₹{activeCourt.pricePerHour}
                </span>
                <span className="text-text-muted text-sm">/hr</span>

                <div className="mt-4">
                  <span
                    className={`text-xs px-3 py-1.5 font-heading tracking-wider uppercase ${
                      activeCourt.available
                        ? 'text-success bg-success/10'
                        : 'text-danger bg-danger/10'
                    }`}
                  >
                    {activeCourt.available ? 'Available' : 'Maintenance'}
                  </span>
                </div>

                <Link
                  to="/book"
                  className="magnetic-btn magnetic-btn-primary mt-6 text-sm"
                >
                  Book This Court
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
