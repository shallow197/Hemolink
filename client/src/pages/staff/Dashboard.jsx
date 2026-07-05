import { useCallback, useEffect, useState } from 'react';
import MapSenegal from '../../components/MapSenegal.jsx';
import { PageHeader, KpiCard as StatTile } from '../../components/ui.jsx';
import { fetchJson } from '../../api';
import { usePoll } from '../../hooks/usePoll.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

function formatTime(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return String(d);
  }
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
      setKpis(results[0]);
      setCarte(results[1]);
      setRecent(results[2]);
      if (results[3]) setHopitalData(results[3]);
    } catch (e) {
      setErr(e.message);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);
  usePoll(load, 30000, [load]);

  const crit = kpis && kpis.hopitaux_stock_critique > 0;
  const titre =
    user?.role === 'hopital'
      ? `Tableau de bord — ${user.hopital?.nom || 'Hôpital'}`
      : user?.role === 'cnts'
        ? 'Tableau de bord — CNTS'
        : 'Tableau de bord';

  return (
    <div className="hl-page pb-12">
      <PageHeader
        title={titre}
        subtitle="Vue d'ensemble stratégique des dons et urgences"
        badge={
          crit ? (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-900/30 text-red-200 text-sm font-bold border border-red-500/30 shadow-sm animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              Stock critique détecté
            </span>
          ) : null
        }
      />

      {err && <div className="hl-alert-error shadow-md">{err} — vérifiez la connexion à l'API.</div>}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Donneurs Actifs" value={kpis?.donneurs_inscrits} accent="border-l-blood" />
        <StatTile label="Alertes en Cours" value={kpis?.alertes_actives} accent="border-l-accent-gold" />
        <StatTile label="Dons Acceptés (Mois)" value={kpis?.dons_mois} accent="border-l-accent-teal" />
        <StatTile label="Hôpitaux sous Seuil" value={kpis?.hopitaux_stock_critique} accent="border-l-red-500" />
      </div>

      {hopitalData && (
        <section className="hl-panel">
          <div className="hl-panel-header">
            <h3 className="hl-panel-title flex items-center gap-2">
              <span className="text-xl">🏥</span>
              État des Stocks — {hopitalData.hopital.nom}
            </h3>
            <p className="mt-1 text-xs text-slate-500 font-medium">Niveaux actuels par groupe sanguin</p>
          </div>
          <div className="hl-panel-body bg-slate-50/30">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {hopitalData.stocks.map((s) => (
                <StockMini key={s.groupe_sanguin} s={s} />
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-5">
        <section className="hl-panel xl:col-span-3">
          <div className="hl-panel-header flex justify-between items-center">
            <div>
              <h3 className="hl-panel-title">Cartographie Nationale</h3>
              <p className="mt-1 text-xs text-slate-500 font-medium">
                Vue temps réel des infrastructures et urgences
              </p>
            </div>
            <div className="flex gap-3 text-xs font-bold text-slate-300 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Hôpitaux</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blood shadow-glow"></span> Alertes</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent-teal"></span> Donneurs</span>
            </div>
          </div>
          <div className="p-4 bg-transparent">
            <div className="rounded-[1.5rem] overflow-hidden shadow-inner border border-white/10 bg-[#0F172A] h-[500px]">
              <MapSenegal carte={carte} />
            </div>
          </div>
        </section>

        <section className="hl-panel xl:col-span-2">
          <div className="hl-panel-header">
            <h3 className="hl-panel-title">Dernières Alertes</h3>
            <p className="mt-1 text-xs text-slate-500 font-medium">Historique récent des urgences</p>
          </div>
          <div className="hl-panel-body p-0">
            <div className="hl-table-wrap border-0 rounded-none shadow-none">
              <table className="hl-table">
                <thead>
                  <tr className="bg-white/5">
                    <th className="py-4">Hôpital</th>
                    <th className="py-4">Groupe</th>
                    <th className="py-4">Statut</th>
                    <th className="py-4">Heure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recent.map((a) => (
                    <tr key={a.id} className="hover:bg-white/5 transition-colors">
                      <td className="font-bold text-white">{a.hopital_nom}</td>
                      <td>
                        <span className="hl-blood-badge">{a.groupe_sanguin}</span>
                      </td>
                      <td>
                        <StatutBadge statut={a.statut} />
                      </td>
                      <td className="text-sm font-medium text-slate-500">{formatTime(a.date_creation)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!recent.length && (
                <div className="py-12 text-center">
                  <span className="text-3xl mb-3 block">👍</span>
                  <p className="text-sm font-bold text-slate-500">Aucune alerte active</p>
                  <p className="text-xs text-slate-400 mt-1">La situation est calme.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StockMini({ s }) {
  const crit = s.quantite_poches < s.seuil_critique;
  const bar = crit ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : s.quantite_poches < s.seuil_critique * 2 ? 'bg-amber-400' : 'bg-accent-teal';
  const bgClass = crit ? 'bg-red-900/20 border-red-500/30' : 'bg-white/5 border-white/10';
  const max = Math.max(s.seuil_critique * 4, s.quantite_poches, 1);
  const pct = Math.min(100, (s.quantite_poches / max) * 100);
  
  return (
    <div className={`rounded-2xl border p-5 shadow-sm transition-transform hover:-translate-y-1 ${bgClass}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-display text-lg font-extrabold text-white flex items-center gap-2">
          <span className="text-blood opacity-80 text-xl leading-none">🩸</span>
          {s.groupe_sanguin}
        </span>
        <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${crit ? 'bg-red-900/30 text-red-300 border-red-500/30' : 'bg-white/10 text-slate-300 border-white/10'}`}>
          {s.quantite_poches} poches
        </span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10 border border-white/5 inset-shadow-sm">
        <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${bar}`} style={{ width: `${pct}%` }} />
      </div>
      {crit && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mt-3 text-right">Seuil Critique Atteint</p>}
    </div>
  );
}

function StatutBadge({ statut }) {
  const map = {
    en_cours: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    resolue: 'bg-accent-teal/20 text-accent-teal border border-accent-teal/30',
    expiree: 'bg-white/10 text-slate-400 border border-white/10',
    annulee: 'bg-white/10 text-slate-500 border border-white/10',
  };
  const labels = { en_cours: 'En Cours', resolue: 'Résolue', expiree: 'Expirée', annulee: 'Annulée' };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider shadow-sm ${map[statut] || 'bg-white/10 text-slate-400'}`}>{labels[statut] || statut}</span>;
}
