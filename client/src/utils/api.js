const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function getToken(type = 'employee') {
  const prefix = type === 'manager' ? 'mgr' : 'emp';
  return localStorage.getItem(`${prefix}_token`) || '';
}

export async function api(path, options = {}, tokenType = 'employee') {
  const token = options.token ?? getToken(tokenType);
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || res.statusText);
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function empApi(path, options = {}) {
  return api(path, options, 'employee');
}

export async function mgrApi(path, options = {}) {
  return api(path, options, 'manager');
}
