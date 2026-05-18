// =====================================================================
// MesAlertes.jsx — Boîte de réception des alertes côté DONNEUR
// =====================================================================
// Cette page est le CŒUR DE L'EXPÉRIENCE DONNEUR : c'est ici qu'Aminata
// voit l'appel au don urgent et peut accepter en un clic.
//
// Deux sections :
//   1. "Réponses attendues" : alertes en cours auxquelles elle n'a pas
//      encore répondu → boutons J'accepte / Pas cette fois
//   2. "Historique" : alertes passées (déjà répondues ou clôturées)
//
// Polling : on rafraîchit toutes les 20s pour voir les nouvelles alertes.
// =====================================================================

import { useCallback, useEffect, useState } from 'react';
import { fetchJson } from '../../api';
import { usePoll } from '../../hooks/usePoll.js';

export default function MesAlertes() {
  // États : liste des alertes, message d'erreur éventuel, alerte en cours d'envoi
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(null); // id de l'alerte en cours de réponse (anti double-clic)

  // --- Chargement des alertes du donneur connecté ---
  // useCallback pour que la référence de la fonction soit stable
  // (sinon le polling se réenregistre à chaque rendu).
  const load = useCallback(async () => {
    try {
      const data = await fetchJson('/api/alertes/mes');
      setRows(data);
    } catch (e) {
      setErr(e.message);
    }
  }, []);

  // Chargement initial au montage du composant
  useEffect(() => { load(); }, [load]);

  // Polling : ré-appelle load() toutes les 20s en arrière-plan
  // → si une nouvelle alerte arrive, elle apparaît sans rafraîchir la page
  usePoll(load, 20000, [load]);

  // --- Action : accepter ou refuser une alerte ---
  // POST /api/alertes/:id/repondre, puis on recharge la liste
  async function repondre(alerteId, reponse) {
    setBusy(alerteId);
    try {
      await fetchJson(`/api/alertes/${alerteId}/repondre`, {
        method: 'POST',
        body: JSON.stringify({ reponse }),
      });
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  }

  // --- Tri des alertes en deux groupes ---
  // "En attente" : alertes actives où le donneur n'a pas encore répondu
  // "Historique" : tout le reste (refusé, accepté, expiré, etc.)
  const enAttente = rows.filter((a) => a.reponse === 'pas_repondu' && a.statut === 'en_cours');
  const historique = rows.filter((a) => a.reponse !== 'pas_repondu' || a.statut !== 'en_cours');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mes alertes</h2>
        <p className="text-sm text-gray-500">Appels au don reçus dans votre zone</p>
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>
      )}

      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Réponses attendues ({enAttente.length})
        </h3>
        {enAttente.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-400 shadow-sm">
            Aucune alerte ne vous attend pour le moment. Merci d'être disponible.
          </div>
        ) : (
          <div className="space-y-3">
            {enAttente.map((a) => (
              <article key={a.reponse_id} className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm ring-1 ring-red-100">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <UrgenceBadge niveau={a.niveau_urgence} />
                    <h4 className="mt-2 text-lg font-bold text-gray-900">
                      {a.hopital_nom} — {a.groupe_sanguin}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {a.hopital_ville} · {Number(a.distance_km || 0).toFixed(1)} km de chez vous
                    </p>
                    {a.message && (
                      <p className="mt-3 rounded-lg border border-red-100 bg-white px-3 py-2 text-sm text-gray-700 italic">
                        "{a.message}"
                      </p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      Reçue {new Date(a.date_notification).toLocaleString('fr-FR')} · Contact :{' '}
                      <a href={`tel:${a.hopital_tel}`} className="font-medium text-blood hover:underline">{a.hopital_tel}</a>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => repondre(a.alerte_id, 'accepte')}
                      disabled={busy === a.alerte_id}
                      className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                    >
                      ✓ J'accepte
                    </button>
                    <button
                      onClick={() => repondre(a.alerte_id, 'refuse')}
                      disabled={busy === a.alerte_id}
                      className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      Pas cette fois
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Historique ({historique.length})
        </h3>
        {historique.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-400 shadow-sm">
            Aucune réponse passée.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Hôpital</th>
                  <th className="px-4 py-3">Groupe</th>
                  <th className="px-4 py-3">Distance</th>
                  <th className="px-4 py-3">Ma réponse</th>
                  <th className="px-4 py-3">Statut alerte</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {historique.map((a) => (
                  <tr key={a.reponse_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{a.hopital_nom}</td>
                    <td className="px-4 py-3 text-gray-700">{a.groupe_sanguin}</td>
                    <td className="px-4 py-3 text-gray-500">{Number(a.distance_km || 0).toFixed(1)} km</td>
                    <td className="px-4 py-3"><ReponseBadge reponse={a.reponse} /></td>
                    <td className="px-4 py-3 capitalize text-gray-500">{a.statut.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-gray-400">{new Date(a.date_notification).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function UrgenceBadge({ niveau }) {
  const m = {
    critique: 'bg-red-100 text-red-700 font-bold',
    urgent:   'bg-orange-100 text-orange-700 font-semibold',
    normal:   'bg-gray-100 text-gray-600',
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] uppercase tracking-wide ${m[niveau] || m.normal}`}>{niveau}</span>;
}

function ReponseBadge({ reponse }) {
  const map = {
    accepte:     { c: 'bg-emerald-100 text-emerald-700', l: 'Accepté' },
    refuse:      { c: 'bg-gray-100 text-gray-600', l: 'Refusé' },
    pas_repondu: { c: 'bg-amber-100 text-amber-700', l: 'En attente' },
  };
  const v = map[reponse] || map.pas_repondu;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${v.c}`}>{v.l}</span>;
}

// =====================================================================
// EXPLICATION POUR LA SOUTENANCE (25 secondes) :
// ---------------------------------------------------------------------
// C'est LA page qui justifie l'application côté donneur. Quand Aminata
// reçoit une alerte de l'hôpital Fann (sang O- critique), cette page
// affiche en haut un bandeau rouge appelant son attention immédiate.
// Deux boutons : "J'accepte" et "Pas cette fois". Un clic et c'est fini.
// Le polling (toutes les 20s) fait que si elle ouvre l'app sans
// rafraîchir, les nouvelles alertes apparaissent en direct.
// Le `setBusy` empêche les double-clics qui créeraient des doubles
// réponses (le backend renverrait 409 mais autant éviter). En dessous,
// l'historique pour qu'elle se souvienne des alertes auxquelles elle
// a participé. Tout est mobile-first (Tailwind responsive).
// =====================================================================
