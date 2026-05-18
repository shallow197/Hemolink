// =====================================================================
// App.jsx — Table de routage de l'application
// =====================================================================
// On utilise react-router-dom v6. Trois grandes zones :
//   1. Public  (landing, login, register, devenir donneur)
//   2. Donneur (mon espace, mes alertes, mon profil, historique)
//   3. Staff   (dashboard, donneurs, hôpitaux, alertes, vue CNTS)
//
// Les zones 2 et 3 sont protégées par ProtectedRoute qui vérifie le rôle.
// =====================================================================

import { Routes, Route, Navigate } from 'react-router-dom';

import PublicLayout from './layout/PublicLayout.jsx';
import AppLayout from './layout/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// --- Pages publiques (accessibles sans connexion) ---
import Landing from './pages/public/Landing.jsx';
import Login from './pages/public/Login.jsx';
import Register from './pages/public/Register.jsx';
import DevenirDonneur from './pages/public/DevenirDonneur.jsx';

// --- Pages staff (hopital, cnts, admin) ---
import Dashboard from './pages/staff/Dashboard.jsx';
import Donneurs from './pages/staff/Donneurs.jsx';
import Hopitaux from './pages/staff/Hopitaux.jsx';
import Alertes from './pages/staff/Alertes.jsx';
import AlerteDetail from './pages/staff/AlerteDetail.jsx';
import CntsNational from './pages/staff/CntsNational.jsx';

// --- Pages donneur (rôle 'donneur' uniquement) ---
import DonneurDashboard from './pages/donneur/DonneurDashboard.jsx';
import MesAlertes from './pages/donneur/MesAlertes.jsx';
import MonProfil from './pages/donneur/MonProfil.jsx';
import MonHistorique from './pages/donneur/MonHistorique.jsx';

import { useAuth } from './contexts/AuthContext.jsx';

// --- Redirection intelligente depuis la racine ------------------------
// "/" envoie automatiquement vers la bonne page selon l'état de connexion :
//   • non connecté → /accueil (landing publique)
//   • donneur      → /mon-espace
//   • staff        → /staff
function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;                              // attend le refresh initial
  if (!user) return <Navigate to="/accueil" replace />;
  if (user.role === 'donneur') return <Navigate to="/mon-espace" replace />;
  return <Navigate to="/staff" replace />;
}

// --- Table de routage principale --------------------------------------
export default function App() {
  return (
    <Routes>
      {/* Racine = redirection conditionnelle */}
      <Route path="/" element={<HomeRedirect />} />

      {/* ----- ZONE 1 : ROUTES PUBLIQUES (PublicLayout) ----- */}
      <Route element={<PublicLayout />}>
        <Route path="/accueil" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/devenir-donneur" element={<DevenirDonneur />} />
      </Route>

      {/* ----- ZONE 2 : ESPACE DONNEUR (protégé, rôle 'donneur') ----- */}
      <Route
        element={
          <ProtectedRoute roles={['donneur']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/mon-espace" element={<DonneurDashboard />} />
        <Route path="/mon-espace/alertes" element={<MesAlertes />} />
        <Route path="/mon-espace/profil" element={<MonProfil />} />
        <Route path="/mon-espace/historique" element={<MonHistorique />} />
      </Route>

      {/* ----- ZONE 3 : ESPACE STAFF (protégé, rôles staff) ----- */}
      <Route
        element={
          <ProtectedRoute roles={['hopital', 'cnts', 'admin']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/staff" element={<Dashboard />} />
        <Route path="/staff/donneurs" element={<Donneurs />} />
        <Route path="/staff/hopitaux" element={<Hopitaux />} />
        <Route path="/staff/alertes" element={<Alertes />} />
        <Route path="/staff/alertes/:id" element={<AlerteDetail />} />
        <Route path="/staff/cnts" element={<CntsNational />} />
      </Route>

      {/* 404 — toute URL inconnue renvoie à la racine */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// =====================================================================
// EXPLICATION POUR LA SOUTENANCE (20 secondes) :
// ---------------------------------------------------------------------
// C'est la carte mentale de l'app : 3 zones de routes (public, donneur,
// staff) chacune avec son propre layout (en-tête, menu de navigation).
// Le composant ProtectedRoute vérifie le rôle et redirige automatiquement
// si l'utilisateur n'a pas le droit d'accès. Le composant HomeRedirect
// envoie chaque utilisateur sur SA page d'accueil après connexion :
// Aminata (donneur) atterrit sur /mon-espace, le staff de Fann sur /staff,
// le CNTS sur /staff (avec menu enrichi). Le route /staff/alertes/:id
// montre comment on gère les URLs dynamiques avec react-router.
// =====================================================================
