import { useRef, useEffect, useState, useCallback } from 'react';
import { useScrollAnimation } from '../animations/cursorAnimations';
import { prefersReducedMotion } from '../animations/heroAnimations';
import { animate } from 'animejs';

export default function AnimatedCounter({ value, prefix = '', suffix = '', label }) {
  const ref = useRef(null);
  const numberRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useScrollAnimation(ref, useCallback(() => {
    if (hasAnimated || !numberRef.current) return;
    setHasAnimated(true);

    if (prefersReducedMotion()) {
      numberRef.current.textContent = `${prefix}${value}${suffix}`;
      return;
    }

    const obj = { val: 0 };
    animate(obj, {
      val: value,
      duration: 2000,
      easing: 'outExpo',
      onUpdate() {
        if (numberRef.current) {
          numberRef.current.textContent = `${prefix}${Math.round(obj.val)}${suffix}`;
        }
      },
    });
  }, [hasAnimated, value, prefix, suffix]));

  return (
    <div ref={ref} className="text-center">
      <div
        ref={numberRef}
        className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-accent-ink"
      >
        {`${prefix}0${suffix}`}
      </div>
      <div className="mt-2 text-sm text-text-secondary uppercase tracking-widest font-heading">
        {label}
      </div>
    </div>
  );
}
