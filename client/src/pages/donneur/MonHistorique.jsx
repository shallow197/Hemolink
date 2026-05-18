import { useEffect, useState } from 'react';
import { PageHeader, KpiCard, Panel, DataTable, EmptyState } from '../../components/ui.jsx';
import { fetchJson } from '../../api';

export default function MonHistorique() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetchJson('/api/donneurs/me').then(setData).catch((e) => setErr(e.message));
  }, []);

  if (err) return <p className="hl-alert-error">{err}</p>;
  if (!data) return <p className="text-slate-500">Chargement…</p>;

  const total = data.donneur.nombre_dons || data.historique.length;
  const viesSauvees = total * 3;

  return (
    <div className="hl-page">
      <PageHeader
        title="Mon historique de dons"
        subtitle="Traçabilité complète de vos dons — données issues du CNTS"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Dons effectués" value={total} accent="border-l-blood" />
        <KpiCard label="Vies potentiellement sauvées" value={viesSauvees} accent="border-l-accent-teal" />
        <KpiCard
          label="Prochain don possible"
          value={data.eligibilite?.prochaineDateDon || 'Maintenant'}
          accent={data.eligibilite?.eligible ? 'border-l-accent-teal' : 'border-l-accent-gold'}
        />
      </div>

      <Panel title="Détail des dons">
        {data.historique.length === 0 ? (
          <EmptyState>
            Aucun don enregistré. Votre premier don sera ajouté après votre passage au CNTS.
          </EmptyState>
        ) : (
          <DataTable>
            <table className="hl-table min-w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Hôpital / Centre</th>
                  <th>Type</th>
                  <th>Poches</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {data.historique.map((h) => (
                  <tr key={h.id}>
                    <td>{new Date(h.date_don).toLocaleDateString('fr-FR')}</td>
                    <td className="font-semibold">{h.hopital_nom || h.centre_nom || '—'}</td>
                    <td>{h.type_prelevement || '—'}</td>
                    <td>{h.nombre_poches ?? '—'}</td>
                    <td className="capitalize text-slate-500">{h.statut || 'validé'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        )}
      </Panel>
    </div>
  );
}
