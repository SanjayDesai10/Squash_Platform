import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, onUnauthorized, setToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // True until the stored token (if any) has been checked with /me.
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  // Restore the session on first load.
  useEffect(() => {
    if (!getToken()) return;

    let cancelled = false;
    api.me()
      .then((data) => { if (!cancelled) setUser(data.user); })
      .catch(() => { if (!cancelled) logout(); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [logout]);

  // Expired / revoked token on any authenticated request → sign out.
  useEffect(() => onUnauthorized(logout), [logout]);

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    await api.register(name, email, password);
    return login(email, password);
  }, [login]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const data = await api.changePassword(currentPassword, newPassword);
    // The server revokes all previous tokens and returns a new one
    // for this session.
    setToken(data.token);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, changePassword }),
    [user, loading, login, register, logout, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
