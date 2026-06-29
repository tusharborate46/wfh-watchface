/**
 * useAuth.js
 * Manages JWT sessions for both employee and manager sections.
 * Keys: emp_token / emp_user for employees, mgr_token / mgr_user for managers.
 */
import { useCallback, useState } from 'react';

function readSession(prefix) {
  try {
    const token = localStorage.getItem(`${prefix}_token`) || '';
    const user = JSON.parse(localStorage.getItem(`${prefix}_user`) || 'null');
    return { token, user };
  } catch {
    return { token: '', user: null };
  }
}

export function useAuth(type) {
  const prefix = type === 'manager' ? 'mgr' : 'emp';
  const [session, setSession] = useState(() => readSession(prefix));

  const login = useCallback((token, user) => {
    localStorage.setItem(`${prefix}_token`, token);
    localStorage.setItem(`${prefix}_user`, JSON.stringify(user));
    setSession({ token, user });
  }, [prefix]);

  const logout = useCallback(() => {
    localStorage.removeItem(`${prefix}_token`);
    localStorage.removeItem(`${prefix}_user`);
    setSession({ token: '', user: null });
  }, [prefix]);

  return {
    token: session.token,
    user: session.user,
    isAuthenticated: Boolean(session.token),
    login,
    logout
  };
}
