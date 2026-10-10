/**
 * Returns a safe in-app path from a `?next=` value. Only relative
 * paths are allowed so the login page cannot be used as an open
 * redirect to another site.
 */
export function getSafeNext(searchParams, fallback = '/') {
  const next = searchParams.get('next');
  if (!next || !next.startsWith('/') || next.startsWith('//')) return fallback;
  return next;
}
