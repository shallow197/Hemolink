import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, Panel } from '../../components/ui.jsx';
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
    <div className="hl-page">
      <div>
        <h1 className="hl-page-title">Mon profil</h1>
        <p className="text-sm text-gray-500">
          {user?.email} · Groupe sanguin{' '}
          <span className="font-semibold text-blood">{data?.donneur?.groupe_sanguin}</span>
        </p>
      </div>

      {data?.donneur?.en_attente_validation && (
        <p className="hl-alert-warning">
          Votre compte est en attente de validation par le CNTS. Vous pouvez modifier votre profil mais
          vous ne recevrez pas encore d&apos;alertes.
        </p>
      )}

      <form onSubmit={submit} className="grid gap-6 md:grid-cols-2">
        <Panel title="Identité">
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
        </Panel>

        <Panel title="Localisation & disponibilité">
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
        </Panel>

        <div className="md:col-span-2">
          {err && <p className="hl-alert-error mb-3">{err}</p>}
          {msg && <p className="mb-3 rounded-xl border border-emerald-200/80 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</p>}
          <button type="submit" disabled={saving} className="hl-btn-primary disabled:opacity-60">
            {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>

      {/* Section Gestion du compte (les actions RGPD) */}
      <GestionCompte />
    </div>
  );
}

function GestionCompte() {
  const [confirmation, setConfirmation] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [dispo, setDispo] = useState(null); // état actuel du donneur

  // On charge l'état "disponible" du donneur pour adapter le bouton Désactiver/Réactiver
  useEffect(() => {
    fetchJson('/api/donneurs/me')
      .then(d => setDispo(Boolean(d?.donneur?.disponible)))
      .catch(() => setDispo(true));
  }, []);

  async function executer(action) {
    setLoading(true);
    try {
      let msg;
      if (action === 'anonymiser') {
        const r = await fetch('/api/donneurs/me/anonymiser', {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('hemolink_token')}` },
        }).then(r => r.json());
        msg = r.message || 'Compte anonymisé.';
      } else if (action === 'supprimer') {
        const r = await fetch('/api/donneurs/me', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${localStorage.getItem('hemolink_token')}` },
        }).then(r => r.json());
        msg = r.message || 'Compte supprimé.';
      } else if (action === 'desactiver' || action === 'reactiver') {
        // Toggle disponibilité
        const nouveauDispo = action === 'reactiver';
        await fetch('/api/donneurs/me', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('hemolink_token')}`,
          },
          body: JSON.stringify({ disponible: nouveauDispo }),
        });
        msg = nouveauDispo
          ? '✓ Votre compte est réactivé. Vous recevrez à nouveau les alertes compatibles avec votre profil.'
          : '⏸ Votre compte est désactivé : vous ne recevez plus d\'alertes. Vous pouvez le réactiver à tout moment depuis cette même page.';
      }
      alert(msg);
      if (action !== 'desactiver' && action !== 'reactiver') {
        localStorage.removeItem('hemolink_token');
        window.location.href = '/accueil';
      } else {
        // Mise à jour locale sans recharger toute la page
        setDispo(action === 'reactiver');
      }
    } catch (e) {
      alert('Erreur : ' + e.message);
    } finally {
      setLoading(false);
      setConfirmation(null);
      setConfirmText('');
    }
  }

  const isDesactive = dispo === false;

  return (
    <section className="mt-8 rounded-2xl border-2 border-red-300 bg-red-50/30 p-6">
      <h3 className="text-lg font-bold text-red-800">⚠ Gestion du compte</h3>
      <p className="mt-1 text-sm text-gray-600">
        Ces actions concernent la vie de votre compte. Elles sont réversibles ou non selon le cas.
        <Link to="/mon-espace/droits" className="ml-1 font-semibold text-blood underline">Voir mes droits →</Link>
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {/* Option C — Désactivation / Réactivation (toggle) */}
        {isDesactive ? (
          <div className="rounded-xl border-2 border-emerald-400 bg-white p-4">
            <div className="mb-2 text-2xl">▶</div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-emerald-800">Réactiver mon compte</h4>
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
                Désactivé
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-600">
              Votre compte est actuellement en pause. Réactivez-le pour recevoir à nouveau des alertes ciblées.
            </p>
            <button
              onClick={() => setConfirmation('reactiver')}
              disabled={loading}
              className="mt-3 w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              ▶ Réactiver
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-300 bg-white p-4">
            <div className="mb-2 text-2xl">⏸</div>
            <h4 className="font-bold text-amber-900">Désactiver temporairement</h4>
            <p className="mt-1 text-xs text-gray-600">
              Vous ne recevez plus d'alertes. Vos données sont conservées. <strong>Réversible</strong> depuis cette page.
            </p>
            <button
              onClick={() => setConfirmation('desactiver')}
              disabled={loading || dispo === null}
              className="mt-3 w-full rounded-lg bg-amber-600 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              ⏸ Désactiver
            </button>
          </div>
        )}

        {/* Option B — anonymisation recommandée */}
        <div className="rounded-xl border-2 border-emerald-400 bg-white p-4">
          <div className="mb-2 text-2xl">👤</div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-emerald-800">Anonymiser</h4>
            <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">Recommandé</span>
          </div>
          <p className="mt-1 text-xs text-gray-600">
            Identité effacée, historique médical conservé de façon anonyme pour la santé publique.
          </p>
          <button
            onClick={() => { setConfirmation('anonymiser'); setConfirmText(''); }}
            className="mt-3 w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Anonymiser
          </button>
        </div>

        {/* Option A — suppression totale */}
        <div className="rounded-xl border border-red-400 bg-white p-4">
          <div className="mb-2 text-2xl">🗑</div>
          <h4 className="font-bold text-red-800">Supprimer définitivement</h4>
          <p className="mt-1 text-xs text-gray-600">
            Compte + historique médical <strong>effacés définitivement</strong>. Irréversible.
          </p>
          <button
            onClick={() => { setConfirmation('supprimer'); setConfirmText(''); }}
            className="mt-3 w-full rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Supprimer
          </button>
        </div>
      </div>

      {confirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">
              {confirmation === 'desactiver' && '⏸ Confirmer la désactivation'}
              {confirmation === 'reactiver'  && '▶ Confirmer la réactivation'}
              {confirmation === 'anonymiser' && '👤 Confirmer l\'anonymisation'}
              {confirmation === 'supprimer'  && '🗑 Confirmer la suppression'}
            </h3>
            <p className="mt-3 text-sm text-gray-700">
              {confirmation === 'desactiver' && 'Votre disponibilité passera à "Non disponible". Vous pourrez réactiver à tout moment depuis cette même page.'}
              {confirmation === 'reactiver'  && 'Votre compte redeviendra disponible et vous recevrez à nouveau les alertes compatibles.'}
              {confirmation === 'anonymiser' && 'Votre identité sera effacée. Cette action est irréversible.'}
              {confirmation === 'supprimer'  && 'Votre compte et toutes vos données seront supprimés définitivement. Irréversible.'}
            </p>
            {confirmation !== 'desactiver' && confirmation !== 'reactiver' && (
              <>
                <p className="mt-3 text-xs text-gray-500">Pour confirmer, tapez <strong>CONFIRMER</strong> :</p>
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  autoFocus
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase"
                  placeholder="CONFIRMER"
                />
              </>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmation(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={() => executer(confirmation)}
                disabled={
                  loading ||
                  (confirmation !== 'desactiver' && confirmation !== 'reactiver' && confirmText.trim() !== 'CONFIRMER')
                }
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                  confirmation === 'supprimer'  ? 'bg-red-600 hover:bg-red-700'
                  : confirmation === 'anonymiser' ? 'bg-emerald-600 hover:bg-emerald-700'
                  : confirmation === 'reactiver'  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {loading ? '…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="hl-label-field">
      {label}
      <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="hl-input" />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="hl-label-field">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="hl-input">
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}
