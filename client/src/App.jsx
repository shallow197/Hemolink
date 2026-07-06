import { Routes, Route, Navigate } from 'react-router-dom';

import PublicLayout from './layout/PublicLayout.jsx';
import AppLayout from './layout/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Public
import Landing from './pages/public/Landing.jsx';
import Login from './pages/public/Login.jsx';
import Register from './pages/public/Register.jsx';
import DevenirDonneur from './pages/public/DevenirDonneur.jsx';

// Staff (hopital, cnts, admin)
import Dashboard from './pages/staff/Dashboard.jsx';
import Donneurs from './pages/staff/Donneurs.jsx';
import Hopitaux from './pages/staff/Hopitaux.jsx';
import Alertes from './pages/staff/Alertes.jsx';
import AlerteDetail from './pages/staff/AlerteDetail.jsx';
import CntsNational from './pages/staff/CntsNational.jsx';

// Donneur
import DonneurDashboard from './pages/donneur/DonneurDashboard.jsx';
import MesAlertes from './pages/donneur/MesAlertes.jsx';
import MonProfil from './pages/donneur/MonProfil.jsx';
import MonHistorique from './pages/donneur/MonHistorique.jsx';

// Assistant IA
import AssistantPage from './pages/assistant/AssistantPage.jsx';

import { useAuth } from './contexts/AuthContext.jsx';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/accueil" replace />;
  if (user.role === 'donneur') return <Navigate to="/mon-espace" replace />;
  return <Navigate to="/staff" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      {/* Routes publiques */}
      <Route element={<PublicLayout />}>
        <Route path="/accueil" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/devenir-donneur" element={<DevenirDonneur />} />
      </Route>

      {/* Espace donneur */}
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

      {/* Espace staff (hopital, cnts, admin) */}
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

      {/* Assistant IA — accessible à tout utilisateur authentifié */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/assistant" element={<AssistantPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
