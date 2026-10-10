import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { animate, utils } from 'animejs';
import { ErrorState, LoadingState } from './StatusMessage';
import { useCourts } from '../hooks/useCourts';
import { PickleballShape } from './Pickleball';
import PickleballCourt from './PickleballCourt';
import { getCourtNumber } from '../lib/courts';
import { prefersReducedMotion } from '../animations/heroAnimations';
import { useScrollAnimation } from '../animations/cursorAnimations';

export default function CourtExplorer() {
  const { courts, loading, error, reload } = useCourts();
  const [activeCourtId, setActiveCourtId] = useState(null);
  const activeCourt = courts.find((c) => c.id === activeCourtId) ?? courts[0];
  const detailRef = useRef(null);
  const sectionRef = useRef(null);
  const gridRef = useRef(null);

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

  // Courts load asynchronously, so the grid reveals separately once it
  // is rendered (the callback changes when courts arrive).
  useScrollAnimation(gridRef, useCallback((el) => {
    if (prefersReducedMotion()) return;
    animate(el.querySelectorAll('.explorer-grid-reveal'), {
      translateY: [40, 0],
      opacity: [0, 1],
      duration: 700,
      delay: utils.stagger(100),
      easing: 'outCubic',
    });
    // courts.length is intentional: it re-arms the observer once the grid exists.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [courts.length]));

  const handleCourtSelect = (court) => {
    setActiveCourtId(court.id);

    if (prefersReducedMotion() || !detailRef.current) return;
    animate(detailRef.current, {
      opacity: [0, 1],
      translateX: [20, 0],
      duration: 400,
      easing: 'outCubic',
    });
  };

  const hiddenUntilAnimated = prefersReducedMotion() ? undefined : { opacity: 0 };

  return (
    <section ref={sectionRef} className="section-y" aria-label="Court Explorer">
      <div className="container">
        <div className="explorer-reveal" style={{ opacity: 0 }}>
          <span className="section-label">Explore</span>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold mt-2">
            SELECT YOUR COURT
          </h2>
        </div>

        {loading ? (
          <LoadingState label="Loading courts…" className="mt-12" />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} className="mt-12" />
        ) : !activeCourt ? (
          <LoadingState label="No courts available yet" className="mt-12" />
        ) : (
        <div ref={gridRef} className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Court tabs */}
          <div className="lg:col-span-4 space-y-2 explorer-grid-reveal" style={hiddenUntilAnimated}>
            {courts.map((court) => (
              <button
                key={court.id}
                onClick={() => handleCourtSelect(court)}
                className={`relative w-full text-left p-5 transition-all duration-300 border font-heading group ${
                  activeCourt.id === court.id
                    ? 'bg-bg-card border-accent-ink'
                    : 'bg-transparent border-border hover:border-text-muted'
                }`}
                aria-pressed={activeCourt.id === court.id}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-bold tracking-wide ${
                      activeCourt.id === court.id ? 'text-accent-ink' : 'text-text-primary'
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
            className="lg:col-span-8 bg-bg-card border border-border p-6 md:p-10 explorer-grid-reveal"
            style={hiddenUntilAnimated}
          >
            {/* Court visual */}
            <div
              className="relative h-64 md:h-80 mb-8 flex items-center justify-center overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${activeCourt.color}05, ${activeCourt.color}12)`,
              }}
            >
              {/* Large pickleball court diagram */}
              <svg
                viewBox="60 10 280 500"
                className="w-36 md:w-44 h-auto"
                aria-label={`${activeCourt.name} diagram`}
              >
                <PickleballCourt x={90.9} y={20} height={480} color={activeCourt.color} />
                {/* Ball */}
                <PickleballShape cx={250} cy={410} r={14} holes={26} />
              </svg>

              {/* Court number */}
              <div
                className="absolute top-4 right-6 font-heading text-8xl font-bold opacity-80"
                style={{ color: activeCourt.color }}
              >
                {getCourtNumber(activeCourt, courts.indexOf(activeCourt))}
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
                <span className="font-heading text-3xl font-bold text-accent-ink">
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

                {activeCourt.available && (
                  <Link
                    to={`/book?court=${activeCourt.id}`}
                    className="magnetic-btn magnetic-btn-primary mt-6 text-sm"
                  >
                    Book This Court
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </section>
  );
}
