// =====================================================================
// sms.js — Gestion de la file d'attente SMS (canal secondaire)
// =====================================================================
// En attendant l'intégration API Sonatel/Orange en production, HemoLink
// génère et stocke les SMS dans une file. Le CNTS peut :
//   - visualiser la file d'attente
//   - marquer un SMS comme "envoyé" (simulation)
//   - relancer un SMS en échec
// =====================================================================

import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';

const router = Router();

// GET /api/sms/queue  → liste des SMS avec filtre par statut
router.get('/queue', requireAuth(), requireRole('cnts', 'admin'), async (req, res) => {
  try {
    const { statut } = req.query;
    let sql = `SELECT s.*, a.groupe_sanguin, a.niveau_urgence, h.nom AS hopital_nom,
                      d.prenom, d.nom AS donneur_nom
               FROM notifications_sms s
               JOIN alertes a ON a.id = s.alerte_id
               JOIN hopitaux h ON h.id = a.hopital_id
               JOIN donneurs d ON d.id = s.donneur_id`;
    const params = [];
    if (statut) {
      sql += ' WHERE s.statut = ?';
      params.push(statut);
    }
    sql += ' ORDER BY s.date_creation DESC LIMIT 200';

    const [rows] = await pool.query(sql, params);

    // Stats par statut
    const [[stats]] = await pool.query(
      `SELECT
        SUM(CASE WHEN statut = 'en_file' THEN 1 ELSE 0 END) AS en_file,
        SUM(CASE WHEN statut = 'envoye'  THEN 1 ELSE 0 END) AS envoye,
        SUM(CASE WHEN statut = 'echec'   THEN 1 ELSE 0 END) AS echec,
        SUM(CASE WHEN statut = 'annule'  THEN 1 ELSE 0 END) AS annule,
        COUNT(*) AS total
       FROM notifications_sms`
    );

    res.json({ items: rows, stats });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur file SMS' });
  }
});

// POST /api/sms/:id/envoyer  → marquer un SMS comme envoyé
router.post('/:id/envoyer', requireAuth(), requireRole('cnts', 'admin'), async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications_sms SET statut = 'envoye', date_envoi = NOW() WHERE id = ?`,
      [req.params.id]
    );
    await audit(req, 'sms_envoye', 'notifications_sms', Number(req.params.id));
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur envoi SMS' });
  }
});

// POST /api/sms/envoyer-tout  → envoie tous les SMS en file (batch)
router.post('/envoyer-tout', requireAuth(), requireRole('cnts', 'admin'), async (req, res) => {
  try {
    const [r] = await pool.query(
      `UPDATE notifications_sms SET statut = 'envoye', date_envoi = NOW()
       WHERE statut = 'en_file'`
    );
    await audit(req, 'sms_batch_envoi', 'notifications_sms', null, { affected: r.affectedRows });
    res.json({ ok: true, envoyes: r.affectedRows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur envoi batch SMS' });
  }
});

export default router;
