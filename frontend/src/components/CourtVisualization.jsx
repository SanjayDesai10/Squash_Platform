import { useRef, useEffect, useState, useCallback } from 'react';
import { animate, utils } from 'animejs';
import { PickleballShape } from './Pickleball';
import PickleballCourt from './PickleballCourt';
import { getCourtGeometry } from '../lib/courtGeometry';
import { prefersReducedMotion } from '../animations/heroAnimations';
import { useScrollAnimation } from '../animations/cursorAnimations';

const { stagger } = utils;

// Court fills the 500×600 viewBox: 500 tall (y 50–550), centred horizontally.
const COURT = getCourtGeometry(250 - (500 * 20 / 44) / 2, 50, 500);

// Ball rally across the net, as offsets from its resting point
// (serve position, bottom-left service court).
const BALL_HOME = { x: 205, y: 480 };
const RALLY = [
  { x: 205, y: 480 }, // serve
  { x: 300, y: 130 }, // deep cross-court
  { x: 220, y: 235 }, // dink into the kitchen
  { x: 285, y: 370 }, // return
  { x: 205, y: 480 },
];

export default function CourtVisualization() {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const ballRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Animate court lines on scroll
  useScrollAnimation(containerRef, useCallback(() => {
    if (hasAnimated || !svgRef.current) return;
    setHasAnimated(true);

    if (prefersReducedMotion()) return;

    const lines = svgRef.current.querySelectorAll('.viz-line');

    animate(lines, {
      opacity: [0, 1],
      duration: 1500,
      delay: stagger(100),
      easing: 'inOutQuad',
    });

    // Animate ball
    animate(ballRef.current, {
      opacity: [0, 1],
      scale: [0, 1],
      duration: 600,
      delay: 1200,
      easing: 'outBack',
    });

    // Ball rally loop
    animate(ballRef.current, {
      translateX: RALLY.map((p) => p.x - BALL_HOME.x),
      translateY: RALLY.map((p) => p.y - BALL_HOME.y),
      duration: 8000,
      easing: 'inOutSine',
      loop: true,
      delay: 2000,
    });
  }, [hasAnimated]), { threshold: 0.3 });

  // Cursor interaction
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) return;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;

      const lines = svgRef.current?.querySelectorAll('.viz-line');
      if (lines) {
        lines.forEach((line, i) => {
          const factor = (i % 3 + 1) * 0.3;
          line.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
        });
      }
    };

    container.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section ref={containerRef} className="section-y bg-bg-secondary" aria-label="Court Visualization">
      <div className="container">
        <div className="text-center mb-12">
          <span className="section-label">Interactive</span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold mt-2">COURT LAYOUT</h2>
          <p className="text-text-secondary mt-4 max-w-lg mx-auto">
            A regulation 20 × 44 ft pickleball court. Move your cursor to interact.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="relative aspect-[5/6] border border-border bg-bg-primary/50">
            <svg
              ref={svgRef}
              viewBox="0 0 500 600"
              className="w-full h-full text-accent-ink"
              aria-label="Court layout diagram"
            >
              {/* Floor gradient */}
              <defs>
                <linearGradient id="floorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#c8ff00" stopOpacity="0.03" />
                  <stop offset="100%" stopColor="#c8ff00" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              <rect x={COURT.x} y={COURT.y} width={COURT.width} height={COURT.height} fill="url(#floorGrad)" />

              <PickleballCourt
                x={COURT.x}
                y={COURT.y}
                height={COURT.height}
                lineProps={{ className: 'viz-line', style: { opacity: 0, transition: 'transform 0.3s ease' } }}
              />

              {/* Ball */}
              <PickleballShape
                ref={ballRef}
                cx={BALL_HOME.x}
                cy={BALL_HOME.y}
                r={13}
                holes={26}
                style={{ opacity: 0, transformBox: 'fill-box', transformOrigin: 'center' }}
              />

              {/* Labels */}
              <text x="250" y="35" textAnchor="middle" fill="#666" fontSize="10" fontFamily="Space Grotesk">
                BASELINE
              </text>
              <text x="250" y="575" textAnchor="middle" fill="#666" fontSize="10" fontFamily="Space Grotesk">
                BASELINE
              </text>
              <text x={COURT.right + 22} y={COURT.netY + 3} textAnchor="start" fill="#666" fontSize="10" fontFamily="Space Grotesk">
                NET
              </text>
              <text x={COURT.right + 22} y={(COURT.netY + COURT.kitchenBottom) / 2 + 3} textAnchor="start" fill="#666" fontSize="10" fontFamily="Space Grotesk">
                KITCHEN
              </text>
              <text x={COURT.right + 22} y={(COURT.kitchenBottom + COURT.bottom) / 2 + 3} textAnchor="start" fill="#666" fontSize="10" fontFamily="Space Grotesk">
                SERVICE COURT
              </text>
              <text x={COURT.x - 32} y={(COURT.y + COURT.kitchenTop) / 2} textAnchor="middle" fill="#666" fontSize="10" fontFamily="Space Grotesk" transform={`rotate(-90, ${COURT.x - 32}, ${(COURT.y + COURT.kitchenTop) / 2})`}>
                SIDELINE
              </text>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
