import { Link, NavLink, Outlet } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function PublicLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/accueil" className="flex items-center gap-3">
            <Logo className="h-9 w-9" />
            <div>
              <p className="text-base font-bold tracking-tight text-gray-900">HemoLink</p>
              <p className="text-[11px] text-gray-500">Urgences sang · Sénégal</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink to="/accueil" end className={navCls}>Accueil</NavLink>
            <NavLink to="/devenir-donneur" className={navCls}>Devenir donneur</NavLink>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link
                to={user.role === 'donneur' ? '/mon-espace' : '/staff'}
                className="rounded-lg bg-blood px-4 py-2 text-sm font-semibold text-white hover:bg-blood-dark"
              >
                Mon espace
              </Link>
            ) : (
              <>
                <Link to="/login" className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Connexion
                </Link>
                <Link to="/register" className="rounded-lg bg-blood px-4 py-2 text-sm font-semibold text-white hover:bg-blood-dark">
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="mx-auto max-w-6xl px-4 text-xs text-gray-500">
          <p>
            HemoLink — Projet PPP DIC1/DGI/ESP/UCAD · En collaboration avec le Centre National de Transfusion Sanguine
            (CNTS) de Dakar.
          </p>
          <p className="mt-1">© {new Date().getFullYear()} HemoLink. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}

function navCls({ isActive }) {
  return `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-red-50 text-blood' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  }`;
}
