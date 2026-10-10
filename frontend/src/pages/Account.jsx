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
        </div>
      </section>
    </div>
  );
}
