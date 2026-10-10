import { useEffect, useRef, useState } from 'react';
import FormField from '../components/FormField';
import { InlineAlert } from '../components/StatusMessage';
import { useAuth } from '../context/AuthContext';
import { animatePageEnter } from '../animations/heroAnimations';

export default function Account() {
  const pageRef = useRef(null);
  const { user, changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!pageRef.current) return;
    const anim = animatePageEnter(pageRef.current);
    return () => { if (anim) anim.pause(); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from your current password.');
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={pageRef}>
      <section className="pt-36 pb-24 md:pt-44 md:pb-32" aria-label="Account">
        <div className="container max-w-md">
          <span className="section-label">Account</span>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold mt-4">
            YOUR <span className="text-accent-ink">ACCOUNT</span>
          </h1>

          <div className="mt-10 bg-bg-secondary border border-border p-6 space-y-3">
            <div className="flex justify-between gap-4">
              <span className="text-sm text-text-secondary">Name</span>
              <span className="font-heading font-semibold text-right">{user.name}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-sm text-text-secondary">Email</span>
              <span className="font-heading font-semibold text-right break-all">{user.email}</span>
            </div>
          </div>

          {user.hasPassword ? (
          <>
          <h2 className="font-heading text-xl font-bold tracking-wide mt-12">Change Password</h2>
          <p className="mt-2 text-sm text-text-muted">
            Changing your password signs you out on all other devices.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {error && <InlineAlert>{error}</InlineAlert>}
            {success && <InlineAlert tone="success">Password changed successfully.</InlineAlert>}
            <FormField
              id="currentPassword"
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
            />
            <FormField
              id="newPassword"
              label="New Password"
              type="password"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              minLength={8}
              hint="At least 8 characters."
            />
            <FormField
              id="confirmNewPassword"
              label="Confirm New Password"
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
              {submitting ? 'Updating…' : 'Update Password'}
            </button>
          </form>
          </>
          ) : (
            <div className="mt-12 bg-bg-secondary border border-border p-6 flex items-start gap-4">
              <svg viewBox="0 0 48 48" className="w-6 h-6 shrink-0 mt-0.5" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
              </svg>
              <div>
                <h2 className="font-heading font-bold">Signed in with Google</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Your account uses Google to sign in, so there's no password to change here.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
