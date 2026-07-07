// =====================================================================
// notify.js — Création de notifications applicatives
// =====================================================================
// Insère des lignes dans la table `notifications`. Comme l'audit, c'est
// du BEST-EFFORT : si l'insertion échoue, on loggue mais on n'interrompt
// JAMAIS la requête métier (une notif perdue < une alerte qui échoue).
//
// Types disponibles (ENUM en base) :
//   alerte_urgente | don_reussi | rappel_eligibilite | validation_profil
//   alerte_resolue | stock_critique | info
// =====================================================================

import { pool } from '../db/pool.js';

/**
 * Crée UNE notification.
 * @param {object} n
 *   n.donneur_id  destinataire donneur (ou null)
 *   n.user_id     destinataire compte staff (ou null)
 *   n.type        un des types de l'ENUM (défaut 'info')
 *   n.titre       titre court affiché dans la liste
 *   n.message     texte complet (optionnel)
 *   n.lien        route front à ouvrir au clic (optionnel)
 *   n.alerte_id   alerte liée (optionnel)
 * @param {object} [conn] connexion/transaction à réutiliser (sinon pool)
 */
export async function notifier(n, conn = pool) {
  try {
    await conn.query(
      `INSERT INTO notifications (user_id, donneur_id, type, titre, message, lien, alerte_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        n.user_id ?? null,
        n.donneur_id ?? null,
        n.type || 'info',
        n.titre,
        n.message ?? null,
        n.lien ?? null,
        n.alerte_id ?? null,
      ]
    );
  } catch (e) {
    console.error('[notify]', e.message);
  }
}

/**
 * Crée la même notification pour PLUSIEURS donneurs (insert en masse).
 * Utilisé lors de la création d'une alerte (1 notif par donneur ciblé).
 */
export async function notifierDonneurs(donneurIds, n, conn = pool) {
  if (!donneurIds?.length) return;
  try {
    const values = donneurIds.map((id) => [
      null, id, n.type || 'info', n.titre, n.message ?? null, n.lien ?? null, n.alerte_id ?? null,
    ]);
    await conn.query(
      'INSERT INTO notifications (user_id, donneur_id, type, titre, message, lien, alerte_id) VALUES ?',
      [values]
    );
  } catch (e) {
    console.error('[notify:masse]', e.message);
  }
}

/**
 * Notifie tous les comptes staff d'un hôpital (users.hopital_id = X).
 */
export async function notifierStaffHopital(hopitalId, n, conn = pool) {
  try {
    const [users] = await conn.query(
      "SELECT id FROM users WHERE hopital_id = ? AND actif = 1 AND role IN ('hopital','cnts','admin')",
      [hopitalId]
    );
    if (!users.length) return;
    const values = users.map((u) => [
      u.id, null, n.type || 'info', n.titre, n.message ?? null, n.lien ?? null, n.alerte_id ?? null,
    ]);
    await conn.query(
      'INSERT INTO notifications (user_id, donneur_id, type, titre, message, lien, alerte_id) VALUES ?',
      [values]
    );
  } catch (e) {
    console.error('[notify:staff]', e.message);
  }
}
