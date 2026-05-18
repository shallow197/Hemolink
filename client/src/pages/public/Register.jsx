import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

const GROUPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const VILLES = ['Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Thiès', 'Saint-Louis', 'Kaolack', 'Ziguinchor', 'Touba', 'Louga'];

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    password2: '',
    nom: '',
    prenom: '',
    telephone: '',
    date_naissance: '',
    sexe: 'autre',
    groupe_sanguin: 'O+',
    poids_kg: '',
    ville: 'Dakar',
    quartier: '',
    latitude: '',
    longitude: '',
    consentement_rgpd: false,
  });

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function next(e) {
    e.preventDefault();
    setErr(null);
    if (form.password !== form.password2) {
      setErr('Les mots de passe ne correspondent pas.');
      return;
    }
    if (form.password.length < 8) {
      setErr('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setStep(2);
  }

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    if (!form.consentement_rgpd) {
      setErr('Le consentement RGPD est obligatoire pour traiter vos données médicales.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        email: form.email.trim(),
        password: form.password,
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        telephone: form.telephone.trim(),
        date_naissance: form.date_naissance || null,
        sexe: form.sexe,
        groupe_sanguin: form.groupe_sanguin,
        poids_kg: form.poids_kg ? Number(form.poids_kg) : null,
        ville: form.ville,
        quartier: form.quartier || null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        consentement_rgpd: form.consentement_rgpd,
      };
      await register(payload);
      nav('/mon-espace', { replace: true });
    } catch (e) {
      setErr(e.message + (e.issues ? ' — ' + e.issues.map((i) => i.path + ': ' + i.message).join(' · ') : ''));
    } finally {
      setLoading(false);
    }
  }

  function geolocate() {
    if (!navigator.geolocation) {
      setErr('Géolocalisation non supportée par votre navigateur.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('latitude', pos.coords.latitude.toFixed(6));
        set('longitude', pos.coords.longitude.toFixed(6));
      },
      () => setErr("Impossible de récupérer votre position. Vérifiez les autorisations de votre navigateur."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-md">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Devenir donneur</h1>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-8 rounded-full ${step >= 1 ? 'bg-blood' : 'bg-gray-200'}`} />
            <span className={`h-2 w-8 rounded-full ${step >= 2 ? 'bg-blood' : 'bg-gray-200'}`} />
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Étape {step} / 2 — Inscrivez-vous pour être alerté des urgences transfusionnelles dans votre zone.
        </p>

        {step === 1 && (
          <form className="mt-6 space-y-4" onSubmit={next}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Prénom" value={form.prenom} onChange={(v) => set('prenom', v)} required />
              <Field label="Nom"    value={form.nom}    onChange={(v) => set('nom', v)} required />
            </div>
            <Field label="Adresse email" type="email" value={form.email} onChange={(v) => set('email', v)} required />
            <Field label="Téléphone" value={form.telephone} onChange={(v) => set('telephone', v)} required placeholder="+221 77 123 45 67" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Mot de passe (8+ caractères)" type="password" value={form.password} onChange={(v) => set('password', v)} required />
              <Field label="Confirmer le mot de passe"     type="password" value={form.password2} onChange={(v) => set('password2', v)} required />
            </div>
            {err && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
            <button type="submit" className="w-full rounded-xl bg-blood py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blood-dark">
              Continuer →
            </button>
            <p className="text-center text-sm text-gray-600">
              Déjà inscrit ? <Link to="/login" className="font-medium text-blood hover:text-blood-dark">Se connecter</Link>
            </p>
          </form>
        )}

        {step === 2 && (
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Select label="Groupe sanguin" value={form.groupe_sanguin} onChange={(v) => set('groupe_sanguin', v)} options={GROUPES} />
              <Select label="Sexe" value={form.sexe} onChange={(v) => set('sexe', v)} options={[{v:'homme',l:'Homme'},{v:'femme',l:'Femme'},{v:'autre',l:'Autre'}]} />
              <Field label="Date de naissance" type="date" value={form.date_naissance} onChange={(v) => set('date_naissance', v)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Poids (kg) — minimum 50" type="number" value={form.poids_kg} onChange={(v) => set('poids_kg', v)} />
              <Select label="Ville" value={form.ville} onChange={(v) => set('ville', v)} options={VILLES} />
            </div>
            <Field label="Quartier" value={form.quartier} onChange={(v) => set('quartier', v)} placeholder="Mermoz, Yoff, Plateau…" />

            <div className="rounded-xl border border-gray-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Géolocalisation (optionnel)</p>
                <button type="button" onClick={geolocate} className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 shadow-sm">
                  Utiliser ma position
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Améliore la précision des alertes ciblées par rayon.</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Field label="Latitude" value={form.latitude} onChange={(v) => set('latitude', v)} />
                <Field label="Longitude" value={form.longitude} onChange={(v) => set('longitude', v)} />
              </div>
            </div>

            <label className="flex items-start gap-2 rounded-lg border border-gray-100 bg-slate-50 p-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.consentement_rgpd}
                onChange={(e) => set('consentement_rgpd', e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-blood"
              />
              <span>
                Je consens au traitement de mes données médicales par HemoLink et le CNTS, conformément à la
                règlementation de protection des données personnelles au Sénégal.
              </span>
            </label>

            {err && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                ← Retour
              </button>
              <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-blood py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blood-dark disabled:opacity-60">
                {loading ? 'Création…' : "Créer mon compte"}
              </button>
            </div>
            <p className="text-center text-xs text-gray-500">
              Votre compte sera vérifié par le CNTS avant validation définitive.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required, placeholder }) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blood focus:ring-2 focus:ring-blood/10"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  const items = options.map((o) => (typeof o === 'string' ? { v: o, l: o } : o));
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blood focus:ring-2 focus:ring-blood/10"
      >
        {items.map((o) => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>
    </label>
  );
}
