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
    <div className="hl-page">
      <PageHeader
        title={titre}
        subtitle="Vue d'ensemble des dons et urgences"
        badge={
          crit ? (
            <span className="hl-badge bg-red-100 text-red-800 ring-1 ring-red-200/80">
              Stock critique sur au moins un établissement
            </span>
          ) : null
        }
      />

      {err && <p className="hl-alert-error">{err} — vérifiez que l&apos;API et MySQL sont démarrés.</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Donneurs actifs" value={kpis?.donneurs_inscrits} accent="border-l-blood" />
        <StatTile label="Alertes en cours" value={kpis?.alertes_actives} accent="border-l-accent-gold" />
        <StatTile label="Dons acceptés (mois)" value={kpis?.dons_mois} accent="border-l-accent-teal" />
        <StatTile label="Hôpitaux sous seuil" value={kpis?.hopitaux_stock_critique} accent="border-l-red-400" />
      </div>

      {hopitalData && (
        <section className="hl-card hl-card-body">
          <h3 className="mb-3 font-display text-sm font-bold text-brand-navy">
            Mes stocks ({hopitalData.hopital.nom})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {hopitalData.stocks.map((s) => (
              <StockMini key={s.groupe_sanguin} s={s} />
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-5">
        <section className="hl-card hl-card-body xl:col-span-3">
          <h3 className="font-display text-sm font-bold text-brand-navy">Carte — Sénégal</h3>
          <p className="mb-4 text-xs text-slate-500">
            Bleu : hôpitaux · Rouge clignotant : alertes · Vert : donneurs disponibles
          </p>
          <MapSenegal carte={carte} />
        </section>

        <section className="hl-card hl-card-body xl:col-span-2">
          <h3 className="mb-4 font-display text-sm font-bold text-brand-navy">Dernières alertes</h3>
          <div className="hl-table-wrap">
            <table className="hl-table">
              <thead>
                <tr>
                  <th>Hôpital</th>
                  <th>Groupe</th>
                  <th>Statut</th>
                  <th>Heure</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((a) => (
                  <tr key={a.id}>
                    <td className="font-semibold text-brand-navy">{a.hopital_nom}</td>
                    <td>{a.groupe_sanguin}</td>
                    <td>
                      <StatutBadge statut={a.statut} />
                    </td>
                    <td className="text-slate-500">{formatTime(a.date_creation)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!recent.length && <p className="py-6 text-center text-sm text-slate-400">Aucune alerte</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

function StockMini({ s }) {
  const crit = s.quantite_poches < s.seuil_critique;
  const bar = crit ? 'bg-red-500' : s.quantite_poches < s.seuil_critique * 2 ? 'bg-amber-400' : 'bg-emerald-500';
  const max = Math.max(s.seuil_critique * 4, s.quantite_poches, 1);
  const pct = Math.min(100, (s.quantite_poches / max) * 100);
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-brand-navy">{s.groupe_sanguin}</span>
        <span className={crit ? 'font-semibold text-red-600' : 'text-slate-500'}>{s.quantite_poches} poches</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatutBadge({ statut }) {
  const map = {
    en_cours: 'bg-amber-100 text-amber-800',
    resolue: 'bg-emerald-100 text-emerald-800',
    expiree: 'bg-slate-100 text-slate-600',
    annulee: 'bg-slate-100 text-slate-500',
  };
  const labels = { en_cours: 'En cours', resolue: 'Résolue', expiree: 'Expirée', annulee: 'Annulée' };
  return <span className={`hl-badge ${map[statut] || 'bg-slate-100 text-slate-600'}`}>{labels[statut] || statut}</span>;
}
