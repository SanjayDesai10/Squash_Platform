import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useMagneticEffect } from '../animations/cursorAnimations';

export default function MagneticButton({
  children,
  to,
  href,
  variant = 'primary',
  className = '',
  onClick,
  type = 'button',
  disabled = false,
  ariaLabel,
  ...props
}) {
  const btnRef = useRef(null);
  useMagneticEffect(btnRef);

  const baseClasses = `magnetic-btn magnetic-btn-${variant} ${className}`;

  // If it links somewhere via React Router
  if (to) {
    return (
      <Link
        ref={btnRef}
        to={to}
        className={baseClasses}
        aria-label={ariaLabel}
        {...props}
      >
        {children}
      </Link>
    );
  }

  // External link
  if (href) {
    return (
      <a
        ref={btnRef}
        href={href}
        className={baseClasses}
        aria-label={ariaLabel}
        {...props}
      >
        {children}
      </a>
    );
  }

  // Button
  return (
    <button
      ref={btnRef}
      type={type}
      className={baseClasses}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  );
}
