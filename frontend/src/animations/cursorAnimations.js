import { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import { prefersReducedMotion } from './heroAnimations';

/**
 * Cursor parallax effect for hero elements
 * Elements with data-parallax-speed attribute will move based on cursor position
 */
export function useCursorParallax(containerRef, options = {}) {
  const { intensity = 0.02, enabled = true } = options;
  const animFrameRef = useRef(null);

  useEffect(() => {
    if (!enabled || prefersReducedMotion()) return;
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) return;

    const elements = container.querySelectorAll('[data-parallax-speed]');
    if (!elements.length) return;

    const handleMouseMove = (e) => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

      animFrameRef.current = requestAnimationFrame(() => {
        const { clientX, clientY } = e;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const deltaX = (clientX - centerX) * intensity;
        const deltaY = (clientY - centerY) * intensity;

        elements.forEach((el) => {
          const speed = parseFloat(el.dataset.parallaxSpeed) || 1;
          animate(el, {
            translateX: deltaX * speed,
            translateY: deltaY * speed,
            duration: 800,
            easing: 'outQuad',
          });
        });
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [containerRef, intensity, enabled]);
}

/**
 * Magnetic button effect
 * Button subtly follows cursor when nearby
 */
export function useMagneticEffect(buttonRef, options = {}) {
  const { strength = 0.3, radius = 100 } = options;

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const button = buttonRef.current;
    if (!button) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) return;

    const handleMouseMove = (e) => {
      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      const distance = Math.sqrt(distX * distX + distY * distY);

      if (distance < radius) {
        const factor = (1 - distance / radius) * strength;
        animate(button, {
          translateX: distX * factor,
          translateY: distY * factor,
          duration: 300,
          easing: 'outQuad',
        });
      }
    };

    const handleMouseLeave = () => {
      animate(button, {
        translateX: 0,
        translateY: 0,
        duration: 600,
        easing: 'outElastic(1, .5)',
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    button.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [buttonRef, strength, radius]);
}

/**
 * Intersection Observer hook for scroll-triggered animations
 */
export function useScrollAnimation(ref, callback, options = {}) {
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          callback(element);
          observer.unobserve(element);
        }
      },
      { threshold: options.threshold || 0.2, rootMargin: options.rootMargin || '0px' }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, callback, options.threshold, options.rootMargin]);
}

/**
 * Squash ball cursor follower animation
 */
export function useSquashBallCursor(ballRef, containerRef) {
  const animFrameRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ball = ballRef.current;
    const container = containerRef.current;
    if (!ball || !container) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) return;

    const handleMouseMove = (e) => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

      animFrameRef.current = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = (e.clientX - centerX) * 0.05;
        const deltaY = (e.clientY - centerY) * 0.05;

        animate(ball, {
          translateX: deltaX,
          translateY: deltaY,
          duration: 1200,
          easing: 'outQuad',
        });
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [ballRef, containerRef]);
}
