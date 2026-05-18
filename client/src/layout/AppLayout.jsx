// =====================================================================
// AppLayout.jsx — Mise en page des espaces connectés (donneur + staff)
// =====================================================================
// Header sticky + barre de navigation qui s'ADAPTE au rôle :
//   • donneur → Tableau de bord, Mes alertes, Historique, Profil
//   • hôpital → Tableau de bord, Donneurs, Hôpitaux & stocks, Alertes
//   • cnts    → idem hôpital + "Vue nationale CNTS"
// Le contenu de chaque page apparaît dans <Outlet /> (react-router).
// Une sidebar Assistant IA peut être ouverte/fermée.
// =====================================================================

import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Logo from '../components/Logo.jsx';
import AiSidebar from '../components/AiSidebar.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

// --- Trois définitions de navigation, une par "famille" de rôles ----
const navDonneur = [
  { to: '/mon-espace',           label: 'Tableau de bord', end: true },
  { to: '/mon-espace/alertes',   label: 'Mes alertes' },
  { to: '/mon-espace/historique', label: 'Historique' },
  { to: '/mon-espace/profil',    label: 'Mon profil' },
];

const navStaff = [
  { to: '/staff',           label: 'Tableau de bord', end: true },
  { to: '/staff/donneurs',  label: 'Donneurs' },
  { to: '/staff/hopitaux',  label: 'Hôpitaux & stocks' },
  { to: '/staff/alertes',   label: 'Alertes' },
];

// Le CNTS voit la même chose que le staff hôpital + un onglet exclusif
const navCnts = [...navStaff, { to: '/staff/cnts', label: 'Vue nationale CNTS' }];

export default function AppLayout() {
  // État local pour la sidebar Assistant IA (fermée par défaut)
  const [aiOpen, setAiOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // --- Sélection dynamique du menu en fonction du rôle de l'utilisateur ---
  const nav = user?.role === 'donneur' ? navDonneur : user?.role === 'cnts' || user?.role === 'admin' ? navCnts : navStaff;

  const subtitle =
    user?.role === 'donneur' ? `Donneur · ${user?.donneur?.groupe_sanguin ?? '—'}` :
    user?.role === 'cnts'    ? 'CNTS · vue nationale' :
    user?.role === 'admin'   ? 'Administration' :
                               (user?.hopital?.nom || 'Personnel hospitalier');

  // --- Déconnexion + redirection vers la landing publique ---
  async function handleLogout() {
    await logout();
    navigate('/accueil');
  }

  return (
    // ===== RENDU =====
    // Structure : [Header sticky avec logo + nav + bouton IA + déconnexion]
    //             [Zone principale = <Outlet /> (page courante)]
    //             [Sidebar Assistant IA (slide-in à droite)]
    <div className="min-h-screen bg-slate-50 text-gray-900">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <Logo className="h-9 w-9" />
            <div>
              <h1 className="text-base font-bold tracking-tight text-gray-900">HemoLink</h1>
              <p className="text-xs text-gray-500">{subtitle}</p>
            </div>
          </Link>
          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-red-50 text-blood' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAiOpen((v) => !v)}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-blood hover:bg-red-100"
            >
              Assistant IA
            </button>
            <div className="hidden text-right text-xs text-gray-500 sm:block">
              <p className="font-medium text-gray-800">{user?.email}</p>
              <button onClick={handleLogout} className="hover:text-blood">Se déconnecter</button>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 sm:hidden"
            >
              Sortir
            </button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto border-t border-gray-100 px-4 py-2 md:hidden">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${
                  isActive ? 'bg-red-50 text-blood' : 'text-gray-600'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </div>
      </header>

      <div className="relative flex">
        <main
          className={`mx-auto min-h-[calc(100vh-64px)] w-full max-w-[1600px] flex-1 px-4 py-6 transition-[padding] ${aiOpen ? 'md:pr-[380px]' : ''}`}
        >
          <Outlet />
        </main>
        <AiSidebar open={aiOpen} onToggle={() => setAiOpen(false)} />
        {!aiOpen && (
          <button
            type="button"
            onClick={() => setAiOpen(true)}
            className="fixed bottom-6 right-4 z-40 rounded-full bg-blood px-4 py-3 text-sm font-medium text-white shadow-lg shadow-blood/20 hover:bg-blood-dark md:hidden"
          >
            Assistant
          </button>
        )}
      </div>
    </div>
  );
}

// =====================================================================
// EXPLICATION POUR LA SOUTENANCE (20 secondes) :
// ---------------------------------------------------------------------
// Ce layout est partagé par tous les espaces connectés. La magie est
// dans la sélection du menu : on lit le rôle depuis useAuth() et on
// affiche le menu adapté. Un donneur ne voit JAMAIS les onglets staff,
// un staff hôpital ne voit JAMAIS l'onglet CNTS — c'est une expérience
// utilisateur taillée pour chaque persona. Le sous-titre dans le header
// est aussi dynamique : "Donneur · O-" pour Aminata, "CHNU Fann" pour
// le staff Fann, "CNTS · vue nationale" pour le CNTS. L'Assistant IA est
// toujours accessible via un bouton dans le header (sidebar slide-in).
// =====================================================================
