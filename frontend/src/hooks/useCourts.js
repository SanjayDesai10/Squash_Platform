import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

/** Loads active courts from the API. */
export function useCourts() {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return api.getCourts()
      .then((data) => setCourts([...data.courts].sort((a, b) => a.id - b.id)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return { courts, loading, error, reload: load };
}
