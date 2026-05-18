import { useCallback, useEffect, useState } from 'react';
import { PageHeader, FilterBar, DataTable, BloodGroupBadge, Modal } from '../../components/ui.jsx';
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
    <div className="hl-page">
      <PageHeader
        title="Donneurs"
        subtitle="Registre des donneurs inscrits"
        badge={
          enAttente > 0 && peutValider ? (
            <span className="hl-badge bg-amber-100 text-amber-900 ring-1 ring-amber-200/80">{enAttente} en attente</span>
          ) : null
        }
        actions={
          <button type="button" onClick={() => setModal(true)} className="hl-btn-primary">
            + Ajouter un donneur
          </button>
        }
      />

      <FilterBar>
        <select value={filtreGs} onChange={(e) => setFiltreGs(e.target.value)} className={filterCls}>
          <option value="">Tous les groupes</option>
          {GROUPES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <input placeholder="Ville…" value={filtreVille} onChange={(e) => setFiltreVille(e.target.value)} className={filterCls} />
        <select value={filtreDispo} onChange={(e) => setFiltreDispo(e.target.value)} className={filterCls}>
          <option value="">Disponibilité (toutes)</option>
          <option value="1">Disponibles</option>
          <option value="0">Non disponibles</option>
        </select>
        <select value={filtreVal} onChange={(e) => setFiltreVal(e.target.value)} className={filterCls}>
          <option value="">Validation (toutes)</option>
          <option value="attente">En attente</option>
          <option value="valide">Validés</option>
        </select>
      </FilterBar>

      <DataTable empty={!rows.length} emptyMessage="Aucun donneur">
        <table className="hl-table min-w-full">
          <thead>
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
          <tbody className="divide-y divide-gray-50">
            {rows.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{d.prenom} {d.nom}</td>
                <td className="px-4 py-3">
                  <BloodGroupBadge group={d.groupe_sanguin} />
                </td>
                <td className="px-4 py-3 text-gray-600">{d.telephone}</td>
                <td className="px-4 py-3 text-gray-500">{d.derniere_date_don ? new Date(d.derniere_date_don).toLocaleDateString('fr-FR') : '—'}</td>
                <td className="px-4 py-3 text-gray-700">{d.ville}{d.quartier ? <span className="text-gray-400"> · {d.quartier}</span> : null}</td>
                <td className="px-4 py-3"><DispoBadge statut={d.statut_badge} /></td>
                {peutValider && (
                  <td className="px-4 py-3">
                    {d.en_attente_validation && (
                      <button type="button" onClick={() => valider(d.id)} className="hl-btn-success px-3 py-1 text-xs">
                        Valider
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>

      <Modal open={modal} onClose={() => setModal(false)} title="Nouveau donneur">
            <form className="space-y-3" onSubmit={submit}>
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
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.disponible} onChange={(e) => setForm({ ...form, disponible: e.target.checked })} className="rounded border-gray-300 text-blood" />
                Disponible
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.en_attente_validation} onChange={(e) => setForm({ ...form, en_attente_validation: e.target.checked })} className="rounded border-gray-300 text-blood" />
                Marquer en attente de validation
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModal(false)} className="hl-btn-danger-ghost">
                  Annuler
                </button>
                <button type="submit" className="hl-btn-primary">
                  Enregistrer
                </button>
              </div>
            </form>
      </Modal>
    </div>
  );
}

const filterCls = 'hl-filter-input';

function Field({ label, value, onChange, type = 'text', required }) {
  return (
    <label className="hl-label-field">
      {label}
      <input type={type} required={required} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="hl-input" />
    </label>
  );
}
function Select({ label, value, onChange, options }) {
  const items = options.map((o) => (typeof o === 'string' ? { v: o, l: o } : o));
  return (
    <label className="hl-label-field">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="hl-input">
        {items.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}
function DispoBadge({ statut }) {
  const m = {
    disponible:   'bg-emerald-100 text-emerald-700',
    indisponible: 'bg-gray-100 text-gray-600',
    en_attente:   'bg-amber-100 text-amber-700',
  };
  const l = { disponible: 'Disponible', indisponible: 'Indisponible', en_attente: 'En attente' };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m[statut] || 'bg-gray-100 text-gray-600'}`}>{l[statut] || statut}</span>;
}
