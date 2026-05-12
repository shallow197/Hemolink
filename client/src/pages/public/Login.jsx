import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

const QUICK_LOGINS = [
  { label: 'Donneuse Aminata (O-)',  email: 'aminata@example.sn',   role: 'donneur' },
  { label: 'Staff CHNU Fann',         email: 'fann@hemolink.sn',     role: 'hopital' },
  { label: 'CNTS Dakar',              email: 'cnts@hemolink.sn',     role: 'cnts' },
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
    <div className="mx-auto max-w-md">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl shadow-black/30">
        <h1 className="text-2xl font-bold text-zinc-50">Connexion</h1>
        <p className="mt-1 text-sm text-zinc-400">Accédez à votre espace HemoLink.</p>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block text-xs font-medium text-zinc-400">
            Adresse email
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-red-800 focus:ring-2 focus:ring-red-900/40"
              placeholder="votre@email.com"
            />
          </label>
          <label className="block text-xs font-medium text-zinc-400">
            Mot de passe
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-red-800 focus:ring-2 focus:ring-red-900/40"
              placeholder="••••••••"
            />
          </label>

          {err && (
            <p className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {err}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blood py-2.5 text-sm font-semibold text-white shadow-md shadow-blood/20 hover:bg-blood-dark disabled:opacity-60"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-400">
          Pas encore inscrit ?{' '}
          <Link to="/register" className="text-red-300 hover:text-red-200">Créer un compte donneur</Link>
        </p>

        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">Comptes de démo (mot de passe : Hemolink2026!)</p>
          <div className="flex flex-col gap-1">
            {QUICK_LOGINS.map((q) => (
              <button
                key={q.email}
                type="button"
                onClick={() => { setEmail(q.email); setPassword('Hemolink2026!'); }}
                className="rounded-lg border border-zinc-800 px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800"
              >
                <span className="font-medium text-zinc-100">{q.label}</span>
                <span className="ml-2 text-zinc-500">{q.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
