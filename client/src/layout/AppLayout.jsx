// =====================================================================
// AppLayout.jsx — Mise en page des espaces connectés (donneur + staff)
// =====================================================================

import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Logo from '../components/Logo.jsx';
import AiSidebar from '../components/AiSidebar.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const navDonneur = [
  { to: '/mon-espace', label: 'Tableau de bord', end: true },
  { to: '/mon-espace/alertes', label: 'Mes alertes' },
  { to: '/mon-espace/historique', label: 'Historique' },
  { to: '/mon-espace/profil', label: 'Mon profil' },
];

const navStaff = [
  { to: '/staff', label: 'Tableau de bord', end: true },
  { to: '/staff/donneurs', label: 'Donneurs' },
  { to: '/staff/hopitaux', label: 'Hôpitaux & stocks' },
  { to: '/staff/alertes', label: 'Alertes' },
];

const navCnts = [...navStaff, { to: '/staff/cnts', label: 'Vue nationale CNTS' }];

export default function AppLayout() {
  const [aiOpen, setAiOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const nav = user?.role === 'donneur' ? navDonneur : user?.role === 'cnts' || user?.role === 'admin' ? navCnts : navStaff;

  const subtitle =
    user?.role === 'donneur'
      ? `Donneur · ${user?.donneur?.groupe_sanguin ?? '—'}`
      : user?.role === 'cnts'
        ? 'CNTS · vue nationale'
        : user?.role === 'admin'
          ? 'Administration'
          : user?.hopital?.nom || 'Personnel hospitalier';

  async function handleLogout() {
    await logout();
    navigate('/accueil');
  }

  return (
    <div className="min-h-screen bg-brand-cream bg-mesh-app text-brand-navy">
      <div className="h-1 bg-gradient-to-r from-brand-navy via-blood to-accent-teal" aria-hidden />

      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-header backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="group flex shrink-0 items-center gap-3">
            <Logo className="h-10 w-10 transition-transform group-hover:scale-105" />
            <div>
              <h1 className="font-display text-base font-bold tracking-tight text-brand-navy">HemoLink</h1>
              <p className="text-xs font-medium text-slate-500">{subtitle}</p>
            </div>
          </Link>
          <nav className="hidden flex-1 items-center justify-center gap-0.5 md:flex">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={navCls}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAiOpen((v) => !v)}
              className={`hl-btn-secondary border-blood/20 py-2 text-blood ${aiOpen ? 'bg-blood-light ring-2 ring-blood/20' : ''}`}
            >
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-blood" aria-hidden />
              Assistant IA
            </button>
            <div className="hidden text-right text-xs sm:block">
              <p className="max-w-[140px] truncate font-medium text-brand-navy">{user?.email}</p>
              <button type="button" onClick={handleLogout} className="font-medium text-slate-500 hover:text-blood">
                Se déconnecter
              </button>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="hl-btn-secondary px-2 py-1.5 text-xs sm:hidden"
            >
              Sortir
            </button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto border-t border-slate-100 bg-slate-50/50 px-4 py-2 md:hidden">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={navClsMobile}>
              {n.label}
            </NavLink>
          ))}
        </div>
      </header>

      <div className="relative flex">
        <main
          className={`hl-app-main flex-1 transition-[padding] ${aiOpen ? 'md:pr-[400px]' : ''}`}
        >
          <div className={`hl-app-inner mx-auto w-full max-w-[1600px] px-4 py-8 ${aiOpen ? '' : ''}`}>
            <Outlet />
          </div>
        </main>
        <AiSidebar open={aiOpen} onToggle={() => setAiOpen(false)} />
        {!aiOpen && (
          <button
            type="button"
            onClick={() => setAiOpen(true)}
            className="fixed bottom-6 right-4 z-40 hl-btn-primary rounded-full px-5 py-3 shadow-glow md:hidden"
          >
            Assistant IA
          </button>
        )}
      </div>
    </div>
  );
}

function navCls({ isActive }) {
  return `hl-nav-link ${isActive ? 'hl-nav-link-active' : ''}`;
}

function navClsMobile({ isActive }) {
  return `whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${
    isActive ? 'bg-white font-semibold text-blood shadow-sm ring-1 ring-slate-200/80' : 'text-slate-600'
  }`;
}
