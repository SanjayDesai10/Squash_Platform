import { useCallback, useRef } from 'react';
import { useScrollAnimation } from '../animations/cursorAnimations';
import { animateOnScroll, prefersReducedMotion } from '../animations/heroAnimations';

// ═══════════════════════════════════════════════════════════
// "More than a game" — bento grid pairing photos with the
// benefits of playing pickleball.
//
// Desktop (4 cols × 3 rows):     Tablet (2 cols):   Mobile: 1 col
//   [ A  A  B  D ]                 [ A  A ]
//   [ A  A  C  D ]                 [ B  C ]
//   [ E  E  F  G ]                 [ D  F ]  ...
// Fixed row heights reserve each tile's space, so lazy-loaded
// photos never shift the layout.
// ═══════════════════════════════════════════════════════════

const ICONS = {
  heart: (
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  ),
  bolt: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  sparkle: (
    <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
  ),
};

function Icon({ name, className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

/** Photo tile with a caption over a bottom gradient (readable in both themes). */
function PhotoTile({ src, alt, eyebrow, title, text, width, height, className = '' }) {
  return (
    <figure className={`group relative overflow-hidden bg-bg-tertiary ${className}`}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      {(title || eyebrow) && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" aria-hidden="true" />
          <figcaption className="absolute inset-x-0 bottom-0 p-5 md:p-6 text-white">
            {eyebrow && (
              <p className="text-[11px] font-heading tracking-[0.2em] uppercase text-[#c8ff00]">{eyebrow}</p>
            )}
            {title && <p className="mt-1 font-heading text-xl md:text-2xl font-bold leading-tight">{title}</p>}
            {text && <p className="mt-2 text-sm text-white/80 max-w-md leading-relaxed">{text}</p>}
          </figcaption>
        </>
      )}
    </figure>
  );
}

/** Text tile for a single benefit. `highlight` uses the brand fill. */
function BenefitTile({ icon, title, text, highlight = false, className = '' }) {
  return (
    <div
      className={`flex flex-col justify-between p-6 md:p-7 border transition-colors duration-300 ${
        highlight
          ? 'bg-accent text-on-accent border-accent'
          : 'bg-bg-card border-border hover:border-border-accent'
      } ${className}`}
    >
      <span
        className={`w-11 h-11 inline-flex items-center justify-center ${
          highlight ? 'bg-on-accent/10 text-on-accent' : 'bg-accent-subtle text-accent-ink'
        }`}
      >
        <Icon name={icon} />
      </span>
      <div className="mt-6">
        <h3 className="font-heading text-lg md:text-xl font-bold">{title}</h3>
        <p className={`mt-2 text-sm leading-relaxed ${highlight ? 'text-on-accent/75' : 'text-text-secondary'}`}>{text}</p>
      </div>
    </div>
  );
}

export default function PlayerBenefits() {
  const sectionRef = useRef(null);

  useScrollAnimation(sectionRef, useCallback((el) => {
    animateOnScroll(el.querySelectorAll('.scroll-reveal'), { stagger: 90 });
  }, []));

  const hidden = prefersReducedMotion() ? undefined : { opacity: 0 };

  return (
    <section ref={sectionRef} className="section-y bg-bg-secondary" aria-labelledby="player-benefits-title">
      <div className="container">
        {/* Header */}
        <div className="scroll-reveal flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-14" style={hidden}>
          <div>
            <span className="section-label">Why Pickleball</span>
            <h2 id="player-benefits-title" className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold mt-2">
              MORE THAN <span className="text-accent-ink">A GAME.</span>
            </h2>
          </div>
          <p className="text-text-secondary max-w-md leading-relaxed">
            The fastest-growing sport around is also one of the most rewarding. Come for the rallies, stay for the people.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-[220px] md:auto-rows-[230px] lg:auto-rows-[240px] gap-3 md:gap-4 grid-flow-dense">
          <div className="scroll-reveal md:col-span-2 row-span-2" style={hidden}>
            <PhotoTile
              src="/images/gallery/friends-at-the-net.avif"
              alt="Four friends meeting at the net, tapping paddles after a pickleball game"
              width={2070}
              height={1380}
              eyebrow="Social"
              title="Better with friends"
              text="Doubles is made for four. Rally, laugh and catch up — it's the most social hour of your week."
              className="h-full"
            />
          </div>

          <div className="scroll-reveal" style={hidden}>
            <BenefitTile
              icon="heart"
              title="Health first"
              text="A low-impact, full-body workout that strengthens muscles, joints and balance."
              highlight
              className="h-full"
            />
          </div>

          <div className="scroll-reveal row-span-2 lg:col-start-4 lg:row-start-1" style={hidden}>
            <PhotoTile
              src="/images/gallery/paddles-cheers.avif"
              alt="Two players raising their pickleball paddles together at sunset"
              width={987}
              height={1480}
              eyebrow="Good vibes"
              title="Play, unwind, repeat"
              text="Leave the day's stress on the court."
              className="h-full"
            />
          </div>

          <div className="scroll-reveal" style={hidden}>
            <BenefitTile
              icon="sparkle"
              title="Sharper reflexes"
              text="Quick exchanges at the kitchen line train hand-eye coordination and focus."
              className="h-full"
            />
          </div>

          <div className="scroll-reveal md:col-span-2" style={hidden}>
            <PhotoTile
              src="/images/gallery/aerial-doubles-match.avif"
              alt="Aerial view of four players in a doubles pickleball match"
              width={2113}
              height={1344}
              eyebrow="Endurance"
              title="Build stamina"
              text="Constant movement and fast rallies boost endurance and heart health."
              className="h-full"
            />
          </div>

          <div className="scroll-reveal" style={hidden}>
            <BenefitTile
              icon="bolt"
              title="Easy to pick up"
              text="Learn the basics in one session. Fun at every age and every skill level."
              className="h-full"
            />
          </div>

          <div className="scroll-reveal" style={hidden}>
            <PhotoTile
              src="/images/gallery/paddles-and-ball.avif"
              alt="Two pickleball paddles and a yellow ball lying on a court"
              width={2070}
              height={1380}
              eyebrow="Gear included"
              title="Just bring yourself"
              text="Paddles and balls available to rent."
              className="h-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
