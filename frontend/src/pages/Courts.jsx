import { useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import CourtExplorer from '../components/CourtExplorer';
import CourtVisualization from '../components/CourtVisualization';
import MagneticButton from '../components/MagneticButton';
import { facilities } from '../data/siteContent';
import { animatePageEnter, animateOnScroll, prefersReducedMotion } from '../animations/heroAnimations';
import { useScrollAnimation } from '../animations/cursorAnimations';

export default function Courts() {
  const pageRef = useRef(null);
  const facilitiesRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!pageRef.current) return;
    const anim = animatePageEnter(pageRef.current);
    return () => { if (anim) anim.pause(); };
  }, []);

  useScrollAnimation(facilitiesRef, useCallback((el) => {
    animateOnScroll(el.querySelectorAll('.scroll-reveal'), { stagger: 80 });
  }, []));

  useScrollAnimation(ctaRef, useCallback((el) => {
    animateOnScroll(el.querySelectorAll('.scroll-reveal'), { stagger: 100 });
  }, []));

  return (
    <div ref={pageRef}>
      {/* Header */}
      <section className="pt-36 pb-10 md:pt-44 md:pb-14" aria-label="Courts Header">
        <div className="container">
          <span className="section-label">Courts</span>
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mt-4 max-w-4xl">
            YOUR COURT.
            <br />
            <span className="text-accent-ink">YOUR GAME.</span>
          </h1>
          <p className="mt-6 text-lg text-text-secondary max-w-xl leading-relaxed">
            Explore our premium courts and find the perfect space for your next match.
          </p>
        </div>
      </section>

      {/* Court Explorer */}
      <CourtExplorer />

      {/* Interactive Visualization */}
      <CourtVisualization />

      {/* Facilities */}
      <section ref={facilitiesRef} className="section-y" aria-label="Facilities">
        <div className="container">
          <div className="scroll-reveal text-center mb-16" style={{ opacity: 0 }}>
            <span className="section-label">Facilities</span>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold mt-2">
              EVERYTHING YOU NEED
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {facilities.map((facility, i) => (
              <div
                key={facility.title}
                className="scroll-reveal bg-bg-primary p-8 md:p-10 group hover:bg-bg-card transition-colors duration-500"
                style={{ opacity: 0 }}
              >
                <div className="text-2xl text-accent-ink opacity-50 group-hover:opacity-100 transition-opacity duration-500 mb-4">
                  {facility.icon}
                </div>
                <h3 className="font-heading text-lg font-bold tracking-wide mb-3">
                  {facility.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {facility.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking CTA */}
      <section ref={ctaRef} className="py-24 md:py-32 bg-bg-secondary border-t border-border" aria-label="Book Now">
        <div className="container text-center">
          <h2 className="scroll-reveal font-heading text-4xl md:text-5xl lg:text-7xl font-bold" style={{ opacity: 0 }}>
            FOUND YOUR COURT?
          </h2>
          <div className="scroll-reveal mt-10" style={{ opacity: 0 }}>
            <MagneticButton to="/book" variant="primary" className="text-base px-12 py-5">
              Book Now
            </MagneticButton>
          </div>
        </div>
      </section>
    </div>
  );
}
