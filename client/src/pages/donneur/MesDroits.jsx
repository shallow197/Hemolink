// =====================================================================
// MesDroits.jsx — Information pédagogique sur vos droits RGPD
// =====================================================================
// Cette page présente uniquement les DROITS. Les actions de gestion de
// compte (désactivation, anonymisation, suppression) sont dans MonProfil.
// Seul le bouton "Exporter mes données" reste ici (non destructif + droit
// à la portabilité).
// =====================================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getToken } from '../../api';

export default function MesDroits() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  async function exporter() {
    setLoading(true); setErr(null); setMsg(null);
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
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setMsg('Vos données ont été téléchargées au format JSON.');
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  const droits = [
    { icone: '👁', titre: 'Droit d\'accès', desc: 'Vous pouvez à tout moment consulter l\'ensemble des données vous concernant depuis votre espace personnel.', base: 'Loi 2008-12 art. 62 · RGPD art. 15' },
    { icone: '✏️', titre: 'Droit de rectification', desc: 'Vous pouvez corriger toute information (téléphone, adresse, disponibilité). Le groupe sanguin ne peut être modifié sans validation par le CNTS.', base: 'Loi 2008-12 art. 68 · RGPD art. 16' },
    { icone: '📥', titre: 'Droit à la portabilité', desc: 'Vous pouvez télécharger l\'intégralité de vos données dans un format lisible et réutilisable (JSON), pour les transférer à un autre service.', base: 'Loi 2008-12 art. 70 · RGPD art. 20' },
    { icone: '⛔', titre: 'Droit d\'opposition', desc: 'Vous pouvez à tout moment cesser de recevoir des alertes (mode "indisponible") sans supprimer votre compte.', base: 'Loi 2008-12 art. 69 · RGPD art. 21' },
    { icone: '🕰', titre: 'Droit à l\'oubli', desc: 'Vous pouvez demander l\'anonymisation ou la suppression complète de vos données. La procédure se fait depuis "Mon profil".', base: 'Loi 2008-12 art. 17 · RGPD art. 17' },
    { icone: '🔒', titre: 'Droit à la sécurité', desc: 'Vos données sont chiffrées, sauvegardées et tracées via un journal d\'audit. Toute action sensible est horodatée.', base: 'Loi 2008-12 art. 71 · RGPD art. 32' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mes droits sur mes données</h2>
        <p className="mt-1 text-sm text-gray-500">
          Conformément à la <strong>Loi 2008-12 du Sénégal</strong> et au <strong>RGPD</strong>,
          vous disposez de droits sur vos données personnelles. Voici lesquels.
        </p>
      </div>

      {/* Bandeau réglementaire */}
      <div className="rounded-2xl border-2 border-blood/40 bg-red-50/40 p-5">
        <p className="text-sm font-semibold text-blood">🇸🇳 Cadre légal sénégalais</p>
        <p className="mt-2 text-sm text-gray-700">
          La <strong>Loi n° 2008-12 du 25 janvier 2008</strong> sur la protection des données personnelles,
          administrée par la <strong>Commission de Protection des Données Personnelles (CDP)</strong>,
          encadre le traitement de vos données médicales par HemoLink.
        </p>
        <p className="mt-2 text-xs text-gray-500">
          En cas de désaccord, vous pouvez saisir directement la CDP — <a href="https://www.cdp.sn" target="_blank" rel="noreferrer" className="font-semibold text-blood underline">www.cdp.sn</a>.
        </p>
      </div>

      {/* Grille des 6 droits */}
      <div className="grid gap-4 md:grid-cols-2">
        {droits.map((d) => (
          <div key={d.titre} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-2xl">{d.icone}</div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900">{d.titre}</h3>
                <p className="mt-1 text-sm text-gray-600">{d.desc}</p>
                <p className="mt-3 text-[10px] uppercase tracking-wide text-gray-400">Base légale : {d.base}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {err && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}
      {msg && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{msg}</div>}

      {/* Actions : téléchargements */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border-2 border-blue-300 bg-blue-50/40 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-200 text-2xl">📥</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-blue-900">Exporter mes données</h3>
              <p className="mt-1 text-sm text-gray-700">
                Téléchargez au format <strong>JSON</strong> l'intégralité de vos données HemoLink : profil,
                historique de dons, alertes reçues. Réutilisable dans un autre service.
              </p>
              <button
                onClick={exporter}
                disabled={loading}
                className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? 'Préparation…' : '📥 Télécharger mes données'}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-gray-300 bg-gray-50 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-200 text-2xl">📄</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">Conditions Générales & Politique de confidentialité</h3>
              <p className="mt-1 text-sm text-gray-700">
                Consultez ou téléchargez le document juridique complet : engagements HemoLink,
                durées de conservation, destinataires, procédures.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/cgu"
                  className="rounded-xl bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-900"
                >
                  📄 Lire les CGU en ligne
                </Link>
                <a
                  href="/HemoLink-CGU.docx"
                  download
                  className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  💾 Télécharger (Word)
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Renvoi vers le profil */}
      <div className="rounded-2xl border border-amber-300 bg-amber-50/40 p-5">
        <p className="text-sm font-semibold text-amber-800">⚙️ Vous voulez agir sur votre compte ?</p>
        <p className="mt-2 text-sm text-gray-700">
          La désactivation temporaire, l'anonymisation ou la suppression définitive de votre compte
          s'effectuent depuis la page <Link to="/mon-espace/profil" className="font-semibold text-blood underline">Mon profil</Link>,
          section « Gestion du compte » (en bas).
        </p>
      </div>

      <p className="text-center text-xs text-gray-500">
        Pour toute question, contactez notre Délégué à la Protection des Données :{' '}
        <a href="mailto:dpo@hemolink.sn" className="font-semibold text-blood">dpo@hemolink.sn</a>
      </p>
    </div>
  );
}
