import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ErrorState, LoadingState } from '../components/StatusMessage';
import { useAuth } from '../context/AuthContext';
import { getSafeNext } from '../lib/redirect';

/**
 * Google redirects here (via Better Auth) after the user picks an
 * account. We swap Better Auth's session for our login token, then go
 * where the user was heading.
 */
export default function GoogleCallback() {
  const { completeGoogleSignIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = getSafeNext(searchParams, '/book');
  const [error, setError] = useState(null);
  const started = useRef(false);

  useEffect(() => {
    // StrictMode runs effects twice in development; only exchange once.
    if (started.current) return;
    started.current = true;

    completeGoogleSignIn()
      .then(() => navigate(next, { replace: true }))
      .catch((err) => setError(err.message.charAt(0).toUpperCase() + err.message.slice(1) + '.'));
  }, [completeGoogleSignIn, navigate, next]);

  return (
    <section className="pt-36 pb-24 md:pt-44 md:pb-32" aria-label="Signing in with Google">
      <div className="container max-w-md">
        {error ? (
          <>
            <ErrorState message={error} />
            <Link
              to={`/login?next=${encodeURIComponent(next)}`}
              className="magnetic-btn magnetic-btn-primary w-full mt-6"
            >
              Back to Log In
            </Link>
          </>
        ) : (
          <LoadingState label="Signing you in with Google…" />
        )}
      </div>
    </section>
  );
}
