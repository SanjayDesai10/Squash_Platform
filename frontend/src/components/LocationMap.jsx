import { useCallback, useRef } from 'react';
import { useScrollAnimation } from '../animations/cursorAnimations';
import { animateOnScroll, prefersReducedMotion } from '../animations/heroAnimations';
import SocialLinks from './SocialLinks';

const MAP_EMBED_URL =
  'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d502.0712982006693!2d76.93798618586447!3d15.153197817616165!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2sin!4v1791661308046!5m2!1sen!2sin';

// Same coordinates as the embed, opened in Google Maps for directions.
const DIRECTIONS_URL =
  'https://www.google.com/maps/dir/?api=1&destination=15.153197817616165,76.93798618586447';

const HOURS = [
  { days: 'Mon - Fri', time: '6:00 AM - 10:00 PM' },
  { days: 'Sat - Sun', time: '7:00 AM - 9:00 PM' },
];

export default function LocationMap() {
  const sectionRef = useRef(null);

  useScrollAnimation(sectionRef, useCallback((el) => {
    animateOnScroll(el.querySelectorAll('.scroll-reveal'), { stagger: 120 });
  }, []));

  const hidden = prefersReducedMotion() ? undefined : { opacity: 0 };

  return (
    <section ref={sectionRef} className="section-y" aria-label="Location">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-center">
          {/* Info */}
          <div className="lg:col-span-2 scroll-reveal" style={hidden}>
            <span className="section-label">Visit</span>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold mt-2">
              FIND <span className="text-accent-ink">US</span>
            </h2>
            <p className="mt-6 text-text-secondary leading-relaxed max-w-md">
              Drop by for a game or a look around. Book online before you come to make sure your court is ready.
            </p>

            <div className="mt-8 border-t border-border">
              {HOURS.map((row) => (
                <div key={row.days} className="flex justify-between gap-4 py-4 border-b border-border">
                  <span className="text-sm text-text-muted font-heading tracking-widest uppercase">{row.days}</span>
                  <span className="text-sm font-heading font-semibold">{row.time}</span>
                </div>
              ))}
            </div>

            <a
              href={DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="magnetic-btn magnetic-btn-primary mt-10 text-sm"
            >
              Get Directions →
            </a>

            <div className="mt-10">
              <p className="text-xs text-text-muted uppercase tracking-widest font-heading mb-4">
                Follow along for events &amp; updates
              </p>
              <SocialLinks variant="buttons" />
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-3 scroll-reveal" style={hidden}>
            <div className="relative aspect-[4/3] md:aspect-[16/10] border border-border overflow-hidden bg-bg-card group">
              <iframe
                src={MAP_EMBED_URL}
                title="Map showing The Ball Room's location"
                className="absolute inset-0 w-full h-full border-0 "
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
              {/* Accent frame on hover */}
              <div
                className="pointer-events-none absolute inset-0 border border-transparent group-hover:border-border-accent-ink transition-colors duration-500"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
