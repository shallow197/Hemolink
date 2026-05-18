import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJson } from '../../api';
import { usePoll } from '../../hooks/usePoll.js';

export default function Alertes() {
  const [rows, setRows] = useState([]);
  const [filtre, setFiltre] = useState('');

  const load = useCallback(async () => {
    const data = await fetchJson('/api/alertes');
    setRows(data);
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);
  usePoll(load, 30000, [load]);

  const filtered = filtre ? rows.filter((r) => r.statut === filtre) : rows;
  const counts = {
    en_cours: rows.filter((r) => r.statut === 'en_cours').length,
    resolue:  rows.filter((r) => r.statut === 'resolue').length,
    expiree:  rows.filter((r) => r.statut === 'expiree').length,
    annulee:  rows.filter((r) => r.statut === 'annulee').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Historique des alertes</h2>
        <p className="text-sm text-gray-500">Suivi des campagnes de recrutement de donneurs</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={!filtre} onClick={() => setFiltre('')}>Toutes ({rows.length})</FilterChip>
        <FilterChip active={filtre === 'en_cours'} onClick={() => setFiltre('en_cours')} color="amber">En cours ({counts.en_cours})</FilterChip>
        <FilterChip active={filtre === 'resolue'} onClick={() => setFiltre('resolue')} color="emerald">Résolues ({counts.resolue})</FilterChip>
        <FilterChip active={filtre === 'expiree'} onClick={() => setFiltre('expiree')}>Expirées ({counts.expiree})</FilterChip>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Hôpital</th>
              <th className="px-4 py-3">Groupe</th>
              <th className="px-4 py-3">Urgence</th>
              <th className="px-4 py-3">Contactés</th>
              <th className="px-4 py-3">Acceptés</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-400">#{a.id}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{a.hopital_nom}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${a.groupe_sanguin.endsWith('-') ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                    {a.groupe_sanguin}
                  </span>
                </td>
                <td className="px-4 py-3"><UrgenceBadge u={a.niveau_urgence} /></td>
                <td className="px-4 py-3 text-gray-600">{a.donneurs_contactes}</td>
                <td className="px-4 py-3 font-medium text-emerald-700">{a.donneurs_acceptes ?? a.donneurs_repondus ?? 0}</td>
                <td className="px-4 py-3"><Statut s={a.statut} /></td>
                <td className="px-4 py-3 text-gray-500">{new Date(a.date_creation).toLocaleString('fr-FR')}</td>
                <td className="px-4 py-3">
                  <Link to={`/staff/alertes/${a.id}`} className="text-sm font-medium text-blood hover:underline">Détail →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <p className="p-6 text-center text-sm text-gray-400">Aucune alerte</p>}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children, color }) {
  const base = 'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer';
  const styles = active
    ? color === 'amber'   ? 'border-amber-200 bg-amber-100 text-amber-700'
    : color === 'emerald' ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
    : 'border-red-200 bg-red-100 text-blood'
    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50';
  return <button onClick={onClick} className={`${base} ${styles}`}>{children}</button>;
}

function UrgenceBadge({ u }) {
  const m = {
    critique: 'bg-red-100 text-red-700 font-bold',
    urgent:   'bg-orange-100 text-orange-700 font-bold',
    normal:   'bg-gray-100 text-gray-600',
  };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] uppercase ${m[u] || m.normal}`}>{u}</span>;
}
function Statut({ s }) {
  const map = {
    en_cours: 'bg-amber-100 text-amber-700',
    resolue:  'bg-emerald-100 text-emerald-700',
    expiree:  'bg-gray-100 text-gray-500',
    annulee:  'bg-gray-100 text-gray-500',
  };
  const labels = { en_cours: 'En cours', resolue: 'Résolue', expiree: 'Expirée', annulee: 'Annulée' };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[s] || 'bg-gray-100 text-gray-500'}`}>{labels[s]}</span>;
}
