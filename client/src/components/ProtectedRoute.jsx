// =====================================================================
// ProtectedRoute.jsx — Garde de route côté frontend
// =====================================================================
// Englobe une page pour la rendre accessible UNIQUEMENT aux utilisateurs
// connectés (et éventuellement à certains rôles).
//
// Usage dans App.jsx :
//   <ProtectedRoute roles={['donneur']}> <AppLayout /> </ProtectedRoute>
// =====================================================================

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // --- Pendant le refresh initial, on affiche un écran de chargement ---
  // Évite un flash "redirige vers login" puis "ah non en fait il est connecté"
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
        Chargement…
      </div>
    );
  }

  // --- Pas connecté → on envoie vers /login ---
  // On garde l'URL d'origine dans state.from pour revenir après login.
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // --- Connecté mais mauvais rôle → racine (qui redirige vers son espace) ---
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // --- OK, on affiche le contenu protégé ---
  return children;
}

// =====================================================================
// EXPLICATION POUR LA SOUTENANCE (10 secondes) :
// ---------------------------------------------------------------------
// La sécurité côté front n'est qu'un confort UX : c'est le backend
// (middleware requireAuth/requireRole) qui fait la VRAIE protection.
// Ce composant évite simplement à un utilisateur non autorisé de voir
// une page vide ou cassée. Il vérifie le rôle dans le user (chargé par
// AuthContext) et redirige proprement vers /login ou /. Si l'utilisateur
// arrivait depuis une URL spécifique avant la déconnexion, on la garde
// dans `state.from` pour le ramener au bon endroit après login.
// =====================================================================
