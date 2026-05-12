const BASE = '';
const TOKEN_KEY = 'hemolink_token';

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
    /* noop */
  }
}

export async function fetchJson(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    // Token expiré ou invalide — nettoyer et propager
    setToken(null);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e = new Error(err.error || res.statusText || 'Erreur réseau');
    e.status = res.status;
    e.issues = err.issues;
    throw e;
  }
  if (res.status === 204) return null;
  return res.json();
}
