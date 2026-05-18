import { useEffect, useState } from 'react';
import { fetchJson } from '../../api';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function MonProfil() {
  const { user, refresh } = useAuth();
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchJson('/api/donneurs/me').then((d) => {
      setData(d);
      setForm({
        nom: d.donneur.nom,
        prenom: d.donneur.prenom,
        telephone: d.donneur.telephone,
        email: d.donneur.email || '',
        date_naissance: d.donneur.date_naissance || '',
        sexe: d.donneur.sexe || 'autre',
        poids_kg: d.donneur.poids_kg ?? '',
        ville: d.donneur.ville,
        quartier: d.donneur.quartier || '',
        latitude: d.donneur.latitude ?? '',
        longitude: d.donneur.longitude ?? '',
        disponible: !!d.donneur.disponible,
      });
    }).catch((e) => setErr(e.message));
  }, []);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setErr(null); setMsg(null); setSaving(true);
    try {
      const payload = {
        ...form,
        poids_kg: form.poids_kg ? Number(form.poids_kg) : null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        date_naissance: form.date_naissance || null,
        email: form.email || null,
        quartier: form.quartier || null,
      };
      await fetchJson('/api/donneurs/me', { method: 'PATCH', body: JSON.stringify(payload) });
      setMsg('Profil mis à jour avec succès.');
      await refresh();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  function geolocate() {
    if (!navigator.geolocation) return setErr('Géolocalisation non supportée.');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('latitude', pos.coords.latitude.toFixed(6));
        set('longitude', pos.coords.longitude.toFixed(6));
      },
      () => setErr('Impossible de récupérer votre position.'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  if (!form) return <p className="text-gray-500">Chargement…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mon profil</h2>
        <p className="text-sm text-gray-500">
          {user?.email} · Groupe sanguin{' '}
          <span className="font-semibold text-blood">{data?.donneur?.groupe_sanguin}</span>
        </p>
      </div>

      {data?.donneur?.en_attente_validation && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Votre compte est en attente de validation par le CNTS. Vous pouvez modifier votre profil mais
          vous ne recevrez pas encore d'alertes.
        </div>
      )}

      <form onSubmit={submit} className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Identité</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prénom" value={form.prenom} onChange={(v) => set('prenom', v)} />
              <Field label="Nom" value={form.nom} onChange={(v) => set('nom', v)} />
            </div>
            <Field label="Téléphone" value={form.telephone} onChange={(v) => set('telephone', v)} />
            <Field label="Email" type="email" value={form.email} onChange={(v) => set('email', v)} />
            <Field label="Date de naissance" type="date" value={form.date_naissance} onChange={(v) => set('date_naissance', v)} />
            <Select label="Sexe" value={form.sexe} onChange={(v) => set('sexe', v)} options={[
              { v: 'homme', l: 'Homme' },
              { v: 'femme', l: 'Femme' },
              { v: 'autre', l: 'Autre' },
            ]} />
            <Field label="Poids (kg)" type="number" value={form.poids_kg} onChange={(v) => set('poids_kg', v)} />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Localisation & disponibilité</h3>
          <div className="space-y-3">
            <Field label="Ville" value={form.ville} onChange={(v) => set('ville', v)} />
            <Field label="Quartier" value={form.quartier} onChange={(v) => set('quartier', v)} />
            <div className="rounded-xl border border-gray-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Coordonnées GPS</p>
                <button type="button" onClick={geolocate} className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 shadow-sm hover:bg-gray-50">
                  Utiliser ma position
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Field label="Latitude" value={form.latitude} onChange={(v) => set('latitude', v)} />
                <Field label="Longitude" value={form.longitude} onChange={(v) => set('longitude', v)} />
              </div>
            </div>
            <label className="flex items-center gap-2 rounded-xl border border-gray-100 bg-slate-50 p-3 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.disponible}
                onChange={(e) => set('disponible', e.target.checked)}
                className="rounded border-gray-300 text-blood"
              />
              <span>Je suis disponible pour recevoir des alertes</span>
            </label>
          </div>
        </section>

        <div className="md:col-span-2">
          {err && <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          {msg && <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg}</p>}
          <button type="submit" disabled={saving} className="rounded-xl bg-blood px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blood-dark disabled:opacity-60">
            {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blood focus:ring-2 focus:ring-blood/10"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blood focus:ring-2 focus:ring-blood/10"
      >
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}
