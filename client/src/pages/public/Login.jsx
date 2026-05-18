// =====================================================================
// Login.jsx — Page de connexion
// =====================================================================
// Formulaire email/mot de passe + 3 "quick logins" pour la démo.
// Après connexion réussie, redirection vers l'espace approprié.
// =====================================================================

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

// --- Comptes de démo cliquables (gain de temps pour la soutenance) ---
// Cliquer sur un bouton remplit automatiquement email/mot de passe.
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
      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-md">
        <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>
        <p className="mt-1 text-sm text-gray-500">Accédez à votre espace HemoLink.</p>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block text-sm font-medium text-gray-700">
            Adresse email
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blood focus:ring-2 focus:ring-blood/10"
              placeholder="votre@email.com"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Mot de passe
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blood focus:ring-2 focus:ring-blood/10"
              placeholder="••••••••"
            />
          </label>

          {err && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blood py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blood-dark disabled:opacity-60"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-600">
          Pas encore inscrit ?{' '}
          <Link to="/register" className="font-medium text-blood hover:text-blood-dark">Créer un compte donneur</Link>
        </p>

        <div className="mt-6 rounded-xl border border-gray-100 bg-slate-50 p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Comptes de démo — mot de passe : Hemolink2026!</p>
          <div className="flex flex-col gap-1">
            {QUICK_LOGINS.map((q) => (
              <button
                key={q.email}
                type="button"
                onClick={() => { setEmail(q.email); setPassword('Hemolink2026!'); }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">{q.label}</span>
                <span className="ml-2 text-gray-400">{q.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// EXPLICATION POUR LA SOUTENANCE (15 secondes) :
// ---------------------------------------------------------------------
// Page très simple côté code, mais avec une astuce qui aide énormément
// la démo : les "Comptes de démo" (3 boutons) qui pré-remplissent
// email + mot de passe en 1 clic. Ça évite de retaper Hemolink2026!
// devant le jury. Après login réussi, on redirige selon le rôle :
//   • donneur → /mon-espace
//   • staff   → /staff
// Si l'utilisateur arrivait depuis une URL spécifique (ex: /staff/alertes/3)
// avant d'être déconnecté, on le ramène à cette URL (location.state.from).
// =====================================================================
