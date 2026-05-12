import { useCallback, useEffect, useState } from 'react';
import { fetchJson } from '../../api';
import { usePoll } from '../../hooks/usePoll.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

const GROUPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Donneurs() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [filtreGs, setFiltreGs] = useState('');
  const [filtreVille, setFiltreVille] = useState('');
  const [filtreDispo, setFiltreDispo] = useState('');
  const [filtreVal, setFiltreVal] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    nom: '', prenom: '', telephone: '', email: '', sexe: 'autre',
    groupe_sanguin: 'O+', poids_kg: '', ville: '', quartier: '',
    latitude: '', longitude: '', disponible: true, en_attente_validation: false, derniere_date_don: '',
  });

  const load = useCallback(async () => {
    const q = new URLSearchParams();
    if (filtreGs) q.set('groupe_sanguin', filtreGs);
    if (filtreVille) q.set('ville', filtreVille);
    if (filtreDispo) q.set('disponible', filtreDispo);
    if (filtreVal) q.set('validation', filtreVal);
    const data = await fetchJson(`/api/donneurs?${q.toString()}`);
    setRows(data);
  }, [filtreGs, filtreVille, filtreDispo, filtreVal]);

  useEffect(() => { load().catch(() => {}); }, [load]);
  usePoll(load, 30000, [load]);

  async function submit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      poids_kg: form.poids_kg ? Number(form.poids_kg) : null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      derniere_date_don: form.derniere_date_don || null,
      email: form.email || null,
    };
    await fetchJson('/api/donneurs', { method: 'POST', body: JSON.stringify(payload) });
    setModal(false);
    await load();
  }

  async function valider(id) {
    if (!confirm('Valider ce donneur après vérification ?')) return;
    await fetchJson(`/api/donneurs/${id}/valider`, { method: 'POST' });
    await load();
  }

  const peutValider = user?.role === 'cnts' || user?.role === 'admin';
  const enAttente = rows.filter((r) => r.en_attente_validation).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-50">Donneurs</h2>
          <p className="text-sm text-zinc-400">
            Registre des donneurs inscrits
            {enAttente > 0 && peutValider && <span className="ml-2 text-amber-300">· {enAttente} en attente de validation</span>}
          </p>
        </div>
        <button type="button" onClick={() => setModal(true)} className="rounded-xl bg-blood px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blood/25 hover:bg-blood-dark">
          Ajouter un donneur
        </button>
      </div>

      <div className="flex flex-wrap gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-lg shadow-black/20">
        <select value={filtreGs} onChange={(e) => setFiltreGs(e.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100">
          <option value="">Tous les groupes</option>
          {GROUPES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <input placeholder="Ville" value={filtreVille} onChange={(e) => setFiltreVille(e.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500" />
        <select value={filtreDispo} onChange={(e) => setFiltreDispo(e.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100">
          <option value="">Disponibilité (toutes)</option>
          <option value="1">Disponibles</option>
          <option value="0">Non disponibles</option>
        </select>
        <select value={filtreVal} onChange={(e) => setFiltreVal(e.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100">
          <option value="">Validation (toutes)</option>
          <option value="attente">En attente</option>
          <option value="valide">Validés</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg shadow-black/20">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-950 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Groupe</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Dernier don</th>
              <th className="px-4 py-3">Localisation</th>
              <th className="px-4 py-3">Statut</th>
              {peutValider && <th className="px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="border-t border-zinc-800 text-zinc-200">
                <td className="px-4 py-3 font-medium text-zinc-100">{d.prenom} {d.nom}</td>
                <td className="px-4 py-3"><span className={`rounded-md px-2 py-0.5 text-xs font-bold ${d.groupe_sanguin?.endsWith('-') ? 'bg-red-950/40 text-red-300' : 'bg-zinc-800 text-zinc-200'}`}>{d.groupe_sanguin}</span></td>
                <td className="px-4 py-3 text-zinc-300">{d.telephone}</td>
                <td className="px-4 py-3 text-zinc-400">{d.derniere_date_don ? new Date(d.derniere_date_don).toLocaleDateString('fr-FR') : '—'}</td>
                <td className="px-4 py-3">{d.ville}{d.quartier ? <span className="text-zinc-500"> · {d.quartier}</span> : null}</td>
                <td className="px-4 py-3"><DispoBadge statut={d.statut_badge} /></td>
                {peutValider && (
                  <td className="px-4 py-3">
                    {d.en_attente_validation && (
                      <button onClick={() => valider(d.id)} className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700">
                        Valider
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-center text-zinc-500">Aucun donneur</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl shadow-black/60">
            <h3 className="text-lg font-bold text-zinc-50">Nouveau donneur</h3>
            <form className="mt-4 space-y-3" onSubmit={submit}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nom" value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} required />
                <Field label="Prénom" value={form.prenom} onChange={(v) => setForm({ ...form, prenom: v })} required />
              </div>
              <Field label="Téléphone" value={form.telephone} onChange={(v) => setForm({ ...form, telephone: v })} required />
              <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <div className="grid grid-cols-3 gap-3">
                <Select label="Groupe" value={form.groupe_sanguin} onChange={(v) => setForm({ ...form, groupe_sanguin: v })} options={GROUPES} />
                <Select label="Sexe" value={form.sexe} onChange={(v) => setForm({ ...form, sexe: v })} options={[{v:'homme',l:'Homme'},{v:'femme',l:'Femme'},{v:'autre',l:'Autre'}]} />
                <Field label="Poids (kg)" type="number" value={form.poids_kg} onChange={(v) => setForm({ ...form, poids_kg: v })} />
              </div>
              <Field label="Ville" value={form.ville} onChange={(v) => setForm({ ...form, ville: v })} required />
              <Field label="Quartier" value={form.quartier} onChange={(v) => setForm({ ...form, quartier: v })} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Latitude" value={form.latitude} onChange={(v) => setForm({ ...form, latitude: v })} />
                <Field label="Longitude" value={form.longitude} onChange={(v) => setForm({ ...form, longitude: v })} />
              </div>
              <Field label="Dernière date de don" type="date" value={form.derniere_date_don} onChange={(v) => setForm({ ...form, derniere_date_don: v })} />
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" checked={form.disponible} onChange={(e) => setForm({ ...form, disponible: e.target.checked })} className="rounded border-zinc-600 bg-zinc-800 text-blood" />
                Disponible
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" checked={form.en_attente_validation} onChange={(e) => setForm({ ...form, en_attente_validation: e.target.checked })} className="rounded border-zinc-600 bg-zinc-800 text-blood" />
                Marquer en attente de validation
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModal(false)} className="rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700">Annuler</button>
                <button type="submit" className="rounded-lg bg-blood px-4 py-2 text-sm font-semibold text-white hover:bg-blood-dark">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required }) {
  return (
    <label className="block text-xs font-medium text-zinc-400">
      {label}
      <input type={type} required={required} value={value ?? ''} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-800 focus:ring-2 focus:ring-red-900/40" />
    </label>
  );
}
function Select({ label, value, onChange, options }) {
  const items = options.map((o) => (typeof o === 'string' ? { v: o, l: o } : o));
  return (
    <label className="block text-xs font-medium text-zinc-400">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-800 focus:ring-2 focus:ring-red-900/40">
        {items.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}
function DispoBadge({ statut }) {
  const m = { disponible: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30',
              indisponible: 'bg-zinc-700 text-zinc-300 ring-1 ring-zinc-600',
              en_attente: 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30' };
  const l = { disponible: 'Disponible', indisponible: 'Indisponible', en_attente: 'En attente' };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m[statut] || 'bg-zinc-700 text-zinc-300'}`}>{l[statut] || statut}</span>;
}
