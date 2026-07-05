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
        <h2 className="text-2xl font-bold text-zinc-50">Historique des alertes</h2>
        <p className="text-sm text-zinc-400">Suivi des campagnes de recrutement de donneurs</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={!filtre} onClick={() => setFiltre('')}>Toutes ({rows.length})</FilterChip>
        <FilterChip active={filtre === 'en_cours'} onClick={() => setFiltre('en_cours')} color="amber">En cours ({counts.en_cours})</FilterChip>
        <FilterChip active={filtre === 'resolue'} onClick={() => setFiltre('resolue')} color="emerald">Résolues ({counts.resolue})</FilterChip>
        <FilterChip active={filtre === 'expiree'} onClick={() => setFiltre('expiree')}>Expirées ({counts.expiree})</FilterChip>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg shadow-black/20">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-950 text-xs uppercase text-zinc-500">
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
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="border-t border-zinc-800 text-zinc-200">
                <td className="px-4 py-3 font-mono text-xs text-zinc-400">#{a.id}</td>
                <td className="px-4 py-3">{a.hopital_nom}</td>
                <td className="px-4 py-3"><span className={`rounded-md px-2 py-0.5 text-xs font-bold ${a.groupe_sanguin.endsWith('-') ? 'bg-red-950/40 text-red-300' : 'bg-zinc-800 text-zinc-200'}`}>{a.groupe_sanguin}</span></td>
                <td className="px-4 py-3"><UrgenceBadge u={a.niveau_urgence} /></td>
                <td className="px-4 py-3 text-zinc-300">{a.donneurs_contactes}</td>
                <td className="px-4 py-3 text-emerald-300">{a.donneurs_acceptes ?? a.donneurs_repondus ?? 0}</td>
                <td className="px-4 py-3"><Statut s={a.statut} /></td>
                <td className="px-4 py-3 text-zinc-500">{new Date(a.date_creation).toLocaleString('fr-FR')}</td>
                <td className="px-4 py-3">
                  <Link to={`/staff/alertes/${a.id}`} className="text-red-400 hover:text-red-300 hover:underline">Détail →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <p className="p-6 text-center text-zinc-500">Aucune alerte</p>}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children, color }) {
  const base = 'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors';
  const styles = active
    ? color === 'amber' ? 'border-amber-700 bg-amber-950/40 text-amber-200'
    : color === 'emerald' ? 'border-emerald-700 bg-emerald-950/40 text-emerald-200'
    : 'border-red-700 bg-red-950/40 text-red-200'
    : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800';
  return <button onClick={onClick} className={`${base} ${styles}`}>{children}</button>;
}

function UrgenceBadge({ u }) {
  const m = { critique: 'bg-red-600 text-white', urgent: 'bg-amber-500 text-zinc-900', normal: 'bg-zinc-700 text-zinc-200' };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${m[u] || m.normal}`}>{u}</span>;
}
function Statut({ s }) {
  const map = {
    en_cours: 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30',
    resolue:  'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30',
    expiree:  'bg-zinc-700 text-zinc-300 ring-1 ring-zinc-600',
    annulee:  'bg-zinc-700 text-zinc-300 ring-1 ring-zinc-600',
  };
  const labels = { en_cours: 'En cours', resolue: 'Résolue', expiree: 'Expirée', annulee: 'Annulée' };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[s]}`}>{labels[s]}</span>;
}
