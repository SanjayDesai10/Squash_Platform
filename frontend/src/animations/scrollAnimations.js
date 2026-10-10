import { animate, utils } from 'animejs';
import { prefersReducedMotion } from './heroAnimations';

const { stagger } = utils;

/**
 * Generic scroll-triggered fade-in-up
 */
export function createScrollObserver(elements, options = {}) {
  if (prefersReducedMotion()) return null;

  const {
    threshold = 0.15,
    translateY = 40,
    duration = 700,
    staggerVal = 80,
    easing = 'outCubic',
  } = options;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const children = entry.target.querySelectorAll('.scroll-reveal') || [entry.target];
          animate(children.length ? children : entry.target, {
            translateY: [translateY, 0],
            opacity: [0, 1],
            duration,
            delay: stagger(staggerVal),
            easing,
          });
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold }
  );

  if (NodeList.prototype.isPrototypeOf(elements) || Array.isArray(elements)) {
    elements.forEach((el) => observer.observe(el));
  } else if (elements) {
    observer.observe(elements);
  }

  return observer;
}

/**
 * Court line draw animation on scroll
 */
export function animateCourtLines(svgElement) {
  if (prefersReducedMotion()) return null;

  const paths = svgElement.querySelectorAll('line, path, rect, circle');

  return animate(paths, {
    opacity: [0, 0.5],
    duration: 1500,
    delay: stagger(100),
    easing: 'inOutQuad',
  });
}

/**
 * Parallax scroll effect (vertical movement based on scroll position)
 */
export function setupScrollParallax(elements) {
  if (prefersReducedMotion()) return () => {};

  const handleScroll = () => {
    const scrollY = window.scrollY;

    elements.forEach((el) => {
      const speed = parseFloat(el.dataset.scrollSpeed) || 0.1;
      const rect = el.getBoundingClientRect();
      const elementTop = rect.top + scrollY;
      const offset = (scrollY - elementTop) * speed;

      el.style.transform = `translateY(${offset}px)`;
    });
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}
