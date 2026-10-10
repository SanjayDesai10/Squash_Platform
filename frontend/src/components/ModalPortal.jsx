import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders a modal directly into <body> and locks page scroll while open.
 *
 * Pages animate in with a CSS transform, which makes a `position: fixed`
 * child position itself against the page instead of the viewport and
 * traps it below the navbar. Portalling to <body> avoids both problems.
 */
export default function ModalPortal({ children }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  return createPortal(children, document.body);
}
