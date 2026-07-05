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

  if (err) return <p className="text-red-400">{err} <Link to="/staff/alertes" className="text-red-300 underline">Retour</Link></p>;
  if (!data) return <p className="text-zinc-500">Chargement…</p>;

  const peutCloturer = user?.role !== 'donneur' && data.statut === 'en_cours';
  const acceptes = data.reponses.filter((r) => r.reponse === 'accepte');
  const refus    = data.reponses.filter((r) => r.reponse === 'refuse');
  const enAttente = data.reponses.filter((r) => r.reponse === 'pas_repondu');

  return (
    <div className="space-y-6">
      <Link to="/staff/alertes" className="text-sm text-red-400 hover:text-red-300 hover:underline">← Retour aux alertes</Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-zinc-50">Alerte #{data.id}</h2>
            <Statut s={data.statut} />
          </div>
          <p className="text-sm text-zinc-400">{data.hopital_nom} — {data.hopital_ville}</p>
        </div>
        {peutCloturer && (
          <div className="flex gap-2">
            <button onClick={() => changerStatut('resolue')} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              Marquer résolue
            </button>
            <button onClick={() => changerStatut('annulee')} className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800">
              Annuler
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Groupe demandé" value={data.groupe_sanguin} accent="text-red-300" />
        <Stat label="Urgence" value={data.niveau_urgence} />
        <Stat label="Poches nécessaires" value={data.poches_necessaires} />
        <Stat label={`Réponses (${data.donneurs_contactes} contactés)`} value={`${acceptes.length} ✓ / ${refus.length} ✗ / ${enAttente.length} ⏳`} />
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-lg shadow-black/20">
        <h3 className="font-semibold text-zinc-100">Message envoyé aux donneurs</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">{data.message || '—'}</p>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-lg shadow-black/20">
        <h3 className="mb-3 font-semibold text-zinc-100">Donneurs ayant accepté</h3>
        {acceptes.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucun engagement pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-zinc-500">
                <tr>
                  <th className="py-2 pr-4">Donneur</th>
                  <th className="py-2 pr-4">Groupe</th>
                  <th className="py-2 pr-4">Téléphone</th>
                  <th className="py-2 pr-4">Distance</th>
                  <th className="py-2 pr-4">Heure réponse</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {acceptes.map((r) => (
                  <tr key={r.id} className="border-t border-zinc-800 text-zinc-200">
                    <td className="py-2 pr-4 font-medium">{r.prenom} {r.nom}</td>
                    <td className="py-2 pr-4">{r.groupe_sanguin}</td>
                    <td className="py-2 pr-4 text-zinc-300">{r.telephone}</td>
                    <td className="py-2 pr-4 text-zinc-400">{Number(r.distance_km || 0).toFixed(1)} km</td>
                    <td className="py-2 pr-4 text-zinc-500">{new Date(r.date_reponse).toLocaleString('fr-FR')}</td>
                    <td className="py-2">
                      <a href={`https://wa.me/${r.telephone.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${r.prenom}, merci d'avoir répondu à l'alerte HemoLink #${data.id}. Quand pouvez-vous passer à ${data.hopital_nom} ?`)}`} target="_blank" rel="noreferrer"
                         className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700">
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

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-lg shadow-black/20">
        <h3 className="mb-3 font-semibold text-zinc-100">Toutes les réponses</h3>
        <div className="grid gap-2">
          {data.reponses.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm">
              <span className="text-zinc-200">
                {r.prenom} {r.nom} <span className="text-zinc-500">({r.groupe_sanguin}, {r.ville})</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-xs text-zinc-500">{Number(r.distance_km || 0).toFixed(1)} km</span>
                <ReponseBadge reponse={r.reponse} />
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-lg shadow-black/20">
        <h3 className="font-semibold text-zinc-100">Chronologie de résolution</h3>
        <ol className="relative mt-4 space-y-4 border-l border-zinc-700 pl-6">
          {data.timeline?.map((t, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[25px] top-1.5 h-3 w-3 rounded-full border-2 border-zinc-900 bg-blood shadow" />
              <p className="text-sm font-medium text-zinc-100">{t.label}</p>
              <p className="text-xs text-zinc-500">{new Date(t.date).toLocaleString('fr-FR')}</p>
              <p className="text-sm text-zinc-400">{t.detail}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Stat({ label, value, accent = 'text-zinc-50' }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs uppercase text-zinc-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

function Statut({ s }) {
  const map = {
    en_cours: 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30',
    resolue:  'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30',
    expiree:  'bg-zinc-700 text-zinc-300 ring-1 ring-zinc-600',
    annulee:  'bg-zinc-700 text-zinc-300 ring-1 ring-zinc-600',
  };
  const l = { en_cours: 'En cours', resolue: 'Résolue', expiree: 'Expirée', annulee: 'Annulée' };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[s]}`}>{l[s]}</span>;
}
function ReponseBadge({ reponse }) {
  const m = {
    accepte:     'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30',
    refuse:      'bg-zinc-700 text-zinc-300',
    pas_repondu: 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30',
  };
  const l = { accepte: 'Accepté', refuse: 'Refusé', pas_repondu: 'En attente' };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m[reponse]}`}>{l[reponse]}</span>;
}
