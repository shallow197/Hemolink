import { useCallback, useEffect, useState } from 'react';
import {
  PageHeader,
  SectionHeading,
  DataTable,
  UrgenceBadge,
  ReponseBadge,
  EmptyState,
} from '../../components/ui.jsx';
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

  useEffect(() => {
    load();
  }, [load]);
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
    <div className="hl-page">
      <PageHeader title="Mes alertes" subtitle="Appels au don reçus dans votre zone" />

      {err && <p className="hl-alert-error">{err}</p>}

      <section>
        <SectionHeading label="Action requise" title={`Réponses attendues (${enAttente.length})`} className="mb-5" />
        {enAttente.length === 0 ? (
          <EmptyState>Aucune alerte ne vous attend. Merci de rester disponible.</EmptyState>
        ) : (
          <div className="space-y-4">
            {enAttente.map((a) => (
              <article key={a.reponse_id} className="hl-alert-urgent">
                <div className="hl-alert-urgent-bar" />
                <div className="p-5 md:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <UrgenceBadge niveau={a.niveau_urgence} />
                      <h4 className="mt-3 font-display text-xl font-bold text-brand-navy">
                        {a.hopital_nom} — {a.groupe_sanguin}
                      </h4>
                      <p className="mt-1 text-sm text-slate-600">
                        {a.hopital_ville} · {Number(a.distance_km || 0).toFixed(1)} km
                      </p>
                      {a.message && (
                        <p className="mt-4 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm italic text-slate-700">
                          « {a.message} »
                        </p>
                      )}
                      <p className="mt-3 text-xs text-slate-500">
                        Reçue {new Date(a.date_notification).toLocaleString('fr-FR')} ·{' '}
                        <a href={`tel:${a.hopital_tel}`} className="font-semibold text-blood hover:underline">
                          {a.hopital_tel}
                        </a>
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => repondre(a.alerte_id, 'accepte')}
                        disabled={busy === a.alerte_id}
                        className="hl-btn-success px-6"
                      >
                        J&apos;accepte
                      </button>
                      <button
                        type="button"
                        onClick={() => repondre(a.alerte_id, 'refuse')}
                        disabled={busy === a.alerte_id}
                        className="hl-btn-danger-ghost px-6"
                      >
                        Pas cette fois
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeading label="Archives" title={`Historique (${historique.length})`} className="mb-5" />
        <DataTable empty={!historique.length} emptyMessage="Aucune réponse passée">
          <table className="hl-table min-w-full">
            <thead>
              <tr>
                <th>Hôpital</th>
                <th>Groupe</th>
                <th>Distance</th>
                <th>Ma réponse</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {historique.map((a) => (
                <tr key={a.reponse_id}>
                  <td className="font-semibold">{a.hopital_nom}</td>
                  <td>{a.groupe_sanguin}</td>
                  <td className="text-slate-500">{Number(a.distance_km || 0).toFixed(1)} km</td>
                  <td>
                    <ReponseBadge reponse={a.reponse} />
                  </td>
                  <td className="capitalize text-slate-500">{a.statut.replace('_', ' ')}</td>
                  <td className="text-slate-400">{new Date(a.date_notification).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      </section>
    </div>
  );
}
