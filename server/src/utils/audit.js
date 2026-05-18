// =====================================================================
// audit.js — Journal d'audit (traçabilité des actions sensibles)
// =====================================================================
// Chaque action importante (login, création d'alerte, validation de
// donneur, modification de stock) est tracée dans la table audit_log.
// Exigence forte du CNTS pour conformité réglementaire médicale.
// =====================================================================

import { pool } from '../db/pool.js';

/**
 * Insère une ligne dans audit_log.
 *   req     : la requête Express (pour récupérer userId et IP)
 *   action  : libellé court (ex: 'create_alerte', 'login')
 *   cible   : nom de la table affectée (optionnel)
 *   cibleId : id de l'entité affectée (optionnel)
 *   details : objet JSON sérialisé (contexte additionnel)
 *
 * Best-effort : si l'INSERT échoue (DB down etc.), on log mais on
 * n'interrompt PAS la requête en cours — l'audit ne doit pas casser
 * le métier.
 */
export async function audit(req, action, cible = null, cibleId = null, details = null) {
  try {
    const userId = req?.user?.id ?? null;
    const ip = req?.ip || req?.headers?.['x-forwarded-for'] || null;
    await pool.query(
      `INSERT INTO audit_log (user_id, action, cible, cible_id, details, ip)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, action, cible, cibleId, details ? JSON.stringify(details) : null, ip]
    );
  } catch (e) {
    // On loggue mais on n'interrompt pas la requête métier
    console.error('[audit]', e.message);
  }
}

// =====================================================================
// EXPLICATION POUR LA SOUTENANCE (10 secondes) :
// ---------------------------------------------------------------------
// Quand on parlait au CNTS, ils nous ont dit qu'un système médical doit
// pouvoir RETROUVER qui a fait quoi quand. C'est exactement ce que fait
// cette fonction : à chaque action sensible (login, création d'alerte,
// validation de donneur, modif de stock), une ligne est insérée dans
// audit_log avec user_id, action, cible, détails et IP. C'est le pilier
// de la conformité réglementaire. En production, ces logs pourraient
// être exportés vers un SIEM (Splunk, ELK) pour analyse.
// =====================================================================
