import { Link, NavLink, Outlet } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function PublicLayout() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream bg-mesh-public">
      <div className="h-1 bg-gradient-to-r from-blood via-blood-dark to-brand-navy" aria-hidden />

      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 shadow-header backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
          <Link to="/accueil" className="group flex items-center gap-3">
            <Logo className="h-10 w-10 transition-transform group-hover:scale-105" />
            <div>
              <p className="font-display text-lg font-bold tracking-tight text-brand-navy">HemoLink</p>
              <p className="text-[11px] font-medium text-slate-500">Urgences transfusionnelles · Sénégal</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-0.5 sm:flex">
            <NavLink to="/accueil" end className={navCls}>
              Accueil
            </NavLink>
            <NavLink to="/devenir-donneur" className={navCls}>
              Devenir donneur
            </NavLink>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link
                to={user.role === 'donneur' ? '/mon-espace' : '/staff'}
                className="hl-btn-primary px-4 py-2"
              >
                Mon espace
              </Link>
            ) : (
              <>
                <Link to="/login" className="hl-btn-secondary hidden px-3 py-2 sm:inline-flex">
                  Connexion
                </Link>
                <Link to="/register" className="hl-btn-primary px-4 py-2">
                  S&apos;inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 md:py-12">
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-slate-200/80 bg-brand-navy text-slate-300">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center gap-3">
              <Logo className="h-9 w-9" />
              <div>
                <p className="font-display font-bold text-white">HemoLink</p>
                <p className="text-xs text-slate-400">Projet PPP · ESP / UCAD</p>
              </div>
            </div>
            <div className="max-w-md text-sm leading-relaxed text-slate-400">
              <p>
                Plateforme de mise en relation entre donneurs de sang et établissements de santé, en collaboration avec
                le Centre National de Transfusion Sanguine (CNTS) de Dakar.
              </p>
              <p className="mt-3 text-xs text-slate-500">
                © {new Date().getFullYear()} HemoLink. Tous droits réservés. ·{' '}
                <Link to="/cgu" className="font-semibold text-slate-300 hover:text-white underline">
                  CGU & Confidentialité
                </Link>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function navCls({ isActive }) {
  return `hl-nav-link ${isActive ? 'hl-nav-link-active' : ''}`;
}
