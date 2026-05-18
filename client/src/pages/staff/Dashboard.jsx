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
          <h2 className="text-2xl font-bold text-gray-900">{titre}</h2>
          <p className="text-sm text-gray-500">Vue d'ensemble des dons et urgences</p>
        </div>
        {crit && (
          <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200">
            Stock critique sur au moins un établissement
          </span>
        )}
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err} — vérifiez que l'API et MySQL sont démarrés.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Donneurs actifs"        value={kpis?.donneurs_inscrits ?? '—'} accent="border-l-4 border-blood" />
        <KpiCard label="Alertes en cours"       value={kpis?.alertes_actives ?? '—'} accent="border-l-4 border-amber-500" />
        <KpiCard label="Dons acceptés (mois)"   value={kpis?.dons_mois ?? '—'} accent="border-l-4 border-emerald-500" />
        <KpiCard label="Hôpitaux sous seuil"    value={kpis?.hopitaux_stock_critique ?? '—'} accent="border-l-4 border-red-400" />
      </div>

      {hopitalData && (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Mes stocks ({hopitalData.hopital.nom})</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {hopitalData.stocks.map((s) => <StockMini key={s.groupe_sanguin} s={s} />)}
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-5">
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm xl:col-span-3">
          <h3 className="mb-1 text-sm font-semibold text-gray-900">Carte — Sénégal</h3>
          <p className="mb-3 text-xs text-gray-500">
            Bleu : hôpitaux · Rouge clignotant : alertes en cours · Vert : donneurs disponibles
          </p>
          <MapSenegal carte={carte} />
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm xl:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Dernières alertes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500">
                  <th className="py-2 pr-2 font-medium">Hôpital</th>
                  <th className="py-2 pr-2 font-medium">Groupe</th>
                  <th className="py-2 pr-2 font-medium">Statut</th>
                  <th className="py-2 font-medium">Heure</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50">
                    <td className="py-2 pr-2 font-medium text-gray-900">{a.hopital_nom}</td>
                    <td className="py-2 pr-2 text-gray-700">{a.groupe_sanguin}</td>
                    <td className="py-2 pr-2"><StatutBadge statut={a.statut} /></td>
                    <td className="py-2 text-gray-500">{formatTime(a.date_creation)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!recent.length && <p className="py-4 text-center text-sm text-gray-400">Aucune alerte</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

function KpiCard({ label, value, accent }) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${accent}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function StockMini({ s }) {
  const crit = s.quantite_poches < s.seuil_critique;
  const bar = crit ? 'bg-red-500' : s.quantite_poches < s.seuil_critique * 2 ? 'bg-amber-400' : 'bg-emerald-500';
  const max = Math.max(s.seuil_critique * 4, s.quantite_poches, 1);
  const pct = Math.min(100, (s.quantite_poches / max) * 100);
  return (
    <div className="rounded-xl border border-gray-100 bg-slate-50 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-gray-800">{s.groupe_sanguin}</span>
        <span className={crit ? 'font-semibold text-red-600' : 'text-gray-500'}>{s.quantite_poches} poches</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatutBadge({ statut }) {
  const map = {
    en_cours: 'bg-amber-100 text-amber-700',
    resolue:  'bg-emerald-100 text-emerald-700',
    expiree:  'bg-gray-100 text-gray-600',
    annulee:  'bg-gray-100 text-gray-500',
  };
  const labels = { en_cours: 'En cours', resolue: 'Résolue', expiree: 'Expirée', annulee: 'Annulée' };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[statut] || 'bg-gray-100 text-gray-600'}`}>{labels[statut] || statut}</span>;
}
