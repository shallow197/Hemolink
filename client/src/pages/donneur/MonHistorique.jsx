import { useEffect, useState } from 'react';
import { fetchJson } from '../../api';

export default function MonHistorique() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetchJson('/api/donneurs/me').then(setData).catch((e) => setErr(e.message));
  }, []);

  if (err) return <p className="text-red-400">{err}</p>;
  if (!data) return <p className="text-zinc-500">Chargement…</p>;

  const total = data.donneur.nombre_dons || data.historique.length;
  const viesSauvees = total * 3;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-50">Mon historique de dons</h2>
        <p className="text-sm text-zinc-400">Traçabilité complète de vos dons — données issues du CNTS</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card label="Dons effectués" value={total} accent="text-blood" />
        <Card label="Vies potentiellement sauvées" value={viesSauvees} accent="text-emerald-400" sub="3 vies par poche (plaquettes, GR, plasma)" />
        <Card label="Prochain don possible" value={data.eligibilite?.prochaineDateDon || 'Maintenant'} accent={data.eligibilite?.eligible ? 'text-emerald-400' : 'text-amber-300'} />
      </div>

      {data.historique.length === 0 ? (
        <p className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
          Aucun don enregistré pour le moment. Votre premier don sera ajouté automatiquement après votre passage au CNTS.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-950 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Hôpital / Centre</th>
                <th className="px-4 py-3">Type de prélèvement</th>
                <th className="px-4 py-3">Poches</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {data.historique.map((h) => (
                <tr key={h.id} className="border-t border-zinc-800 text-zinc-200">
                  <td className="px-4 py-3 font-medium">{new Date(h.date_don).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3">{h.hopital_nom}</td>
                  <td className="px-4 py-3 capitalize text-zinc-400">{h.type_prelevement.replace('_', ' ')}</td>
                  <td className="px-4 py-3">{h.poches_prelevees}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      h.apte ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30'
                             : 'bg-zinc-700 text-zinc-300'}`}>
                      {h.apte ? 'Don effectué' : 'Inapte'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Card({ label, value, sub, accent = 'text-zinc-50' }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}
