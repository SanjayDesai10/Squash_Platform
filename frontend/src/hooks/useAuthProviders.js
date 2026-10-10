import { useEffect, useState } from 'react';
import { api } from '../lib/api';

// Fetched once per page load and shared by every caller.
let providersPromise = null;

/** Which optional sign-in methods the backend has configured. */
export function useAuthProviders() {
  const [providers, setProviders] = useState({ google: false, loaded: false });

  useEffect(() => {
    let cancelled = false;
    providersPromise ??= api.getAuthProviders().catch(() => ({ google: false }));
    providersPromise.then((data) => {
      if (!cancelled) setProviders({ google: Boolean(data.google), loaded: true });
    });
    return () => { cancelled = true; };
  }, []);

  return providers;
}
