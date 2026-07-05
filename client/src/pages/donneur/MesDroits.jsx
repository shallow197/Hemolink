// =====================================================================
// MesDroits.jsx — Espace RGPD du donneur (Loi 2008-12 Sénégal + RGPD)
// =====================================================================
// Trois actions disponibles, avec confirmation explicite :
//   1. Exporter mes données   → GET /api/donneurs/me/export (téléchargement JSON)
//   2. Anonymiser mon compte  → POST /api/donneurs/me/anonymiser
//   3. Supprimer définitivement → DELETE /api/donneurs/me
// =====================================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchJson, getToken } from '../../api';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function MesDroits() {
  const { logout, user } = useAuth();
  const nav = useNavigate();
  const [confirmation, setConfirmation] = useState(null); // 'anonymiser' | 'supprimer' | null
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);

  // --- Action 1 : Export JSON (droit à la portabilité) ---
  async function exporter() {
    setErr(null); setMsg(null); setLoading(true);
    try {
      const res = await fetch('/api/donneurs/me/export', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Erreur export');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hemolink-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMsg('Vos données ont été téléchargées au format JSON.');
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  // --- Action 2 : Anonymisation (option B - recommandée) ---
  async function anonymiser() {
    setErr(null); setLoading(true);
    try {
      const r = await fetchJson('/api/donneurs/me/anonymiser', { method: 'POST' });
      alert(r.message || 'Votre compte a été anonymisé.');
      await logout();
      nav('/accueil', { replace: true });
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
      setConfirmation(null);
    }
  }

  // --- Action 3 : Suppression totale (option A - droit à l'oubli) ---
  async function supprimer() {
    setErr(null); setLoading(true);
    try {
      const r = await fetchJson('/api/donneurs/me', { method: 'DELETE' });
      alert(r.message || 'Votre compte a été supprimé.');
      await logout();
      nav('/accueil', { replace: true });
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
      setConfirmation(null);
    }
  }

  const motCle = user?.donneur ? (user.donneur.nom || '').toUpperCase() : 'SUPPRIMER';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mes droits sur mes données</h2>
        <p className="text-sm text-gray-500">
          Vous avez le contrôle total. Conformément à la <strong>Loi 2008-12 du Sénégal</strong> et au <strong>RGPD</strong>,
          trois actions sont à votre disposition. <Link to="/cgu" className="font-semibold text-blood hover:underline">Voir les CGU →</Link>
        </p>
      </div>

      {err && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}
      {msg && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{msg}</div>}

      {/* OPTION 1 — EXPORT */}
      <article className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-2xl">📥</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-blue-800">Exporter mes données</h3>
            <p className="mt-1 text-sm text-gray-600">
              Téléchargez l'intégralité de vos données HemoLink (profil, historique de dons, alertes reçues)
              dans un fichier <strong>JSON réutilisable</strong>. Aucun impact sur votre compte.
            </p>
            <p className="mt-2 text-xs text-gray-400">Base légale : Loi 2008-12 art. 70 — RGPD art. 20</p>
            <button
              onClick={exporter}
              disabled={loading}
              className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Préparation…' : '📥 Télécharger mes données (JSON)'}
            </button>
          </div>
        </div>
      </article>

      {/* OPTION 2 — ANONYMISATION (RECOMMANDÉE) */}
      <article className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-2xl">👤</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-emerald-800">Anonymiser mon compte</h3>
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Recommandé</span>
            </div>
            <p className="mt-1 text-sm text-gray-700">
              Votre compte est supprimé. <strong>Vos données identitaires (nom, téléphone, géolocalisation) sont effacées
              irrémédiablement</strong>, mais l'historique anonyme de vos dons reste utile aux statistiques nationales du CNTS.
              <span className="block mt-2 italic">C'est l'option qui concilie votre droit à l'oubli et la mission de santé publique.</span>
            </p>
            <p className="mt-2 text-xs text-gray-400">Base légale : Loi 2008-12 art. 17 — RGPD art. 17</p>
            <button
              onClick={() => { setConfirmation('anonymiser'); setConfirmText(''); }}
              disabled={loading}
              className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              👤 Anonymiser mon compte
            </button>
          </div>
        </div>
      </article>

      {/* OPTION 3 — SUPPRESSION TOTALE */}
      <article className="rounded-2xl border-2 border-red-300 bg-red-50/40 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-200 text-2xl">🗑</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-800">Supprimer définitivement mon compte</h3>
            <p className="mt-1 text-sm text-gray-700">
              Votre compte ET toutes vos données médicales (historique de dons, réponses aux alertes) sont
              <strong> effacés définitivement</strong>. Action <strong>irréversible</strong>.
              <span className="block mt-2 italic text-red-700">⚠ Vous perdez la traçabilité de vos anciens dons (utile en cas d'enquête post-transfusion).</span>
            </p>
            <p className="mt-2 text-xs text-gray-400">Base légale : Loi 2008-12 art. 17 — RGPD art. 17 (droit à l'oubli)</p>
            <button
              onClick={() => { setConfirmation('supprimer'); setConfirmText(''); }}
              disabled={loading}
              className="mt-4 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
            >
              🗑 Supprimer définitivement mon compte
            </button>
          </div>
        </div>
      </article>

      <p className="pt-4 text-xs text-gray-500">
        Pour toute question, contactez notre Délégué à la Protection des Données :
        <a href="mailto:dpo@hemolink.sn" className="ml-1 font-semibold text-blood">dpo@hemolink.sn</a>
      </p>

      {/* MODALE DE CONFIRMATION */}
      {confirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900">
              {confirmation === 'anonymiser' ? '👤 Confirmer l\'anonymisation' : '🗑 Confirmer la suppression définitive'}
            </h3>
            <p className="mt-3 text-sm text-gray-700">
              {confirmation === 'anonymiser'
                ? 'Votre identité va être effacée de HemoLink. Cette action est irréversible.'
                : 'Votre compte ET toutes vos données vont être supprimés définitivement. Cette action est irréversible.'}
            </p>
            <p className="mt-3 text-xs text-gray-500">
              Pour confirmer, tapez votre nom de famille en MAJUSCULES : <strong className="text-gray-900">{motCle}</strong>
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoFocus
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase tracking-wider text-gray-900"
              placeholder={motCle}
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmation(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={loading || confirmText.trim() !== motCle}
                onClick={() => (confirmation === 'anonymiser' ? anonymiser() : supprimer())}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50 ${
                  confirmation === 'anonymiser' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {loading ? 'En cours…' : (confirmation === 'anonymiser' ? 'Anonymiser' : 'Supprimer définitivement')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
