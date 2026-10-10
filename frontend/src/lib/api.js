// ═══════════════════════════════════════════════════════════
// API client - thin wrapper around fetch for the backend
// ═══════════════════════════════════════════════════════════

// Empty in development (Vite proxies /api). Set VITE_API_URL when the
// API is served from a different origin in production.
const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const TOKEN_KEY = 'tbr.token';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage unavailable (private mode) - session lasts until reload.
  }
}

// Listeners notified when an authenticated request is rejected, so
// the auth context can sign the user out.
const unauthorizedListeners = new Set();

export function onUnauthorized(listener) {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

async function request(method, path, { body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = auth ? getToken() : null;
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Unable to reach the server. Please check your connection.');
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON response (e.g. proxy error page)
  }

  if (!response.ok) {
    if (response.status === 401 && auth) {
      unauthorizedListeners.forEach((listener) => listener());
    }
    throw new ApiError(response.status, data?.message || `Request failed (${response.status})`);
  }

  return data;
}

export const api = {
  // Auth
  register: (name, email, password) =>
    request('POST', '/api/auth/register', { body: { name, email, password } }),
  login: (email, password) =>
    request('POST', '/api/auth/login', { body: { email, password } }),
  me: () => request('GET', '/api/auth/me', { auth: true }),
  changePassword: (currentPassword, newPassword) =>
    request('PATCH', '/api/auth/change-password', {
      body: { currentPassword, newPassword },
      auth: true,
    }),

  // Courts
  getCourts: () => request('GET', '/api/courts'),

  // Bookings
  getAvailability: (courtId, date) =>
    request('GET', `/api/bookings/availability?courtId=${encodeURIComponent(courtId)}&date=${encodeURIComponent(date)}`),
  createBooking: ({ courtId, date, startTime, endTime }) =>
    request('POST', '/api/bookings', {
      body: { courtId, date, startTime, endTime },
      auth: true,
    }),
  getMyBookings: () => request('GET', '/api/bookings', { auth: true }),
  cancelBooking: (id) =>
    request('PATCH', `/api/bookings/${encodeURIComponent(id)}`, { auth: true }),

  // Admin
  admin: {
    getCourts: () => request('GET', '/api/admin/courts', { auth: true }),
    createCourt: (court) => request('POST', '/api/courts', { body: court, auth: true }),
    updateCourt: (id, changes) =>
      request('PATCH', `/api/courts/${encodeURIComponent(id)}`, { body: changes, auth: true }),
    deactivateCourt: (id) =>
      request('DELETE', `/api/courts/${encodeURIComponent(id)}`, { auth: true }),
    getBookings: (date) =>
      request('GET', `/api/admin/bookings${date ? `?date=${encodeURIComponent(date)}` : ''}`, { auth: true }),
    cancelBooking: (id) =>
      request('PATCH', `/api/admin/bookings/${encodeURIComponent(id)}/cancel`, { auth: true }),
    confirmBooking: (id) =>
      request('PATCH', `/api/admin/bookings/${encodeURIComponent(id)}/confirm`, { auth: true }),
    getSchedule: (date) =>
      request('GET', `/api/admin/schedule?date=${encodeURIComponent(date)}`, { auth: true }),
    blockSlot: ({ courtId, date, startTime }) =>
      request('POST', '/api/admin/slots/block', { body: { courtId, date, startTime }, auth: true }),
    unblockSlot: ({ courtId, date, startTime }) =>
      request('POST', '/api/admin/slots/unblock', { body: { courtId, date, startTime }, auth: true }),
  },
};
