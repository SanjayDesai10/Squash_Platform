// Shared loading / error / empty states, styled to match the site.

export function LoadingState({ label = 'Loading…', className = '' }) {
  return (
    <div className={`py-8 text-center border border-border ${className}`} role="status" aria-live="polite">
      <p className="text-sm text-text-muted font-heading tracking-widest uppercase animate-pulse">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry, className = '' }) {
  return (
    <div className={`py-8 px-6 text-center border border-danger/40 bg-danger/5 ${className}`} role="alert">
      <p className="text-sm text-danger">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 text-xs font-heading tracking-widest uppercase text-text-secondary hover:text-accent-ink transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ children, className = '' }) {
  return (
    <div className={`py-8 text-center border border-border ${className}`}>
      <p className="text-sm text-text-muted">{children}</p>
    </div>
  );
}

export function InlineAlert({ tone = 'danger', children }) {
  const tones = {
    danger: 'border-danger/40 bg-danger/5 text-danger',
    success: 'border-success/40 bg-success/5 text-success',
  };

  return (
    <div className={`px-4 py-3 border text-sm ${tones[tone]}`} role={tone === 'danger' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
