import { useEffect, useRef, useState } from 'react';
import { InlineAlert } from './StatusMessage';
import { api } from '../lib/api';

const RESEND_SECONDS = 60;

/**
 * Enter the 6-digit code emailed to `email`. On success calls
 * `onVerify(email, code)` (which logs the user in).
 */
export default function VerifyEmailForm({ email, onVerify, onBack, notice }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(notice ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Enter the 6-digit code from the email.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onVerify(email, code);
    } catch (err) {
      setError(err.message.charAt(0).toUpperCase() + err.message.slice(1) + '.');
      setCode('');
      setSubmitting(false);
      inputRef.current?.focus();
    }
  };

  const handleResend = async () => {
    setError(null);
    setInfo(null);
    try {
      await api.resendVerification(email);
      setInfo('A new code is on its way.');
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(err.message.charAt(0).toUpperCase() + err.message.slice(1) + '.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <h2 className="font-heading text-xl font-bold">Check your email</h2>
        <p className="mt-2 text-sm text-text-secondary">
          We sent a 6-digit code to <span className="text-text-primary font-semibold break-all">{email}</span>.
          Enter it below to confirm your email.
        </p>
      </div>

      {error && <InlineAlert>{error}</InlineAlert>}
      {info && !error && <InlineAlert tone="success">{info}</InlineAlert>}

      <div>
        <label htmlFor="otp" className="block text-xs text-text-muted uppercase tracking-widest mb-2 font-heading">
          Verification code
        </label>
        <input
          ref={inputRef}
          id="otp"
          name="otp"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder="••••••"
          className="w-full bg-bg-card border border-border px-4 py-4 text-center font-heading text-2xl tracking-[0.6em] text-text-primary placeholder:text-text-muted focus:border-accent-ink focus:outline-none"
        />
        <p className="mt-2 text-xs text-text-muted">The code expires in 10 minutes. Check your spam folder if you can't find it.</p>
      </div>

      <button
        type="submit"
        disabled={submitting || code.length !== 6}
        className="magnetic-btn magnetic-btn-primary w-full justify-center disabled:opacity-50"
      >
        {submitting ? 'Verifying…' : 'Verify & Continue'}
      </button>

      <div className="flex items-center justify-between gap-4 text-sm">
        {onBack ? (
          <button type="button" onClick={onBack} className="text-text-secondary hover:text-text-primary transition-colors">
            ← Use a different email
          </button>
        ) : <span />}
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          className="text-accent-ink hover:text-accent-dim transition-colors disabled:text-text-muted disabled:cursor-not-allowed"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </form>
  );
}
