import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/courts', label: 'Courts' },
    { to: '/book', label: 'Book' },
  ];

  const contactInfo = [
    { label: 'hello@theballroom.in' },
    { label: '+91 98765 43210' },
    { label: 'Mumbai, India' },
  ];

  return (
<footer
  className="border-t border-border bg-bg-secondary pt-12 pb-8 md:pt-16 md:pb-10"
  role="contentinfo"
>
      <div className="container">

        {/* Main Footer */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="inline-block">
              <img
                src="/logo-on-dark.png"
                alt="The Ball Room"
                className="h-16 w-auto"
              />
            </Link>

            <p className="mt-4 text-sm text-text-secondary leading-relaxed max-w-xs">
              Premium courts with seamless online booking. Pickleball & Chill —
              built for players who take the game seriously.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-heading text-xs tracking-widest uppercase text-text-muted mb-6">
              Navigate
            </h3>

            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-text-secondary hover:text-accent transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading text-xs tracking-widest uppercase text-text-muted mb-6">
              Contact
            </h3>

            <ul className="space-y-3">
              {contactInfo.map((item, i) => (
                <li
                  key={i}
                  className="text-sm text-text-secondary"
                >
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="font-heading text-xs tracking-widest uppercase text-text-muted mb-6">
              Hours
            </h3>

            <ul className="space-y-3">
              <li className="text-sm text-text-secondary">
                Mon — Fri: 6AM — 10PM
              </li>

              <li className="text-sm text-text-secondary">
                Sat — Sun: 7AM — 9PM
              </li>

              <li className="text-sm text-text-secondary">
                Online Booking: 24/7
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">

          {/* Copyright */}
          <p className="text-xs text-text-muted">
            © {currentYear} The Ball Room. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-6">
            {['Twitter', 'Instagram', 'LinkedIn'].map((social) => (
              <a
                key={social}
                href="#"
                className="text-xs text-text-muted hover:text-accent transition-colors duration-300 uppercase tracking-widest"
                aria-label={`Follow us on ${social}`}
              >
                {social}
              </a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}