import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  PageHeader,
  KpiCard,
  Panel,
  DataTable,
  BloodGroupBadge,
  UrgenceBadge,
  AlerteStatutBadge,
} from '../../components/ui.jsx';
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

  useEffect(() => {
    load();
  }, [load]);

  async function changerStatut(statut) {
    if (!confirm(`Changer le statut de l'alerte vers "${statut}" ?`)) return;
    await fetchJson(`/api/alertes/${id}/statut`, { method: 'PATCH', body: JSON.stringify({ statut }) });
    load();
  }

  if (err) {
    return (
      <p className="hl-alert-error">
        {err}{' '}
        <Link to="/staff/alertes" className="font-semibold text-blood underline">
          Retour
        </Link>
      </p>
    );
  }
  if (!data) return <p className="text-slate-500">Chargement…</p>;

  const peutCloturer = user?.role !== 'donneur' && data.statut === 'en_cours';
  const acceptes = data.reponses.filter((r) => r.reponse === 'accepte');
  const refus = data.reponses.filter((r) => r.reponse === 'refuse');
  const enAttente = data.reponses.filter((r) => r.reponse === 'pas_repondu');

  return (
    <div className="hl-page">
      <Link to="/staff/alertes" className="hl-link-back">
        ← Retour aux alertes
      </Link>

      <PageHeader
        title={`Alerte #${data.id}`}
        subtitle={`${data.hopital_nom} — ${data.hopital_ville}`}
        badge={<AlerteStatutBadge statut={data.statut} />}
        actions={
          peutCloturer ? (
            <>
              <button type="button" onClick={() => changerStatut('resolue')} className="hl-btn-success">
                Marquer résolue
              </button>
              <button type="button" onClick={() => changerStatut('annulee')} className="hl-btn-danger-ghost">
                Annuler
              </button>
            </>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Groupe demandé" value={<BloodGroupBadge group={data.groupe_sanguin} />} accent="border-l-blood" />
        <KpiCard label="Urgence" value={<UrgenceBadge niveau={data.niveau_urgence} />} accent="border-l-accent-gold" />
        <KpiCard label="Poches nécessaires" value={data.poches_necessaires} accent="border-l-brand-slate" />
        <KpiCard
          label={`Réponses (${data.donneurs_contactes} contactés)`}
          value={`${acceptes.length} ✓ / ${refus.length} ✗ / ${enAttente.length} ⏳`}
          accent="border-l-accent-teal"
        />
      </div>

      <Panel title="Message envoyé aux donneurs">
        <p className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-700">
          {data.message || '—'}
        </p>
      </Panel>

      <Panel title={`Donneurs ayant accepté (${acceptes.length})`}>
        {acceptes.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun engagement pour le moment.</p>
        ) : (
          <DataTable>
            <table className="hl-table min-w-full">
              <thead>
                <tr>
                  <th>Donneur</th>
                  <th>Groupe</th>
                  <th>Téléphone</th>
                  <th>Distance</th>
                  <th>Heure</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {acceptes.map((r) => (
                  <tr key={r.id}>
                    <td className="font-semibold">
                      {r.prenom} {r.nom}
                    </td>
                    <td>
                      <BloodGroupBadge group={r.groupe_sanguin} />
                    </td>
                    <td>{r.telephone}</td>
                    <td className="text-slate-500">{Number(r.distance_km || 0).toFixed(1)} km</td>
                    <td className="text-slate-500">{new Date(r.date_reponse).toLocaleString('fr-FR')}</td>
                    <td>
                      <a
                        href={`https://wa.me/${r.telephone.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${r.prenom}, merci d'avoir répondu à l'alerte HemoLink #${data.id}. Quand pouvez-vous passer à ${data.hopital_nom} ?`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hl-btn-success px-2.5 py-1 text-xs"
                      >
                        WhatsApp
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        )}
      </Panel>

      <Panel title="Toutes les réponses">
        <DataTable empty={!data.reponses.length}>
          <table className="hl-table min-w-full">
            <thead>
              <tr>
                <th>Donneur</th>
                <th>Groupe</th>
                <th>Réponse</th>
                <th>Distance</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.reponses.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">
                    {r.prenom} {r.nom}
                  </td>
                  <td>{r.groupe_sanguin}</td>
                  <td className="capitalize">{r.reponse.replace('_', ' ')}</td>
                  <td className="text-slate-500">{Number(r.distance_km || 0).toFixed(1)} km</td>
                  <td className="text-slate-500">{new Date(r.date_reponse).toLocaleString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      </Panel>
    </div>
  );
}
