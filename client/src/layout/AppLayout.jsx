import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

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

const navCnts = [...navStaff, { to: '/staff/cnts', label: 'Vue nationale CNTS' }];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const nav = user?.role === 'donneur' ? navDonneur : user?.role === 'cnts' || user?.role === 'admin' ? navCnts : navStaff;

  const subtitle =
    user?.role === 'donneur' ? `Donneur · ${user?.donneur?.groupe_sanguin ?? '—'}` :
    user?.role === 'cnts'    ? 'CNTS · vue nationale' :
    user?.role === 'admin'   ? 'Administration' :
                               (user?.hopital?.nom || 'Personnel hospitalier');

  async function handleLogout() {
    await logout();
    navigate('/accueil');
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/95 shadow-lg shadow-black/40 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <Logo className="h-11 w-11" />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-zinc-50">HemoLink</h1>
              <p className="text-xs text-zinc-400">{subtitle}</p>
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
                    isActive ? 'bg-red-950/50 text-red-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <NavLink
              to="/assistant"
              className={({ isActive }) =>
                `rounded-lg border border-red-900/50 bg-zinc-900 px-3 py-2 text-sm font-medium hover:bg-red-950/30 hover:text-red-300 ${
                  isActive ? 'text-red-300' : 'text-red-400'
                }`
              }
            >
              Assistant IA
            </NavLink>
            <div className="hidden text-right text-xs text-zinc-400 sm:block">
              <p className="font-medium text-zinc-200">{user?.email}</p>
              <button onClick={handleLogout} className="hover:text-red-300">Se déconnecter</button>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-300 sm:hidden"
            >
              Sortir
            </button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto border-t border-zinc-800 px-4 py-2 md:hidden">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${
                  isActive ? 'bg-red-950/50 text-red-400' : 'text-zinc-400'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </div>
      </header>

      <div className="relative flex">
        <main className="mx-auto min-h-[calc(100vh-64px)] w-full max-w-[1600px] flex-1 px-4 py-6">
          <Outlet />
        </main>
        <Link
          to="/assistant"
          className="fixed bottom-6 right-4 z-40 rounded-full border border-red-900/40 bg-blood px-4 py-3 text-sm font-medium text-white shadow-lg shadow-blood/20 hover:bg-blood-dark md:hidden"
        >
          Assistant
        </Link>
      </div>
    </div>
  );
}
