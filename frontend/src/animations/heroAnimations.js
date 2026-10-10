import { animate, createTimeline, utils } from 'animejs';

const { stagger } = utils;

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Hero entrance animation
 */
export function animateHero(containerRef) {
  if (prefersReducedMotion()) return null;

  const tl = createTimeline({ defaults: { easing: 'outExpo' } });

  tl.add(containerRef.querySelectorAll('.hero-line'), {
    translateY: [80, 0],
    opacity: [0, 1],
    duration: 1200,
    delay: stagger(150),
  })
  .add(containerRef.querySelectorAll('.hero-subtitle'), {
    translateY: [30, 0],
    opacity: [0, 1],
    duration: 800,
  }, '-=600')
  .add(containerRef.querySelectorAll('.hero-cta'), {
    translateY: [20, 0],
    opacity: [0, 1],
    duration: 600,
    delay: stagger(100),
  }, '-=400')
  .add(containerRef.querySelectorAll('.hero-visual'), {
    scale: [0.8, 1],
    opacity: [0, 1],
    duration: 1000,
  }, '-=800')
  .add(containerRef.querySelectorAll('.hero-decoration'), {
    opacity: [0, 0.4],
    duration: 1500,
    delay: stagger(200),
  }, '-=1000');

  return tl;
}

/**
 * Animate elements when they scroll into view
 */
export function animateOnScroll(elements, options = {}) {
  if (prefersReducedMotion()) return null;

  const {
    translateY = 40,
    opacity = [0, 1],
    duration = 800,
    delay = 0,
    staggerVal = 100,
    easing = 'outCubic',
  } = options;

  return animate(elements, {
    translateY: [translateY, 0],
    opacity,
    duration,
    delay: delay || stagger(staggerVal),
    easing,
  });
}

/**
 * Animated counter for statistics
 */
export function animateCounter(element, targetValue, options = {}) {
  if (prefersReducedMotion()) {
    element.textContent = targetValue;
    return null;
  }

  const obj = { value: 0 };
  const { duration = 2000, prefix = '', suffix = '' } = options;

  return animate(obj, {
    value: targetValue,
    duration,
    easing: 'outExpo',
    modifier: (v) => Math.round(v),
    onUpdate: () => {
      element.textContent = `${prefix}${Math.round(obj.value)}${suffix}`;
    },
  });
}

/**
 * Court selection animation
 */
export function animateCourtSelection(element) {
  if (prefersReducedMotion()) return null;

  return animate(element, {
    scale: [0.95, 1],
    opacity: [0.5, 1],
    duration: 400,
    easing: 'outCubic',
  });
}

/**
 * Booking slot selection animation
 */
export function animateBookingSelection(element) {
  if (prefersReducedMotion()) return null;

  return animate(element, {
    scale: [1, 1.05, 1],
    duration: 400,
    easing: 'outElastic(1, .5)',
  });
}

/**
 * Page enter animation
 */
export function animatePageEnter(containerRef) {
  if (prefersReducedMotion()) return null;

  return animate(containerRef, {
    opacity: [0, 1],
    translateY: [20, 0],
    duration: 600,
    easing: 'outCubic',
  });
}

/**
 * Stagger reveal animation for lists
 */
export function animateStaggerReveal(elements, options = {}) {
  if (prefersReducedMotion()) return null;

  const {
    duration = 600,
    staggerVal = 80,
    translateY = 30,
    easing = 'outCubic',
  } = options;

  return animate(elements, {
    translateY: [translateY, 0],
    opacity: [0, 1],
    duration,
    delay: stagger(staggerVal),
    easing,
  });
}

/**
 * Modal entrance animation
 */
export function animateModalEnter(backdrop, modal) {
  if (prefersReducedMotion()) return null;

  const tl = createTimeline({ defaults: { easing: 'outCubic' } });

  tl.add(backdrop, {
    opacity: [0, 1],
    duration: 300,
  })
  .add(modal, {
    scale: [0.9, 1],
    opacity: [0, 1],
    duration: 400,
  }, '-=200');

  return tl;
}

/**
 * Number tick animation for stats
 */
export function animateNumberTick(element, from, to, options = {}) {
  if (prefersReducedMotion()) {
    element.textContent = to;
    return null;
  }

  const obj = { val: from };
  const { duration = 1500 } = options;

  return animate(obj, {
    val: to,
    duration,
    easing: 'outExpo',
    onUpdate() {
      element.textContent = Math.round(obj.val);
    },
  });
}
