// =====================================================================
// AuthContext.jsx — État d'authentification global de l'application
// =====================================================================
// Toute l'app a besoin de savoir : "qui est connecté, quel rôle, est-ce
// qu'on peut afficher la page X ?". Plutôt que de passer ces infos en
// props à travers 10 composants, on utilise le pattern Context de React.
//
// Importé une fois dans main.jsx, ce provider expose :
//   user, loading, login(), register(), logout(), refresh()
// =====================================================================

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchJson, getToken, setToken } from '../api';

// Le Context lui-même (vide par défaut)
const AuthContext = createContext(null);

// --- Provider : composant qui enveloppe toute l'app -------------------
export function AuthProvider({ children }) {
  // État local : l'utilisateur connecté et un flag de chargement initial
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- refresh() : recharge le profil depuis /api/auth/me ----------
  // Appelé au démarrage de l'app (pour rétablir la session si token valide)
  // ET après modification du profil (pour avoir la version à jour).
  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await fetchJson('/api/auth/me');
      setUser(data.user);
    } catch {
      // Token invalide → on nettoie tout, le user devra se reconnecter
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Au montage du provider (donc au chargement de l'app), on tente refresh
  useEffect(() => {
    refresh();
  }, [refresh]);

  // --- login() : POST /api/auth/login + stockage du token ---------
  async function login(email, password) {
    const data = await fetchJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token); // localStorage
    setUser(data.user);   // état React
    return data.user;
  }

  // --- register() : inscription d'un donneur + auto-login ---------
  async function register(payload) {
    const data = await fetchJson('/api/auth/register/donneur', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  // --- logout() : appel serveur (pour audit) + nettoyage local ----
  async function logout() {
    try {
      await fetchJson('/api/auth/logout', { method: 'POST' });
    } catch {
      /* on ignore - même si serveur HS, on déconnecte localement */
    }
    setToken(null);
    setUser(null);
  }

  // On met tout à disposition via le Context
  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

// --- Hook custom pour consommer le Context ---------------------------
// Permet d'écrire `const { user, logout } = useAuth();` dans n'importe quel composant.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}

// =====================================================================
// EXPLICATION POUR LA SOUTENANCE (20 secondes) :
// ---------------------------------------------------------------------
// On utilise le pattern Context de React pour partager l'état d'auth
// dans toute l'application sans "prop drilling" (passer le user de
// composant en composant). Au démarrage, on tente de récupérer
// l'utilisateur via le token JWT stocké dans localStorage : si valide,
// la session est restaurée, sinon on est déconnecté. Toutes les
// fonctions d'authentification (login, register, logout) sont
// centralisées ici. Les composants utilisent simplement `useAuth()`
// pour accéder à user, loading et aux actions.
// =====================================================================
