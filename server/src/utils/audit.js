import { pool } from '../db/pool.js';

/**
 * Enregistre une action sensible dans audit_log.
 * Best-effort : n'interrompt pas la requête en cas d'échec.
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
    console.error('[audit]', e.message);
  }
}
