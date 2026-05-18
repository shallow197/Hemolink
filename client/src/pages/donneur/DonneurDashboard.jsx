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
        <h2 className="text-2xl font-bold text-gray-900">
          Bienvenue, {data?.donneur?.prenom || user?.email}
        </h2>
        <p className="text-sm text-gray-500">Votre tableau de bord donneur HemoLink</p>
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {alertesEnAttente.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm ring-1 ring-red-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blood">Alerte en attente de votre réponse</p>
              <h3 className="mt-1 text-lg font-bold text-gray-900">
                {alertesEnAttente.length} appel{alertesEnAttente.length > 1 ? 's' : ''} au don à proximité
              </h3>
              <p className="mt-1 text-sm text-gray-700">
                Un hôpital cherche du sang {alertesEnAttente[0].groupe_sanguin} — votre groupe {data?.donneur?.groupe_sanguin} est compatible.
              </p>
            </div>
            <Link to="/mon-espace/alertes" className="flex-shrink-0 rounded-xl bg-blood px-4 py-2 text-sm font-semibold text-white hover:bg-blood-dark">
              Voir →
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Groupe sanguin" value={data?.donneur?.groupe_sanguin ?? '—'} sub={
          data?.donneur?.groupe_sanguin?.endsWith('-')
            ? <span className="font-medium text-blood">Groupe rare — précieux</span>
            : 'Groupe courant'
        } />
        <Card
          title="Statut éligibilité"
          value={data?.eligibilite?.eligible ? 'Éligible' : 'Indisponible'}
          accent={data?.eligibilite?.eligible ? 'text-emerald-700' : 'text-amber-600'}
          sub={data?.eligibilite?.prochaineDateDon ? `Prochain don : ${data.eligibilite.prochaineDateDon}` : 'Aucun don enregistré'}
        />
        <Card
          title="Mes dons effectués"
          value={data?.donneur?.nombre_dons ?? 0}
          sub={`${(data?.donneur?.nombre_dons ?? 0) * 3} vies potentiellement sauvées`}
        />
      </div>

      {data && !data.eligibilite.eligible && data.eligibilite.raisons?.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-800">Pourquoi vous n'êtes pas éligible actuellement</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-700">
            {data.eligibilite.raisons.map((r, i) => <li key={i}>· {r}</li>)}
          </ul>
        </div>
      )}

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Mes alertes récentes</h3>
          <Link to="/mon-espace/alertes" className="text-xs font-medium text-blood hover:underline">Voir tout →</Link>
        </div>
        {mes.length === 0 ? (
          <p className="mt-4 text-center text-sm text-gray-400">Aucune alerte reçue pour le moment.</p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-50">
            {mes.slice(0, 5).map((a) => (
              <li key={a.reponse_id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {a.hopital_nom} <span className="text-gray-400">— {a.groupe_sanguin}</span>
                  </p>
                  <p className="text-xs text-gray-500">
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

function Card({ title, value, sub, accent = 'text-gray-900' }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

function ReponseBadge({ reponse }) {
  const map = {
    accepte:     { c: 'bg-emerald-100 text-emerald-700', l: 'Accepté' },
    refuse:      { c: 'bg-gray-100 text-gray-600', l: 'Refusé' },
    pas_repondu: { c: 'bg-amber-100 text-amber-700', l: 'En attente' },
  };
  const v = map[reponse] || map.pas_repondu;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${v.c}`}>{v.l}</span>;
}
