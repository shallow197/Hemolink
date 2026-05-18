import { useEffect, useState } from 'react';
import { fetchJson } from '../../api';

export default function MonHistorique() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetchJson('/api/donneurs/me').then(setData).catch((e) => setErr(e.message));
  }, []);

  if (err) return <p className="text-red-700">{err}</p>;
  if (!data) return <p className="text-gray-500">Chargement…</p>;

  const total = data.donneur.nombre_dons || data.historique.length;
  const viesSauvees = total * 3;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mon historique de dons</h2>
        <p className="text-sm text-gray-500">Traçabilité complète de vos dons — données issues du CNTS</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card label="Dons effectués" value={total} accent="text-blood" />
        <Card label="Vies potentiellement sauvées" value={viesSauvees} accent="text-emerald-700" sub="3 vies par poche (plaquettes, GR, plasma)" />
        <Card
          label="Prochain don possible"
          value={data.eligibilite?.prochaineDateDon || 'Maintenant'}
          accent={data.eligibilite?.eligible ? 'text-emerald-700' : 'text-amber-600'}
        />
      </div>

      {data.historique.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400 shadow-sm">
          Aucun don enregistré pour le moment. Votre premier don sera ajouté automatiquement après votre passage au CNTS.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Hôpital / Centre</th>
                <th className="px-4 py-3">Type de prélèvement</th>
                <th className="px-4 py-3">Poches</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.historique.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{new Date(h.date_don).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 text-gray-700">{h.hopital_nom}</td>
                  <td className="px-4 py-3 capitalize text-gray-500">{h.type_prelevement.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-gray-700">{h.poches_prelevees}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      h.apte ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}>
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

function Card({ label, value, sub, accent = 'text-gray-900' }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}
