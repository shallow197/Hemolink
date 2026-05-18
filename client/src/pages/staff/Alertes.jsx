import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PageHeader,
  FilterChip,
  DataTable,
  BloodGroupBadge,
  UrgenceBadge,
  AlerteStatutBadge,
} from '../../components/ui.jsx';
import { fetchJson } from '../../api';
import { usePoll } from '../../hooks/usePoll.js';

export default function Alertes() {
  const [rows, setRows] = useState([]);
  const [filtre, setFiltre] = useState('');

  const load = useCallback(async () => {
    const data = await fetchJson('/api/alertes');
    setRows(data);
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);
  usePoll(load, 30000, [load]);

  const filtered = filtre ? rows.filter((r) => r.statut === filtre) : rows;
  const counts = {
    en_cours: rows.filter((r) => r.statut === 'en_cours').length,
    resolue: rows.filter((r) => r.statut === 'resolue').length,
    expiree: rows.filter((r) => r.statut === 'expiree').length,
    annulee: rows.filter((r) => r.statut === 'annulee').length,
  };

  return (
    <div className="hl-page">
      <PageHeader title="Historique des alertes" subtitle="Suivi des campagnes de recrutement de donneurs" />

      <div className="flex flex-wrap gap-2">
        <FilterChip active={!filtre} onClick={() => setFiltre('')}>
          Toutes ({rows.length})
        </FilterChip>
        <FilterChip active={filtre === 'en_cours'} onClick={() => setFiltre('en_cours')} variant="amber">
          En cours ({counts.en_cours})
        </FilterChip>
        <FilterChip active={filtre === 'resolue'} onClick={() => setFiltre('resolue')} variant="emerald">
          Résolues ({counts.resolue})
        </FilterChip>
        <FilterChip active={filtre === 'expiree'} onClick={() => setFiltre('expiree')}>
          Expirées ({counts.expiree})
        </FilterChip>
      </div>

      <DataTable empty={!filtered.length} emptyMessage="Aucune alerte">
        <table className="hl-table min-w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>Hôpital</th>
              <th>Groupe</th>
              <th>Urgence</th>
              <th>Contactés</th>
              <th>Acceptés</th>
              <th>Statut</th>
              <th>Date</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <td className="font-mono text-xs text-slate-400">#{a.id}</td>
                <td className="font-semibold">{a.hopital_nom}</td>
                <td>
                  <BloodGroupBadge group={a.groupe_sanguin} />
                </td>
                <td>
                  <UrgenceBadge niveau={a.niveau_urgence} />
                </td>
                <td>{a.donneurs_contactes}</td>
                <td className="font-semibold text-accent-teal">{a.donneurs_acceptes ?? a.donneurs_repondus ?? 0}</td>
                <td>
                  <AlerteStatutBadge statut={a.statut} />
                </td>
                <td className="text-slate-500">{new Date(a.date_creation).toLocaleString('fr-FR')}</td>
                <td>
                  <Link to={`/staff/alertes/${a.id}`} className="font-semibold text-blood hover:text-blood-dark">
                    Détail →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>
    </div>
  );
}
