import { useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import BookingPreview from '../components/BookingPreview';
import CourtCard from '../components/CourtCard';
import AnimatedCounter from '../components/AnimatedCounter';
import MagneticButton from '../components/MagneticButton';
import { courts, benefits, stats } from '../data/mockData';
import { animatePageEnter, animateOnScroll, prefersReducedMotion } from '../animations/heroAnimations';
import { useScrollAnimation } from '../animations/cursorAnimations';

export default function Home() {
  const pageRef = useRef(null);
  const courtsRef = useRef(null);
  const benefitsRef = useRef(null);
  const statsRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    if (!pageRef.current) return;
    const anim = animatePageEnter(pageRef.current);
    return () => { if (anim) anim.pause(); };
  }, []);

  // Courts section scroll animation
  useScrollAnimation(courtsRef, useCallback((el) => {
    animateOnScroll(el.querySelectorAll('.scroll-reveal'), { stagger: 120 });
  }, []));

  // Benefits section scroll animation
  useScrollAnimation(benefitsRef, useCallback((el) => {
    animateOnScroll(el.querySelectorAll('.scroll-reveal'), { stagger: 100 });
  }, []));

  // CTA section
  useScrollAnimation(ctaRef, useCallback((el) => {
    animateOnScroll(el.querySelectorAll('.scroll-reveal'), { stagger: 100 });
  }, []));

  return (
    <div ref={pageRef}>
      {/* Hero */}
      <Hero />

      {/* Quick Booking */}
      <BookingPreview />

      {/* Featured Courts */}
      <section ref={courtsRef} className="py-20 md:py-32 bg-bg-secondary" aria-label="Featured Courts">
        <div className="container">
          <div className="scroll-reveal" style={{ opacity: 0 }}>
            <span className="section-label">Courts</span>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold">
                FIND YOUR COURT
              </h2>
              <Link
                to="/courts"
                className="text-sm font-heading tracking-widest uppercase text-text-secondary hover:text-accent transition-colors"
              >
                View All →
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            {courts.slice(0, 4).map((court, i) => (
              <div key={court.id} className="scroll-reveal" style={{ opacity: 0 }}>
                <CourtCard court={court} index={i} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section ref={benefitsRef} className="py-20 md:py-32" aria-label="Benefits">
        <div className="container">
          <div className="scroll-reveal text-center mb-16" style={{ opacity: 0 }}>
            <span className="section-label">Why TBR</span>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold mt-2">
              BUILT FOR PLAYERS
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, i) => (
              <div
                key={benefit.title}
                className="scroll-reveal group text-center p-8 border border-border transition-all duration-500 hover:border-border-accent"
                style={{ opacity: 0 }}
              >
                <div className="text-3xl mb-4 text-accent opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                  {benefit.icon}
                </div>
                <h3 className="font-heading text-lg font-bold tracking-wide mb-3">
                  {benefit.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section ref={statsRef} className="py-20 md:py-32 bg-bg-secondary border-y border-border" aria-label="Statistics">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {stats.map((stat) => (
              <AnimatedCounter
                key={stat.label}
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix || ''}
                label={stat.label}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="py-24 md:py-40" aria-label="Call to action">
        <div className="container text-center">
          <div className="scroll-reveal" style={{ opacity: 0 }}>
            <span className="section-label">Ready?</span>
          </div>
          <h2 className="scroll-reveal font-heading text-4xl md:text-5xl lg:text-7xl font-bold mt-4" style={{ opacity: 0 }}>
            READY TO PLAY?
          </h2>
          <p className="scroll-reveal mt-6 text-lg text-text-secondary max-w-md mx-auto" style={{ opacity: 0 }}>
            Your next game is just a booking away.
          </p>
          <div className="scroll-reveal mt-10" style={{ opacity: 0 }}>
            <MagneticButton to="/book" variant="primary" className="text-base px-12 py-5">
              Book Your Court
            </MagneticButton>
          </div>
        </div>
      </section>
    </div>
  );
}
