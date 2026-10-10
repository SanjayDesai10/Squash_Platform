import { useRef, useEffect } from 'react';
import { animateHero } from '../animations/heroAnimations';
import { useCursorParallax, usePickleballCursor } from '../animations/cursorAnimations';
import Pickleball from './Pickleball';
import MagneticButton from './MagneticButton';

export default function Hero() {
  const containerRef = useRef(null);
  const ballRef = useRef(null);

  useCursorParallax(containerRef);
  usePickleballCursor(ballRef, containerRef);

  useEffect(() => {
    if (!containerRef.current) return;
    const tl = animateHero(containerRef.current);
    return () => {
      if (tl) tl.pause();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center overflow-hidden bg-bg-primary"
      aria-label="Hero"
    >
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]" data-parallax-speed="0.2">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              'linear-gradient(var(--color-border-accent) 1px, transparent 1px), linear-gradient(90deg, var(--color-border-accent) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      {/* Abstract court lines - decorative SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Horizontal lines */}
        <line
          className="hero-decoration court-line"
          x1="100" y1="200" x2="700" y2="200"
          strokeDasharray="1000"
          data-parallax-speed="0.3"
        />
        <line
          className="hero-decoration court-line"
          x1="200" y1="450" x2="900" y2="450"
          strokeDasharray="1000"
          data-parallax-speed="0.5"
        />
        <line
          className="hero-decoration court-line"
          x1="600" y1="700" x2="1300" y2="700"
          strokeDasharray="1000"
          data-parallax-speed="0.4"
        />
        {/* Vertical lines */}
        <line
          className="hero-decoration court-line"
          x1="400" y1="100" x2="400" y2="600"
          strokeDasharray="1000"
          data-parallax-speed="0.6"
        />
        <line
          className="hero-decoration court-line"
          x1="1000" y1="250" x2="1000" y2="800"
          strokeDasharray="1000"
          data-parallax-speed="0.3"
        />
        {/* Court rectangle */}
        <rect
          className="hero-decoration court-line"
          x="300" y="300" width="400" height="300"
          strokeDasharray="1400"
          rx="0"
          data-parallax-speed="0.4"
        />
        {/* T-line */}
        <line
          className="hero-decoration court-line"
          x1="500" y1="300" x2="500" y2="600"
          strokeDasharray="300"
          data-parallax-speed="0.5"
        />
        <line
          className="hero-decoration court-line"
          x1="300" y1="450" x2="700" y2="450"
          strokeDasharray="400"
          data-parallax-speed="0.5"
        />
      </svg>

      {/* Pickleball - interactive cursor element */}
      <div
        ref={ballRef}
        className="hero-visual absolute right-[10%] top-1/2 -translate-y-1/2 hidden lg:block"
        data-parallax-speed="1.2"
        aria-hidden="true"
      >
        <div className="relative">
          {/* Glow */}
          <div
            className="absolute inset-0 rounded-full blur-3xl"
            style={{
              background: 'radial-gradient(circle, var(--color-accent-glow) 0%, transparent 70%)',
              width: '400px',
              height: '400px',
              transform: 'translate(-50%, -50%)',
              top: '50%',
              left: '50%',
            }}
          />
          {/* Pickleball */}
          <Pickleball
            size={192}
            className="relative"
            style={{ filter: 'drop-shadow(0 0 40px rgba(200,255,0,0.25)) drop-shadow(0 20px 30px rgba(0,0,0,0.45))' }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="container relative z-10 pt-20">
        <div className="max-w-3xl">
          {/* Label */}
          <div className="hero-line section-label">The Ball Room - Pickleball & Chill</div>

          {/* Headline */}
          <h1 className="mt-6">
            <span className="hero-line block text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight" style={{ opacity: 0 }}>
              PLAY.
            </span>
            <span className="hero-line block text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-accent-ink mt-2" style={{ opacity: 0 }}>
              COMPETE.
            </span>
            <span className="hero-line block text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mt-2" style={{ opacity: 0 }}>
              REPEAT.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle mt-8 text-lg md:text-xl text-text-secondary max-w-xl leading-relaxed" style={{ opacity: 0 }}>
            Premium courts. Seamless booking. Built for players who take the game seriously.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 mt-10">
            <div className="hero-cta" style={{ opacity: 0 }}>
              <MagneticButton to="/book" variant="primary">
                Book a Court
              </MagneticButton>
            </div>
            <div className="hero-cta" style={{ opacity: 0 }}>
              <MagneticButton to="/courts" variant="secondary">
                Explore Courts
              </MagneticButton>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-primary to-transparent" />
    </section>
  );
}
