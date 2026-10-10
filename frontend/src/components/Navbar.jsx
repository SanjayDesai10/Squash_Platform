import { useRef, useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { animate } from 'animejs';
import { prefersReducedMotion } from '../animations/heroAnimations';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animate navbar on mount
  useEffect(() => {
    if (prefersReducedMotion() || !navRef.current) return;
    animate(navRef.current, {
      translateY: [-20, 0],
      opacity: [0, 1],
      duration: 800,
      easing: 'outCubic',
      delay: 200,
    });
  }, []);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/courts', label: 'Courts' },
    { to: '/book', label: 'Book' },
  ];

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || location.pathname !== '/'
          ? 'bg-bg-primary/90 backdrop-blur-md border-b border-border'
          : 'bg-transparent'
      }`}
      style={{ opacity: 0 }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container flex items-center justify-between h-24 md:h-28">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center"
          aria-label="The Ball Room — Home"
        >
          <img
            src="/logo-on-dark.png"
            alt="The Ball Room"
            className="h-16 md:h-20 w-auto"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `relative font-heading text-sm tracking-widest uppercase transition-colors duration-300 ${
                  isActive
                    ? 'text-accent'
                    : 'text-text-secondary hover:text-text-primary'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-px bg-accent" />
                  )}
                </>
              )}
            </NavLink>
          ))}

          <Link
            to="/book"
            className="magnetic-btn magnetic-btn-primary text-xs py-3 px-6"
          >
            Book a Court
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden relative w-10 h-10 flex items-center justify-center"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          <div className="flex flex-col gap-1.5 w-6">
            <span
              className={`block h-px bg-text-primary transition-all duration-300 ${
                mobileOpen ? 'rotate-45 translate-y-[4px]' : ''
              }`}
            />
            <span
              className={`block h-px bg-text-primary transition-all duration-300 ${
                mobileOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block h-px bg-text-primary transition-all duration-300 ${
                mobileOpen ? '-rotate-45 -translate-y-[4px]' : ''
              }`}
            />
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden fixed inset-0 top-24 bg-bg-primary/98 backdrop-blur-xl z-40 transition-all duration-500 ${
          mobileOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="container flex flex-col items-center justify-center h-full gap-8 -mt-16">
          {navLinks.map((link, i) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `font-heading text-3xl tracking-wider uppercase transition-colors duration-300 ${
                  isActive ? 'text-accent' : 'text-text-secondary'
                }`
              }
              style={{
                transitionDelay: mobileOpen ? `${i * 100}ms` : '0ms',
                transform: mobileOpen ? 'translateY(0)' : 'translateY(20px)',
                opacity: mobileOpen ? 1 : 0,
              }}
            >
              {link.label}
            </NavLink>
          ))}
          <Link
            to="/book"
            className="magnetic-btn magnetic-btn-primary mt-4"
            style={{
              transitionDelay: mobileOpen ? '300ms' : '0ms',
              transform: mobileOpen ? 'translateY(0)' : 'translateY(20px)',
              opacity: mobileOpen ? 1 : 0,
            }}
          >
            Book a Court
          </Link>
        </div>
      </div>
    </nav>
  );
}
