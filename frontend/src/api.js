const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function getToken() {
  return localStorage.getItem('nest_token');
}

export function getAdminName() {
  return localStorage.getItem('nest_admin_name') || 'Admin';
}

export function setSession(token, name) {
  localStorage.setItem('nest_token', token);
  localStorage.setItem('nest_admin_name', name);
}

export function clearSession() {
  localStorage.removeItem('nest_token');
  localStorage.removeItem('nest_admin_name');
}

export async function api(path, options = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && !path.startsWith('/auth')) {
    clearSession();
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
