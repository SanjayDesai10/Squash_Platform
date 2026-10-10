import { useRef, useEffect, useState, useCallback } from 'react';
import { animate, utils } from 'animejs';
import { prefersReducedMotion } from '../animations/heroAnimations';
import { useScrollAnimation } from '../animations/cursorAnimations';

const { stagger } = utils;

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

    // Ball movement loop
    animate(ballRef.current, {
      cx: [250, 350, 250, 150, 250],
      cy: [300, 200, 100, 200, 300],
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
    <section ref={containerRef} className="py-20 md:py-32 bg-bg-secondary" aria-label="Court Visualization">
      <div className="container">
        <div className="text-center mb-12">
          <span className="section-label">Interactive</span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold mt-2">COURT LAYOUT</h2>
          <p className="text-text-secondary mt-4 max-w-lg mx-auto">
            A stylized representation of our professional courts. Move your cursor to interact.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="relative aspect-[5/6] border border-border bg-bg-primary/50">
            <svg
              ref={svgRef}
              viewBox="0 0 500 600"
              className="w-full h-full"
              aria-label="Court layout diagram"
            >
              {/* Floor gradient */}
              <defs>
                <linearGradient id="floorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#c8ff00" stopOpacity="0.03" />
                  <stop offset="100%" stopColor="#c8ff00" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              <rect x="50" y="50" width="400" height="500" fill="url(#floorGrad)" />

              {/* Outer walls */}
              <rect
                className="viz-line"
                x="50" y="50" width="400" height="500"
                fill="none" stroke="#c8ff00" strokeWidth="2"
                style={{ opacity: 0, transition: 'transform 0.3s ease' }}
              />

              {/* Front wall (bottom) */}
              <line
                className="viz-line"
                x1="50" y1="550" x2="450" y2="550"
                stroke="#c8ff00" strokeWidth="3"
                style={{ opacity: 0, transition: 'transform 0.3s ease' }}
              />

              {/* Service line */}
              <line
                className="viz-line"
                x1="50" y1="280" x2="450" y2="280"
                stroke="#c8ff00" strokeWidth="1.5"
                style={{ opacity: 0, transition: 'transform 0.3s ease' }}
              />

              {/* Short line */}
              <line
                className="viz-line"
                x1="50" y1="380" x2="450" y2="380"
                stroke="#c8ff00" strokeWidth="1"
                style={{ opacity: 0, transition: 'transform 0.3s ease' }}
              />

              {/* Half-court line */}
              <line
                className="viz-line"
                x1="250" y1="280" x2="250" y2="550"
                stroke="#c8ff00" strokeWidth="1"
                style={{ opacity: 0, transition: 'transform 0.3s ease' }}
              />

              {/* Left service box */}
              <rect
                className="viz-line"
                x="50" y="280" width="200" height="100"
                fill="none" stroke="#c8ff00" strokeWidth="0.8"
                style={{ opacity: 0, transition: 'transform 0.3s ease' }}
              />

              {/* Right service box */}
              <rect
                className="viz-line"
                x="250" y="280" width="200" height="100"
                fill="none" stroke="#c8ff00" strokeWidth="0.8"
                style={{ opacity: 0, transition: 'transform 0.3s ease' }}
              />

              {/* Tin line */}
              <line
                className="viz-line"
                x1="50" y1="530" x2="450" y2="530"
                stroke="#c8ff00" strokeWidth="1" opacity="0.5"
                style={{ opacity: 0, transition: 'transform 0.3s ease' }}
              />

              {/* Ball */}
              <circle
                ref={ballRef}
                cx="250" cy="300" r="10"
                fill="#c8ff00"
                style={{ opacity: 0 }}
              />

              {/* Labels */}
              <text x="250" y="30" textAnchor="middle" fill="#666" fontSize="10" fontFamily="Space Grotesk">
                BACK WALL
              </text>
              <text x="250" y="580" textAnchor="middle" fill="#666" fontSize="10" fontFamily="Space Grotesk">
                FRONT WALL
              </text>
              <text x="30" y="300" textAnchor="middle" fill="#666" fontSize="10" fontFamily="Space Grotesk" transform="rotate(-90, 30, 300)">
                SIDE WALL
              </text>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
