import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchJson } from '../../api';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function AlerteDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  const load = useCallback(() => {
    fetchJson(`/api/alertes/${id}`).then(setData).catch((e) => setErr(e.message));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function changerStatut(statut) {
    if (!confirm(`Changer le statut de l'alerte vers "${statut}" ?`)) return;
    await fetchJson(`/api/alertes/${id}/statut`, { method: 'PATCH', body: JSON.stringify({ statut }) });
    load();
  }

  if (err) return (
    <p className="text-red-700">
      {err} <Link to="/staff/alertes" className="font-medium text-blood underline">Retour</Link>
    </p>
  );
  if (!data) return <p className="text-gray-500">Chargement…</p>;

  const peutCloturer = user?.role !== 'donneur' && data.statut === 'en_cours';
  const acceptes  = data.reponses.filter((r) => r.reponse === 'accepte');
  const refus     = data.reponses.filter((r) => r.reponse === 'refuse');
  const enAttente = data.reponses.filter((r) => r.reponse === 'pas_repondu');

  return (
    <div className="space-y-6">
      <Link to="/staff/alertes" className="text-sm font-medium text-blood hover:underline">← Retour aux alertes</Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-900">Alerte #{data.id}</h2>
            <Statut s={data.statut} />
          </div>
          <p className="text-sm text-gray-500">{data.hopital_nom} — {data.hopital_ville}</p>
        </div>
        {peutCloturer && (
          <div className="flex gap-2">
            <button onClick={() => changerStatut('resolue')} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              Marquer résolue
            </button>
            <button onClick={() => changerStatut('annulee')} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Annuler
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Groupe demandé" value={data.groupe_sanguin} accent="text-blood font-bold" />
        <Stat label="Urgence" value={data.niveau_urgence} />
        <Stat label="Poches nécessaires" value={data.poches_necessaires} />
        <Stat label={`Réponses (${data.donneurs_contactes} contactés)`} value={`${acceptes.length} ✓ / ${refus.length} ✗ / ${enAttente.length} ⏳`} />
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900">Message envoyé aux donneurs</h3>
        <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-gray-700">{data.message || '—'}</p>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 font-semibold text-gray-900">
          Donneurs ayant accepté{' '}
          <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">{acceptes.length}</span>
        </h3>
        {acceptes.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun engagement pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="py-2 pr-4">Donneur</th>
                  <th className="py-2 pr-4">Groupe</th>
                  <th className="py-2 pr-4">Téléphone</th>
                  <th className="py-2 pr-4">Distance</th>
                  <th className="py-2 pr-4">Heure réponse</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {acceptes.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="py-2 pr-4 font-medium text-gray-900">{r.prenom} {r.nom}</td>
                    <td className="py-2 pr-4 text-gray-700">{r.groupe_sanguin}</td>
                    <td className="py-2 pr-4 text-gray-600">{r.telephone}</td>
                    <td className="py-2 pr-4 text-gray-500">{Number(r.distance_km || 0).toFixed(1)} km</td>
                    <td className="py-2 pr-4 text-gray-400">{new Date(r.date_reponse).toLocaleString('fr-FR')}</td>
                    <td className="py-2">
                      <a
                        href={`https://wa.me/${r.telephone.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${r.prenom}, merci d'avoir répondu à l'alerte HemoLink #${data.id}. Quand pouvez-vous passer à ${data.hopital_nom} ?`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                      >
                        WhatsApp
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 font-semibold text-gray-900">Toutes les réponses</h3>
        <div className="grid gap-2">
          {data.reponses.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 bg-slate-50 px-3 py-2 text-sm">
              <span className="text-gray-800">
                {r.prenom} {r.nom} <span className="text-gray-400">({r.groupe_sanguin}, {r.ville})</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{Number(r.distance_km || 0).toFixed(1)} km</span>
                <ReponseBadge reponse={r.reponse} />
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900">Chronologie de résolution</h3>
        <ol className="relative mt-4 space-y-4 border-l-2 border-gray-100 pl-6">
          {data.timeline?.map((t, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[25px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-blood shadow-sm" />
              <p className="text-sm font-medium text-gray-900">{t.label}</p>
              <p className="text-xs text-gray-400">{new Date(t.date).toLocaleString('fr-FR')}</p>
              <p className="text-sm text-gray-600">{t.detail}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Stat({ label, value, accent = 'text-gray-900' }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

function Statut({ s }) {
  const map = {
    en_cours: 'bg-amber-100 text-amber-700',
    resolue:  'bg-emerald-100 text-emerald-700',
    expiree:  'bg-gray-100 text-gray-500',
    annulee:  'bg-gray-100 text-gray-500',
  };
  const l = { en_cours: 'En cours', resolue: 'Résolue', expiree: 'Expirée', annulee: 'Annulée' };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[s] || 'bg-gray-100 text-gray-500'}`}>{l[s]}</span>;
}
function ReponseBadge({ reponse }) {
  const m = {
    accepte:     { c: 'bg-emerald-100 text-emerald-700', l: 'Accepté' },
    refuse:      { c: 'bg-gray-100 text-gray-600', l: 'Refusé' },
    pas_repondu: { c: 'bg-amber-100 text-amber-700', l: 'En attente' },
  };
  const v = m[reponse] || m.pas_repondu;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${v.c}`}>{v.l}</span>;
}
