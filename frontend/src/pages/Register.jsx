import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import FormField from '../components/FormField';
import GoogleSignInButton from '../components/GoogleSignInButton';
import VerifyEmailForm from '../components/VerifyEmailForm';
import { InlineAlert } from '../components/StatusMessage';
import { useAuth } from '../context/AuthContext';
import { getSafeNext } from '../lib/redirect';
import { EMAIL_AUTH_ENABLED } from '../lib/features';
import { animatePageEnter } from '../animations/heroAnimations';

export default function Register() {
  const pageRef = useRef(null);
  const { user, register, verifyEmail } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = getSafeNext(searchParams, '/book');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // After sign-up: the address the verification code was sent to.
  const [pendingEmail, setPendingEmail] = useState(null);

  useEffect(() => {
    if (!pageRef.current) return;
    const anim = animatePageEnter(pageRef.current);
    return () => { if (anim) anim.pause(); };
  }, []);

  if (user && !submitting) return <Navigate to={next} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await register(name, email, password);
      setPendingEmail(result.email);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (verifiedEmail, code) => {
    await verifyEmail(verifiedEmail, code);
    navigate(next, { replace: true });
  };

  return (
    <div ref={pageRef}>
      <section className="pt-36 pb-24 md:pt-44 md:pb-32" aria-label="Create account">
        <div className="container max-w-md">
          <span className="section-label">Account</span>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold mt-4">
            JOIN <span className="text-accent-ink">TBR</span>
          </h1>
          <p className="mt-4 text-text-secondary">
            {EMAIL_AUTH_ENABLED
              ? 'Create an account to start booking courts.'
              : 'Sign up with your Google account to start booking courts. It only takes a click.'}
          </p>

          {pendingEmail ? (
            <div className="mt-10">
              <VerifyEmailForm
                email={pendingEmail}
                onVerify={handleVerify}
                notice="Account created! Confirm your email to start booking."
              />
            </div>
          ) : (
          <>
          <div className="mt-10 space-y-6">
            {error && <InlineAlert>{error}</InlineAlert>}
            <GoogleSignInButton next={next} label="Sign up with Google" showDivider={EMAIL_AUTH_ENABLED} />
          </div>
          {EMAIL_AUTH_ENABLED && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField id="name" label="Name" value={name} onChange={setName} autoComplete="name" />
            <FormField id="email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
            <FormField
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              minLength={8}
              hint="At least 8 characters."
            />
            <FormField
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              minLength={8}
            />
            <button
              type="submit"
              disabled={submitting}
              className="magnetic-btn magnetic-btn-primary w-full justify-center disabled:opacity-50"
            >
              {submitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
          )}
          </>
          )}

          <p className="mt-8 text-sm text-text-secondary">
            Already have an account?{' '}
            <Link to={`/login?next=${encodeURIComponent(next)}`} className="text-accent-ink hover:text-accent-dim transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
