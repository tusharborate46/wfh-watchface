const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function getToken() {
  return localStorage.getItem('token') || '';
}

export async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
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
