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
  const [stats, setStats] = useState([]);
  const [filtre, setFiltre] = useState('');

  const load = useCallback(async () => {
    const [data, s] = await Promise.all([
      fetchJson('/api/alertes'),
      fetchJson('/api/alertes/stats-mensuelles').catch(() => []),
    ]);
    setRows(data);
    setStats(s || []);
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

      <StatsMensuelles stats={stats} />

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

// =====================================================================
// Graph résolution mensuelle (6 derniers mois)
// =====================================================================
function StatsMensuelles({ stats }) {
  if (!stats || stats.length === 0) return null;
  const maxTotal = Math.max(1, ...stats.map(s => Number(s.total)));
  const totalGlobal = stats.reduce((s, x) => s + Number(x.total), 0);
  const resGlobal = stats.reduce((s, x) => s + Number(x.resolues), 0);
  const tauxGlobal = totalGlobal ? Math.round((resGlobal / totalGlobal) * 100) : 0;

  const moisFmt = (m) => {
    const [y, mm] = m.split('-');
    const names = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${names[Number(mm) - 1]} ${y.slice(2)}`;
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-brand-navy">Activité — 6 derniers mois</h3>
          <p className="text-xs text-gray-500">Taux de résolution global : <strong className="text-emerald-600">{tauxGlobal}%</strong> ({resGlobal}/{totalGlobal})</p>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-400" /> Total</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-500" /> Résolues</span>
        </div>
      </div>
      <div className="flex items-end justify-around gap-2 border-b border-gray-100 pb-3">
        {stats.map(s => {
          const total = Number(s.total);
          const res = Number(s.resolues);
          const hTot = (total / maxTotal) * 100;
          const hRes = (res / maxTotal) * 100;
          const taux = total ? Math.round((res / total) * 100) : 0;
          return (
            <div key={s.mois} className="flex flex-1 flex-col items-center gap-1" title={`${taux}% résolues`}>
              <p className="text-[10px] font-bold text-emerald-700">{taux}%</p>
              <div className="relative flex h-24 w-full max-w-[40px] items-end justify-center gap-0.5">
                <div className="w-4 rounded-t bg-amber-400" style={{ height: `${hTot}%` }} />
                <div className="w-4 rounded-t bg-emerald-500" style={{ height: `${hRes}%` }} />
              </div>
              <p className="mt-1 text-[10px] text-gray-500">{moisFmt(s.mois)}</p>
              <p className="text-[10px] font-bold text-gray-700">{total}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
