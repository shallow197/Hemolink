import { useEffect, useState } from 'react';
import { fetchJson } from '../../api';

export default function CntsNational() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetchJson('/api/dashboard/cnts/national').then(setData).catch((e) => setErr(e.message));
  }, []);

  if (err) return <p className="text-red-700">{err}</p>;
  if (!data) return <p className="text-gray-500">Chargement…</p>;

  const totalStock = data.stocks_par_groupe.reduce((s, x) => s + Number(x.total || 0), 0);
  const totalDonneurs = data.donneurs_par_groupe.reduce((s, x) => s + Number(x.n || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Vue nationale CNTS</h2>
        <p className="text-sm text-gray-500">Pilotage stratégique de la chaîne du don au Sénégal</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Poches en stock (national)" value={totalStock} accent="text-blood" />
        <Card label="Donneurs actifs validés" value={totalDonneurs} accent="text-emerald-700" />
        <Card label="Comptes en attente de validation" value={data.comptes_en_attente} accent="text-amber-600" />
        <Card label="Délai moyen de réponse" value={`${data.delai_moyen_reponse_minutes} min`} accent="text-blue-700" />
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Stocks nationaux par groupe sanguin</h3>
        <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {data.stocks_par_groupe.map((s) => {
            const total = Number(s.total || 0);
            const seuil = Number(s.seuil || 0);
            const crit = total < seuil;
            return (
              <div key={s.groupe_sanguin} className={`rounded-xl border p-3 text-center ${crit ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-slate-50'}`}>
                <p className={`text-2xl font-bold ${s.groupe_sanguin.endsWith('-') ? 'text-blood' : 'text-gray-800'}`}>{s.groupe_sanguin}</p>
                <p className={`mt-1 text-lg font-bold ${crit ? 'text-red-600' : 'text-gray-900'}`}>{total}</p>
                <p className="text-[10px] text-gray-400">poches</p>
                {crit && <p className="mt-1 text-[10px] font-bold uppercase text-red-600">Critique</p>}
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Donneurs par région</h3>
          <div className="space-y-2">
            {data.donneurs_par_region.map((r) => {
              const max = Math.max(...data.donneurs_par_region.map((x) => Number(x.donneurs)));
              const pct = max ? (Number(r.donneurs) / max) * 100 : 0;
              return (
                <div key={r.id || r.nom} className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0 font-medium text-gray-700">{r.nom}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-2.5 bg-blood transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-16 text-right text-gray-500">
                    <span className="font-semibold text-gray-900">{r.donneurs}</span>
                    <span className="ml-1 text-xs text-emerald-600">({r.disponibles})</span>
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-gray-400">Total · (disponibles validés)</p>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Donneurs par groupe sanguin</h3>
          <div className="grid grid-cols-4 gap-3">
            {data.donneurs_par_groupe.map((g) => (
              <div key={g.groupe_sanguin} className="rounded-xl border border-gray-100 bg-slate-50 p-3 text-center">
                <p className={`text-lg font-bold ${g.groupe_sanguin.endsWith('-') ? 'text-blood' : 'text-gray-800'}`}>{g.groupe_sanguin}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{g.n}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-gray-500">Les groupes négatifs (en rouge) sont prioritaires car rares.</p>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Activité des 30 derniers jours</h3>
        {data.alertes_30j.length === 0 ? (
          <p className="text-sm text-gray-400">Aucune alerte sur la période.</p>
        ) : (
          <div className="space-y-2">
            {data.alertes_30j.map((j) => {
              const max = Math.max(...data.alertes_30j.map((x) => Number(x.n)));
              const pct = max ? (Number(j.n) / max) * 100 : 0;
              return (
                <div key={j.jour} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-xs text-gray-500">{new Date(j.jour).toLocaleDateString('fr-FR')}</span>
                  <div className="flex-1 overflow-hidden rounded bg-gray-100">
                    <div className="h-3 bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-32 text-right text-xs text-gray-500">
                    <span className="font-semibold text-gray-900">{j.n} alertes</span>
                    {j.resolues > 0 && <span className="ml-1 text-emerald-600">({j.resolues} résolues)</span>}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Card({ label, value, accent = 'text-gray-900' }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}
