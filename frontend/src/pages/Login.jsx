import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import FormField from '../components/FormField';
import { InlineAlert } from '../components/StatusMessage';
import { useAuth } from '../context/AuthContext';
import { getSafeNext } from '../lib/redirect';
import { animatePageEnter } from '../animations/heroAnimations';

export default function Login() {
  const pageRef = useRef(null);
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = getSafeNext(searchParams, '/book');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!pageRef.current) return;
    const anim = animatePageEnter(pageRef.current);
    return () => { if (anim) anim.pause(); };
  }, []);

  if (user && !submitting) return <Navigate to={next} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div ref={pageRef}>
      <section className="pt-36 pb-24 md:pt-44 md:pb-32" aria-label="Log in">
        <div className="container max-w-md">
          <span className="section-label">Account</span>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold mt-4">
            LOG <span className="text-accent-ink">IN</span>
          </h1>
          <p className="mt-4 text-text-secondary">Log in to book courts and manage your bookings.</p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            {error && <InlineAlert>{error}</InlineAlert>}
            <FormField id="email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
            <FormField id="password" label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
            <button
              type="submit"
              disabled={submitting}
              className="magnetic-btn magnetic-btn-primary w-full justify-center disabled:opacity-50"
            >
              {submitting ? 'Logging in…' : 'Log In'}
            </button>
          </form>

          <p className="mt-8 text-sm text-text-secondary">
            New here?{' '}
            <Link to={`/register?next=${encodeURIComponent(next)}`} className="text-accent-ink hover:text-accent-dim transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
