import { useCallback, useEffect, useState } from 'react';
import MapSenegal from '../../components/MapSenegal.jsx';
import { fetchJson } from '../../api';
import { usePoll } from '../../hooks/usePoll.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

function formatTime(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }); }
  catch { return String(d); }
}

export default function Dashboard() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [carte, setCarte] = useState(null);
  const [recent, setRecent] = useState([]);
  const [hopitalData, setHopitalData] = useState(null);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    try {
      setErr(null);
      const promises = [
        fetchJson('/api/dashboard/kpis'),
        fetchJson('/api/dashboard/carte'),
        fetchJson('/api/dashboard/alertes-recentes'),
      ];
      if (user?.role === 'hopital' && user.hopital_id) {
        promises.push(fetchJson(`/api/dashboard/hopital/${user.hopital_id}`));
      }
      const results = await Promise.all(promises);
      setKpis(results[0]); setCarte(results[1]); setRecent(results[2]);
      if (results[3]) setHopitalData(results[3]);
    } catch (e) {
      setErr(e.message);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);
  usePoll(load, 30000, [load]);

  const crit = kpis && kpis.hopitaux_stock_critique > 0;
  const titre = user?.role === 'hopital' ? `Tableau de bord — ${user.hopital?.nom || 'Hôpital'}`
              : user?.role === 'cnts'    ? 'Tableau de bord — CNTS'
              : 'Tableau de bord';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-50">{titre}</h2>
          <p className="text-sm text-zinc-400">Vue d'ensemble des dons et urgences</p>
        </div>
        {crit && (
          <span className="inline-flex items-center rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-md shadow-red-900/40">
            ⚠ Stock critique sur au moins un établissement
          </span>
        )}
      </div>

      {err && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {err} — vérifiez que l'API et MySQL sont démarrés.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Donneurs actifs"        value={kpis?.donneurs_inscrits ?? '—'} accent="border-l-4 border-blood" />
        <KpiCard label="Alertes en cours"       value={kpis?.alertes_actives ?? '—'} accent="border-l-4 border-amber-500" />
        <KpiCard label="Dons acceptés (mois)"   value={kpis?.dons_mois ?? '—'} accent="border-l-4 border-emerald-500" />
        <KpiCard label="Hôpitaux sous seuil"    value={kpis?.hopitaux_stock_critique ?? '—'} accent="border-l-4 border-red-500" />
      </div>

      {hopitalData && (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-3 text-sm font-semibold text-zinc-100">Mes stocks ({hopitalData.hopital.nom})</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {hopitalData.stocks.map((s) => <StockMini key={s.groupe_sanguin} s={s} />)}
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-5">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-lg shadow-black/30 xl:col-span-3">
          <h3 className="mb-3 text-sm font-semibold text-zinc-100">Carte — Sénégal</h3>
          <p className="mb-2 text-xs text-zinc-500">
            Bleu : hôpitaux · Rouge clignotant : alertes en cours · Vert : donneurs disponibles (renfort si compatible)
          </p>
          <MapSenegal carte={carte} />
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-lg shadow-black/30 xl:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-zinc-100">Dernières alertes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-700 text-xs text-zinc-500">
                  <th className="py-2 pr-2">Hôpital</th>
                  <th className="py-2 pr-2">Groupe</th>
                  <th className="py-2 pr-2">Statut</th>
                  <th className="py-2">Heure</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((a) => (
                  <tr key={a.id} className="border-b border-zinc-800">
                    <td className="py-2 pr-2 font-medium text-zinc-200">{a.hopital_nom}</td>
                    <td className="py-2 pr-2 text-zinc-300">{a.groupe_sanguin}</td>
                    <td className="py-2 pr-2"><StatutBadge statut={a.statut} /></td>
                    <td className="py-2 text-zinc-400">{formatTime(a.date_creation)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!recent.length && <p className="py-4 text-center text-sm text-zinc-500">Aucune alerte</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

function KpiCard({ label, value, accent }) {
  return (
    <div className={`rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-lg shadow-black/20 ${accent}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-zinc-50">{value}</p>
    </div>
  );
}

function StockMini({ s }) {
  const crit = s.quantite_poches < s.seuil_critique;
  const bar = crit ? 'bg-red-500' : s.quantite_poches < s.seuil_critique * 2 ? 'bg-amber-400' : 'bg-emerald-500';
  const max = Math.max(s.seuil_critique * 4, s.quantite_poches, 1);
  const pct = Math.min(100, (s.quantite_poches / max) * 100);
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-zinc-200">{s.groupe_sanguin}</span>
        <span className={crit ? 'font-semibold text-red-400' : 'text-zinc-400'}>{s.quantite_poches} poches</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatutBadge({ statut }) {
  const map = {
    en_cours: 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30',
    resolue:  'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30',
    expiree:  'bg-zinc-700 text-zinc-300 ring-1 ring-zinc-600',
    annulee:  'bg-zinc-700 text-zinc-300 ring-1 ring-zinc-600',
  };
  const labels = { en_cours: 'En cours', resolue: 'Résolue', expiree: 'Expirée', annulee: 'Annulée' };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[statut] || 'bg-zinc-700 text-zinc-300'}`}>{labels[statut] || statut}</span>;
}
