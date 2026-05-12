import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJson } from '../../api';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function DonneurDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [mes, setMes] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    Promise.all([
      fetchJson('/api/donneurs/me'),
      fetchJson('/api/alertes/mes'),
    ])
      .then(([d, a]) => { setData(d); setMes(a); })
      .catch((e) => setErr(e.message));
  }, []);

  const alertesEnAttente = mes.filter((a) => a.reponse === 'pas_repondu' && a.statut === 'en_cours');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-50">
          Bienvenue, {data?.donneur?.prenom || user?.email} 👋
        </h2>
        <p className="text-sm text-zinc-400">Votre tableau de bord donneur HemoLink</p>
      </div>

      {err && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      {alertesEnAttente.length > 0 && (
        <div className="rounded-2xl border-2 border-red-700 bg-red-950/30 p-5 shadow-lg shadow-red-900/30">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-red-300">⚠ Alerte en attente de votre réponse</p>
              <h3 className="mt-1 text-lg font-bold text-zinc-50">
                {alertesEnAttente.length} appel{alertesEnAttente.length > 1 ? 's' : ''} au don à proximité
              </h3>
              <p className="mt-1 text-sm text-zinc-300">
                Un hôpital cherche du sang {alertesEnAttente[0].groupe_sanguin} — votre groupe {data?.donneur?.groupe_sanguin} est compatible.
              </p>
            </div>
            <Link to="/mon-espace/alertes" className="rounded-xl bg-blood px-4 py-2 text-sm font-semibold text-white hover:bg-blood-dark">
              Voir l'alerte →
            </Link>
          </div>
        </div>
      )}

      {/* Profil + éligibilité */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Groupe sanguin" value={data?.donneur?.groupe_sanguin ?? '—'} sub={
          data?.donneur?.groupe_sanguin?.endsWith('-')
            ? <span className="text-red-300">Groupe rare — précieux ❤</span>
            : 'Groupe courant'
        } />
        <Card
          title="Statut éligibilité"
          value={data?.eligibilite?.eligible ? '✓ Éligible' : '⚠ Indisponible'}
          accent={data?.eligibilite?.eligible ? 'text-emerald-300' : 'text-amber-300'}
          sub={data?.eligibilite?.prochaineDateDon ? `Prochain don : ${data.eligibilite.prochaineDateDon}` : 'Aucun don enregistré'}
        />
        <Card
          title="Mes dons effectués"
          value={data?.donneur?.nombre_dons ?? 0}
          sub={`${(data?.donneur?.nombre_dons ?? 0) * 3} vies potentiellement sauvées`}
        />
      </div>

      {/* Raisons d'inéligibilité */}
      {data && !data.eligibilite.eligible && data.eligibilite.raisons?.length > 0 && (
        <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-5">
          <p className="text-sm font-semibold text-amber-300">Pourquoi vous n'êtes pas éligible actuellement</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">
            {data.eligibilite.raisons.map((r, i) => <li key={i}>• {r}</li>)}
          </ul>
        </div>
      )}

      {/* Récent */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-100">Mes alertes récentes</h3>
          <Link to="/mon-espace/alertes" className="text-xs text-red-300 hover:text-red-200">Voir tout →</Link>
        </div>
        {mes.length === 0 ? (
          <p className="mt-4 text-center text-sm text-zinc-500">Aucune alerte reçue pour le moment.</p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-800">
            {mes.slice(0, 5).map((a) => (
              <li key={a.reponse_id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-100">
                    {a.hopital_nom} <span className="text-zinc-500">— {a.groupe_sanguin}</span>
                  </p>
                  <p className="text-xs text-zinc-500">
                    {a.niveau_urgence} · {Number(a.distance_km || 0).toFixed(1)} km · {new Date(a.date_notification).toLocaleString('fr-FR')}
                  </p>
                </div>
                <ReponseBadge reponse={a.reponse} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Card({ title, value, sub, accent = 'text-zinc-50' }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}

function ReponseBadge({ reponse }) {
  const map = {
    accepte:     { c: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30', l: 'Accepté' },
    refuse:      { c: 'bg-zinc-700 text-zinc-300 ring-1 ring-zinc-600', l: 'Refusé' },
    pas_repondu: { c: 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30', l: 'En attente' },
  };
  const v = map[reponse] || map.pas_repondu;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${v.c}`}>{v.l}</span>;
}
