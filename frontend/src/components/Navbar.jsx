import { useRef, useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { animate } from 'animejs';
import { prefersReducedMotion } from '../animations/heroAnimations';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

const MAIN_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/courts', label: 'Courts' },
  { to: '/book', label: 'Book' },
];

function getMainLinks(user) {
  return [
    ...MAIN_LINKS,
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ];
}

function getAccountLinks(user) {
  if (!user) return [];
  return [
    { to: '/bookings', label: 'My Bookings' },
    { to: '/account', label: 'Account' },
  ];
}

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/** Signed-in user's menu: bookings, account, admin, log out. */
function AccountMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();
  const links = getAccountLinks(user);
  const initial = user.name.trim().charAt(0).toUpperCase();

  useEffect(() => { setOpen(false); }, [location]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`h-10 inline-flex items-center gap-2 pl-1 pr-3 border transition-colors duration-300 ${
          open ? 'border-accent-ink text-text-primary' : 'border-border text-text-secondary hover:text-text-primary hover:border-text-muted'
        }`}
      >
        <span className="w-8 h-8 inline-flex items-center justify-center bg-accent text-on-accent font-heading font-bold text-sm">
          {initial}
        </span>
        <span className="font-heading text-sm max-w-[8rem] truncate">{user.name.split(' ')[0]}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-64 bg-bg-secondary border border-border shadow-2xl shadow-black/30 py-2 z-50"
        >
          <div className="px-4 py-3 border-b border-border mb-2">
            <p className="font-heading font-semibold truncate">{user.name}</p>
            <p className="text-xs text-text-muted truncate">{user.email}</p>
          </div>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              role="menuitem"
              className={({ isActive }) =>
                `block px-4 py-2.5 text-sm transition-colors ${
                  isActive ? 'text-accent-ink bg-bg-tertiary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <div className="border-t border-border mt-2 pt-2">
            <button
              type="button"
              role="menuitem"
              onClick={onLogout}
              className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:text-danger hover:bg-bg-tertiary transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Lock page scroll and allow Escape while the mobile menu is open
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', handleKey);
    };
  }, [mobileOpen]);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
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

  const solid = scrolled || mobileOpen || location.pathname !== '/';
  const mainLinks = getMainLinks(user);
  const mobileLinks = [...mainLinks, ...getAccountLinks(user)];

  return (
    <>
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        solid ? 'bg-bg-primary/90 backdrop-blur-md border-b border-border' : 'bg-transparent border-b border-transparent'
      }`}
      style={prefersReducedMotion() ? undefined : { opacity: 0 }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className={`container flex items-center justify-between gap-6 transition-[height] duration-300 ${scrolled ? 'h-20' : 'h-24 md:h-28'}`}>
        {/* Logo */}
        <Link to="/" className="flex items-center shrink-0" aria-label="The Ball Room — Home">
          <Logo className={`w-auto transition-[height] duration-300 ${scrolled ? 'h-12 md:h-14' : 'h-14 md:h-[4.5rem]'}`} />
        </Link>

        {/* Desktop navigation */}
        <div className="hidden lg:flex items-center gap-8">
          {mainLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `relative py-2 font-heading text-sm tracking-widest uppercase transition-colors duration-300 ${
                  isActive ? 'text-accent-ink' : 'text-text-secondary hover:text-text-primary'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  <span
                    className={`absolute -bottom-0.5 left-0 right-0 h-px bg-accent-ink transition-transform duration-300 origin-left ${
                      isActive ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <AccountMenu user={user} onLogout={handleLogout} />
          ) : (
            <Link
              to="/login"
              className="h-10 inline-flex items-center px-4 font-heading text-sm tracking-widest uppercase text-text-secondary hover:text-text-primary transition-colors duration-300"
            >
              Log In
            </Link>
          )}
          <Link to="/book" className="magnetic-btn magnetic-btn-primary !min-h-10 text-xs !py-2.5 !px-5 ml-1">
            Book a Court
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="lg:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            className="relative w-10 h-10 flex items-center justify-center border border-border"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            <div className="flex flex-col gap-1.5 w-5">
              <span className={`block h-px bg-text-primary transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-[3.5px]' : ''}`} />
              <span className={`block h-px bg-text-primary transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[3.5px]' : ''}`} />
            </div>
          </button>
        </div>
      </div>

    </nav>

      {/* Mobile menu. Rendered outside <nav>: the nav's backdrop-filter
          and entrance transform would make it the containing block for
          this fixed panel and clip it to the bar's height. */}
      <div
        id="mobile-menu"
        className={`lg:hidden fixed inset-x-0 bottom-0 ${scrolled ? 'top-20' : 'top-24 md:top-28'} bg-bg-primary z-40 overflow-y-auto transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="container py-8 flex flex-col min-h-full">
          {user && (
            <div className="flex items-center gap-3 pb-6 mb-2 border-b border-border">
              <span className="w-10 h-10 inline-flex items-center justify-center bg-accent text-on-accent font-heading font-bold">
                {user.name.trim().charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="font-heading font-semibold truncate">{user.name}</p>
                <p className="text-xs text-text-muted truncate">{user.email}</p>
              </div>
            </div>
          )}

          <ul className="flex flex-col">
            {mobileLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  tabIndex={mobileOpen ? 0 : -1}
                  className={({ isActive }) =>
                    `flex items-center justify-between py-4 border-b border-border font-heading text-xl tracking-wide transition-colors ${
                      isActive ? 'text-accent-ink' : 'text-text-primary'
                    }`
                  }
                >
                  {link.label}
                  <span aria-hidden="true" className="text-text-muted">→</span>
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3">
            <Link to="/book" tabIndex={mobileOpen ? 0 : -1} className="magnetic-btn magnetic-btn-primary w-full">
              Book a Court
            </Link>
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                tabIndex={mobileOpen ? 0 : -1}
                className="magnetic-btn magnetic-btn-secondary w-full"
              >
                Log Out
              </button>
            ) : (
              <Link to="/login" tabIndex={mobileOpen ? 0 : -1} className="magnetic-btn magnetic-btn-secondary w-full">
                Log In
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
