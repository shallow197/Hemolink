// =====================================================================
// api.js — Client HTTP centralisé pour appeler l'API HemoLink
// =====================================================================
// Toutes les pages utilisent fetchJson() au lieu de window.fetch() pour :
//   1. Injecter automatiquement le token JWT dans le header Authorization
//   2. Convertir les erreurs HTTP en Error JS faciles à attraper
//   3. Nettoyer le token expiré automatiquement (401)
// =====================================================================

// En dev, on utilise le proxy Vite (BASE = '') qui redirige /api vers localhost:4000.
// En prod (Vercel), on utilise l'URL absolue du backend Railway via VITE_API_URL.
// en dev. En prod, on mettrait l'URL absolue de l'API.
const BASE = import.meta.env.VITE_API_URL || '';

// Clé localStorage pour stocker le JWT (persiste entre les rechargements)
const TOKEN_KEY = 'hemolink_token';

// --- Lecture du token JWT (avec try/catch au cas où localStorage bloqué) ---
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

// --- Écriture du token (ou suppression si on passe null/undefined) ---
export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
}

// --- Wrapper autour de fetch() ----------------------------------------
/**
 * Appelle l'API HemoLink en JSON.
 *   - GET :  await fetchJson('/api/donneurs/me')
 *   - POST : await fetchJson('/api/alertes/3/repondre', { method:'POST', body: JSON.stringify({...}) })
 *
 * En cas d'erreur, lève une Error avec .status et .issues (validation Zod).
 */
export async function fetchJson(path, options = {}) {
  const token = getToken();

  // Construction des headers : JSON par défaut + Bearer si on a un token
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers, // permet de surcharger si besoin
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  // 401 = token expiré/invalide → on nettoie pour forcer la re-connexion
  if (res.status === 401) {
    setToken(null);
  }

  // En cas d'erreur, on extrait le message JSON et on lève une Error riche
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e = new Error(err.error || res.statusText || 'Erreur réseau');
    e.status = res.status;
    e.issues = err.issues; // détails de validation Zod si présents
    throw e;
  }

  // 204 No Content (ex : DELETE) → pas de corps à parser
  if (res.status === 204) return null;
  return res.json();
}

// =====================================================================
// EXPLICATION POUR LA SOUTENANCE (15 secondes) :
// ---------------------------------------------------------------------
// Ce petit fichier est utilisé partout côté front. Au lieu de répéter
// "récupère le token, mets-le dans le header, parse le JSON, lève une
// erreur si HTTP != 2xx" dans chaque page, on factorise dans
// fetchJson(). Le token JWT est stocké dans localStorage (donc il
// persiste si on rafraîchit la page) et injecté automatiquement à
// chaque appel. Si le token est expiré, on le supprime — l'AuthContext
// fera ensuite redirection vers /login.
// =====================================================================
