// =====================================================================
// Login.jsx — Page de connexion
// =====================================================================

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

const QUICK_LOGINS = [
  { label: 'Donneuse Aminata (O-)', email: 'aminata@example.sn', role: 'donneur' },
  { label: 'Staff CHNU Fann', email: 'fann@hemolink.sn', role: 'hopital' },
  { label: 'CNTS Dakar', email: 'cnts@hemolink.sn', role: 'cnts' },
];

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const user = await login(email.trim(), password);
      if (from) nav(from, { replace: true });
      else nav(user.role === 'donneur' ? '/mon-espace' : '/staff', { replace: true });
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card">
        <div className="bg-gradient-to-br from-brand-navy to-brand-navy-light px-8 py-8 text-center text-white">
          <Logo className="mx-auto h-14 w-14" />
          <h1 className="mt-4 font-display text-2xl font-bold">Connexion</h1>
          <p className="mt-1 text-sm text-slate-300">Accédez à votre espace HemoLink</p>
        </div>

        <div className="p-8">
          <form className="space-y-4" onSubmit={submit}>
            <label className="block text-sm font-semibold text-brand-navy">
              Adresse email
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="hl-input"
                placeholder="votre@email.com"
              />
            </label>
            <label className="block text-sm font-semibold text-brand-navy">
              Mot de passe
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="hl-input"
                placeholder="••••••••"
              />
            </label>

            {err && <p className="hl-alert-error">{err}</p>}

            <button type="submit" disabled={loading} className="hl-btn-primary w-full py-3">
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Pas encore inscrit ?{' '}
            <Link to="/register" className="font-semibold text-blood hover:text-blood-dark">
              Créer un compte donneur
            </Link>
          </p>

          <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Comptes démo — mot de passe : Hemolink2026!
            </p>
            <div className="flex flex-col gap-2">
              {QUICK_LOGINS.map((q) => (
                <button
                  key={q.email}
                  type="button"
                  onClick={() => {
                    setEmail(q.email);
                    setPassword('Hemolink2026!');
                  }}
                  className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-left text-xs transition-colors hover:border-blood/30 hover:bg-blood-light/50"
                >
                  <span className="font-semibold text-brand-navy">{q.label}</span>
                  <span className="ml-2 text-slate-400">{q.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
