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

  if (!form) return <p className="text-zinc-500">Chargement…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-50">Mon profil</h2>
        <p className="text-sm text-zinc-400">{user?.email} · Groupe sanguin <span className="font-semibold text-red-300">{data?.donneur?.groupe_sanguin}</span></p>
      </div>

      {data?.donneur?.en_attente_validation && (
        <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-5 text-sm text-amber-200">
          ⏳ Votre compte est en attente de validation par le CNTS. Vous pouvez modifier votre profil mais
          vous ne recevrez pas encore d'alertes.
        </div>
      )}

      <form onSubmit={submit} className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-100">Identité</h3>
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

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-100">Localisation & disponibilité</h3>
          <div className="space-y-3">
            <Field label="Ville" value={form.ville} onChange={(v) => set('ville', v)} />
            <Field label="Quartier" value={form.quartier} onChange={(v) => set('quartier', v)} />
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-400">Coordonnées GPS</p>
                <button type="button" onClick={geolocate} className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800">
                  Utiliser ma position
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Field label="Latitude" value={form.latitude} onChange={(v) => set('latitude', v)} />
                <Field label="Longitude" value={form.longitude} onChange={(v) => set('longitude', v)} />
              </div>
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={form.disponible}
                onChange={(e) => set('disponible', e.target.checked)}
                className="rounded border-zinc-600 bg-zinc-800 text-blood"
              />
              <span>Je suis disponible pour recevoir des alertes</span>
            </label>
          </div>
        </section>

        <div className="md:col-span-2">
          {err && <p className="mb-3 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">{err}</p>}
          {msg && <p className="mb-3 rounded-lg border border-emerald-900/50 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">{msg}</p>}
          <button type="submit" disabled={saving} className="rounded-xl bg-blood px-6 py-2.5 text-sm font-semibold text-white hover:bg-blood-dark disabled:opacity-60">
            {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block text-xs font-medium text-zinc-400">
      {label}
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-800 focus:ring-2 focus:ring-red-900/40"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block text-xs font-medium text-zinc-400">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-800 focus:ring-2 focus:ring-red-900/40"
      >
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}
