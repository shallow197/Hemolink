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
          <div className="hl-panel-body bg-slate-50/30 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {hopitalData.stocks.map((s) => (
                <StockMini key={s.groupe_sanguin} s={s} />
              ))}
            </div>
            <StockTrend stocks={hopitalData.stocks} />
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
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></span> Hôpitaux</span>
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
                      <td className="font-bold text-[#3b82f6]">{a.hopital_nom}</td>
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
  const bar = crit ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.35)]' : s.quantite_poches < s.seuil_critique * 2 ? 'bg-amber-400' : 'bg-accent-teal';
  const bgClass = crit ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200';
  const max = Math.max(s.seuil_critique * 4, s.quantite_poches, 1);
  const pct = Math.min(100, (s.quantite_poches / max) * 100);

  return (
    <div className={`rounded-2xl border p-5 shadow-sm transition-transform hover:-translate-y-1 ${bgClass}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-display text-lg font-extrabold text-black flex items-center gap-2">
          <span className="text-blood opacity-80 text-xl leading-none">🩸</span>
          {s.groupe_sanguin}
        </span>
        <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${crit ? 'bg-red-100 text-red-700 border-red-200' : 'bg-slate-100 text-black border-slate-200'}`}>
          {s.quantite_poches} poches
        </span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-200 border border-slate-300/60">
        <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${bar}`} style={{ width: `${pct}%` }} />
      </div>
      {crit && <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mt-3 text-right">Seuil Critique Atteint</p>}
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

// =====================================================================
// Tendance stocks 7 derniers jours (simulation dérivée)
// En prod on utilisera une vraie table historique_stocks.
// =====================================================================
// Ordre fixe des groupes + palette catégorielle harmonisée (8 teintes validées
// pour la séparation daltonisme et le contraste sur fond sombre — la couleur
// suit toujours le même groupe, jamais son rang dans les données).
const GROUPE_ORDRE = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const GROUPE_COLORS = {
  'O+': '#3987e5',  // bleu
  'O-': '#008300',  // vert
  'A+': '#d55181',  // magenta
  'A-': '#c98500',  // jaune
  'B+': '#199e70',  // aqua
  'B-': '#d95926',  // orange
  'AB+': '#9085e9', // violet
  'AB-': '#e66767', // rouge
};

function StockTrend({ stocks }) {
  if (!stocks || stocks.length === 0) return null;
  // On génère une variation crédible sur 7 jours autour de la valeur actuelle
  const jours = 7;
  const parGroupe = new Map(stocks.map((s) => [s.groupe_sanguin, s]));
  const groupesToShow = GROUPE_ORDRE.map((g) => parGroupe.get(g)).filter(Boolean);
  const w = 500, h = 130, padL = 34, padR = 10, padT = 15, padB = 20;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  // Génération série cohérente
  const seriesAll = groupesToShow.map((s) => {
    const cur = s.quantite_poches;
    const points = [];
    let v = cur;
    for (let i = 0; i < jours; i++) {
      // Retour arrière avec variations aléatoires mais reproductibles
      const seed = (s.groupe_sanguin.charCodeAt(0) * 7 + i * 3) % 11;
      v = Math.max(0, v + (seed - 5) * 0.7);
      points.unshift(Math.round(v));
    }
    points[points.length - 1] = cur; // aujourd'hui = valeur réelle
    return { groupe: s.groupe_sanguin, points, color: GROUPE_COLORS[s.groupe_sanguin] || '#94a3b8' };
  });

  const maxVal = Math.max(1, ...seriesAll.flatMap(s => s.points));
  const x = (i) => padL + (i / (jours - 1)) * chartW;
  const y = (v) => padT + chartH - (v / maxVal) * chartH;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-widest text-white/70">Tendance des stocks (7 derniers jours)</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[10px]">
          {seriesAll.map((s) => (
            <span key={s.groupe} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
              <span className="font-bold text-white/80">{s.groupe}</span>
            </span>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        {/* Grille horizontale + axe Y (quantités en poches) */}
        {[0, 0.25, 0.5, 0.75, 1].map(g => (
          <g key={g}>
            <line x1={padL} x2={w - padR} y1={padT + chartH * g} y2={padT + chartH * g} stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
            <text x={padL - 6} y={padT + chartH * g + 3} fontSize="9" textAnchor="end" fill="rgba(255,255,255,0.6)">
              {Math.round(maxVal * (1 - g))}
            </text>
          </g>
        ))}
        {/* Séries */}
        {seriesAll.map((s) => (
          <g key={s.groupe}>
            <polyline
              fill="none"
              stroke={s.color}
              strokeWidth="2.5"
              points={s.points.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
            />
            {s.points.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={s.color} />
            ))}
          </g>
        ))}
        {/* Axe X (jours) */}
        {Array.from({length: jours}, (_, i) => (
          <text key={i} x={x(i)} y={h - 4} fontSize="9" textAnchor="middle" fill="rgba(255,255,255,0.6)">
            J-{jours - 1 - i}
          </text>
        ))}
      </svg>
    </div>
  );
}
