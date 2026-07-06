import { useEffect, useState } from 'react';
import { PageHeader, KpiCard, Panel } from '../../components/ui.jsx';
import { fetchJson, getToken } from '../../api';
import ActualitesCNTS from '../../components/ActualitesCNTS.jsx';

export default function CntsNational() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetchJson('/api/dashboard/cnts/national').then(setData).catch((e) => setErr(e.message));
  }, []);

  async function exporterCsv() {
    try {
      const res = await fetch('/api/exports/cnts/csv', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Erreur export');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hemolink-rapport-cnts-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) { alert(e.message); }
  }

  if (err) return <p className="hl-alert-error">{err}</p>;
  if (!data) return <p className="text-slate-500">Chargement…</p>;

  const totalStock = data.stocks_par_groupe.reduce((s, x) => s + Number(x.total || 0), 0);
  const totalDonneurs = data.donneurs_par_groupe.reduce((s, x) => s + Number(x.n || 0), 0);

  return (
    <div className="hl-page rounded-2xl bg-slate-50 p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Vue nationale CNTS" subtitle="Pilotage stratégique de la chaîne du don au Sénégal" />
        <button
          onClick={exporterCsv}
          className="rounded-xl bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-navy/90"
        >
          📊 Exporter en CSV / Excel
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Poches en stock (national)" value={totalStock} accent="border-l-blood" />
        <KpiCard label="Donneurs actifs validés" value={totalDonneurs} accent="border-l-accent-teal" />
        <KpiCard label="Comptes en attente" value={data.comptes_en_attente} accent="border-l-accent-gold" />
        <KpiCard label="Délai moyen de réponse" value={`${data.delai_moyen_reponse_minutes} min`} accent="border-l-brand-slate" />
      </div>

      <Panel title="Stocks nationaux par groupe sanguin">
        <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {data.stocks_par_groupe.map((s) => {
            const total = Number(s.total || 0);
            const seuil = Number(s.seuil || 0);
            const crit = total < seuil;
            return (
              <div
                key={s.groupe_sanguin}
                className={`hl-stock-tile ${crit ? 'hl-stock-tile-crit' : ''}`}
              >
                <p className={`font-display text-lg font-bold ${s.groupe_sanguin.endsWith('-') ? 'text-blood' : 'text-brand-navy'}`}>
                  {s.groupe_sanguin}
                </p>
                <p className={`mt-1 text-2xl font-bold ${crit ? 'text-blood' : 'text-brand-navy'}`}>{total}</p>
                <p className="text-[10px] uppercase tracking-wide text-slate-600">poches</p>
                {crit && <p className="mt-1 text-[10px] font-bold uppercase text-blood">Critique</p>}
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Donneurs par région">
          <div className="space-y-3">
            {data.donneurs_par_region.map((r) => {
              const max = Math.max(...data.donneurs_par_region.map((x) => Number(x.donneurs)));
              const pct = max ? (Number(r.donneurs) / max) * 100 : 0;
              return (
                <div key={r.id || r.nom} className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0 font-semibold text-brand-navy">{r.nom}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-2.5 rounded-full bg-gradient-to-r from-brand-navy to-blood" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-16 text-right text-slate-600">
                    <span className="font-bold text-brand-navy">{r.donneurs}</span>
                    <span className="ml-1 text-xs text-accent-teal">({r.disponibles})</span>
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-[11px] text-slate-600">Total · (disponibles validés)</p>
        </Panel>

        <Panel title="Donneurs par groupe sanguin">
          <div className="grid grid-cols-4 gap-3">
            {data.donneurs_par_groupe.map((g) => (
              <div key={g.groupe_sanguin} className="hl-stock-tile">
                <p className={`font-display font-bold ${g.groupe_sanguin.endsWith('-') ? 'text-blood' : 'text-brand-navy'}`}>
                  {g.groupe_sanguin}
                </p>
                <p className="mt-1 text-xl font-bold text-brand-navy">{g.n}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Actualités officielles CNTS */}
      <ActualitesCNTS />
    </div>
  );
}
