// =====================================================================
// AppLayout.jsx — Mise en page des espaces connectés (donneur + staff)
// =====================================================================

import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import NotificationBell from '../components/NotificationBell.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { IconAlert, IconGlobe, IconHistory, IconHome, IconHospital, IconMessage, IconShield, IconUser, IconUsers } from '../components/icons.jsx';

const navDonneur = [
  { to: '/mon-espace', label: 'Tableau de bord', end: true, icon: IconHome },
  { to: '/mon-espace/alertes', label: 'Mes alertes', icon: IconAlert },
  { to: '/mon-espace/historique', label: 'Historique', icon: IconHistory },
  { to: '/mon-espace/profil', label: 'Mon profil', icon: IconUser },
  { to: '/mon-espace/droits', label: 'Mes droits', icon: IconShield },
];

const navStaff = [
  { to: '/staff', label: 'Tableau de bord', end: true, icon: IconHome },
  { to: '/staff/donneurs', label: 'Donneurs', icon: IconUsers },
  { to: '/staff/hopitaux', label: 'Hôpitaux & stocks', icon: IconHospital },
  { to: '/staff/alertes', label: 'Alertes', icon: IconAlert },
];

const navCnts = [
  ...navStaff,
  { to: '/staff/cnts', label: 'Vue nationale CNTS', icon: IconGlobe },
  { to: '/staff/sms', label: 'File SMS', icon: IconMessage },
];

export default function AppLayout() {
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
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-3 px-4 py-2.5">
          <Link to="/" className="group flex shrink-0 items-center gap-3">
            <Logo className="h-10 w-10 transition-transform group-hover:scale-105" />
            <div>
              <h1 className="font-display text-base font-bold tracking-tight text-brand-navy">HemoLink</h1>
              <p className="text-xs font-medium text-slate-500">{subtitle}</p>
            </div>
          </Link>
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto md:flex">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={navCls}>
                <n.icon className="h-4 w-4" />
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden h-5 w-px shrink-0 self-center bg-slate-200 md:mx-1 md:block" aria-hidden />
          <div className="flex shrink-0 items-center gap-1.5">
            <NotificationBell />
            <NavLink
              to="/assistant"
              className={({ isActive }) =>
                `hl-header-pill border-blood bg-blood text-white hover:bg-blood-dark ${isActive ? 'ring-2 ring-blood/30' : ''}`
              }
            >
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
              Assistant IA
            </NavLink>
            <p className="hl-header-pill hidden max-w-[140px] truncate text-slate-600 sm:flex">{user?.email}</p>
            <button type="button" onClick={handleLogout} className="hl-header-pill text-slate-600 hover:bg-slate-50 hover:text-blood">
              Se déconnecter
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
        <main className="hl-app-main flex-1">
          <div className="hl-app-inner mx-auto w-full max-w-[1320px] px-4 py-8">
            <Outlet />
          </div>
        </main>
        <Link
          to="/assistant"
          className="fixed bottom-6 right-4 z-40 hl-btn-primary rounded-full px-5 py-3 shadow-glow md:hidden"
        >
          Assistant IA
        </Link>
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
