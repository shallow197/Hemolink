import { useCallback, useEffect, useState } from 'react';
import { fetchJson } from '../../api';
import { usePoll } from '../../hooks/usePoll.js';

export default function MesAlertes() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchJson('/api/alertes/mes');
      setRows(data);
    } catch (e) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  usePoll(load, 20000, [load]);

  async function repondre(alerteId, reponse) {
    setBusy(alerteId);
    try {
      await fetchJson(`/api/alertes/${alerteId}/repondre`, {
        method: 'POST',
        body: JSON.stringify({ reponse }),
      });
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  }

  const enAttente = rows.filter((a) => a.reponse === 'pas_repondu' && a.statut === 'en_cours');
  const historique = rows.filter((a) => a.reponse !== 'pas_repondu' || a.statut !== 'en_cours');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-50">Mes alertes</h2>
        <p className="text-sm text-zinc-400">Appels au don reçus dans votre zone</p>
      </div>

      {err && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">{err}</div>
      )}

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Réponses attendues ({enAttente.length})</h3>
        {enAttente.length === 0 ? (
          <p className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center text-sm text-zinc-500">
            Aucune alerte ne vous attend pour le moment. Merci d'être disponible ❤
          </p>
        ) : (
          <div className="space-y-3">
            {enAttente.map((a) => (
              <article key={a.reponse_id} className="rounded-2xl border-2 border-red-700 bg-red-950/20 p-5 shadow-lg shadow-red-900/20">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <UrgenceBadge niveau={a.niveau_urgence} />
                    <h4 className="mt-2 text-lg font-bold text-zinc-50">
                      {a.hopital_nom} — {a.groupe_sanguin}
                    </h4>
                    <p className="text-sm text-zinc-400">
                      {a.hopital_ville} · {Number(a.distance_km || 0).toFixed(1)} km de chez vous
                    </p>
                    {a.message && <p className="mt-3 rounded-lg bg-zinc-900/60 p-3 text-sm text-zinc-300">"{a.message}"</p>}
                    <p className="mt-2 text-xs text-zinc-500">
                      Reçue {new Date(a.date_notification).toLocaleString('fr-FR')} · Contact : <a href={`tel:${a.hopital_tel}`} className="text-red-300 hover:underline">{a.hopital_tel}</a>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => repondre(a.alerte_id, 'accepte')}
                      disabled={busy === a.alerte_id}
                      className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 disabled:opacity-60"
                    >
                      ✓ J'accepte
                    </button>
                    <button
                      onClick={() => repondre(a.alerte_id, 'refuse')}
                      disabled={busy === a.alerte_id}
                      className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-60"
                    >
                      Pas cette fois
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Historique ({historique.length})</h3>
        {historique.length === 0 ? (
          <p className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center text-sm text-zinc-500">
            Aucune réponse passée.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-950 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Hôpital</th>
                  <th className="px-4 py-3">Groupe</th>
                  <th className="px-4 py-3">Distance</th>
                  <th className="px-4 py-3">Ma réponse</th>
                  <th className="px-4 py-3">Statut alerte</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {historique.map((a) => (
                  <tr key={a.reponse_id} className="border-t border-zinc-800 text-zinc-200">
                    <td className="px-4 py-3 font-medium">{a.hopital_nom}</td>
                    <td className="px-4 py-3">{a.groupe_sanguin}</td>
                    <td className="px-4 py-3 text-zinc-400">{Number(a.distance_km || 0).toFixed(1)} km</td>
                    <td className="px-4 py-3"><ReponseBadge reponse={a.reponse} /></td>
                    <td className="px-4 py-3 capitalize text-zinc-400">{a.statut.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-zinc-500">{new Date(a.date_notification).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function UrgenceBadge({ niveau }) {
  const m = {
    critique: 'bg-red-600 text-white',
    urgent:   'bg-amber-500 text-zinc-900',
    normal:   'bg-zinc-700 text-zinc-200',
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${m[niveau] || m.normal}`}>{niveau}</span>;
}

function ReponseBadge({ reponse }) {
  const m = {
    accepte:     { c: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30', l: 'Accepté' },
    refuse:      { c: 'bg-zinc-700 text-zinc-300 ring-1 ring-zinc-600', l: 'Refusé' },
    pas_repondu: { c: 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30', l: 'En attente' },
  };
  const v = m[reponse] || m.pas_repondu;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${v.c}`}>{v.l}</span>;
}
