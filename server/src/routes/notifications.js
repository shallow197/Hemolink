// =====================================================================
// notifications.js — Compteur unifié pour la cloche du header
// =====================================================================
// GET /api/notifications/count → nombre + liste courte des notifications
// pour l'utilisateur connecté, adaptée à son rôle.
// =====================================================================

import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/count', requireAuth(), async (req, res) => {
  try {
    const items = [];
    let total = 0;

    if (req.user.role === 'donneur') {
      // Alertes en attente de réponse
      const [[d]] = await pool.query('SELECT id, prenom FROM donneurs WHERE user_id = ?', [req.user.id]);
      if (d) {
        const [rows] = await pool.query(
          `SELECT r.id, a.id AS alerte_id, a.groupe_sanguin, a.niveau_urgence, h.nom AS hopital_nom
           FROM reponses_alertes r
           JOIN alertes a ON a.id = r.alerte_id
           JOIN hopitaux h ON h.id = a.hopital_id
           WHERE r.donneur_id = ? AND r.reponse = 'pas_repondu' AND a.statut = 'en_cours'
           ORDER BY r.date_notification DESC LIMIT 10`,
          [d.id]
        );
        rows.forEach(r => {
          items.push({
            id: r.id,
            type: 'alerte',
            icone: r.niveau_urgence === 'critique' ? '🚨' : '⚠',
            titre: `Alerte ${r.niveau_urgence} — ${r.groupe_sanguin}`,
            desc: r.hopital_nom,
            lien: `/mon-espace/alertes`,
          });
        });
        total = rows.length;
      }
    } else if (req.user.role === 'hopital') {
      // Alertes actives de mon hôpital
      const [rows] = await pool.query(
        `SELECT id, groupe_sanguin, niveau_urgence, donneurs_contactes, donneurs_acceptes
         FROM alertes WHERE hopital_id = ? AND statut = 'en_cours'
         ORDER BY date_creation DESC LIMIT 10`,
        [req.user.hopital_id]
      );
      rows.forEach(r => {
        items.push({
          id: r.id,
          type: 'alerte_active',
          icone: r.niveau_urgence === 'critique' ? '🚨' : '⚠',
          titre: `Alerte ${r.groupe_sanguin} en cours`,
          desc: `${r.donneurs_acceptes || 0} / ${r.donneurs_contactes} donneurs`,
          lien: `/staff/alertes/${r.id}`,
        });
      });
      total = rows.length;
    } else if (req.user.role === 'cnts' || req.user.role === 'admin') {
      // Comptes en attente de validation
      const [attente] = await pool.query(
        `SELECT id, prenom, nom, groupe_sanguin, ville FROM donneurs
         WHERE en_attente_validation = 1 ORDER BY date_inscription DESC LIMIT 5`
      );
      attente.forEach(d => {
        items.push({
          id: `v-${d.id}`,
          type: 'validation',
          icone: '✅',
          titre: `${d.prenom} ${d.nom} attend validation`,
          desc: `${d.groupe_sanguin} — ${d.ville}`,
          lien: `/staff/donneurs`,
        });
      });
      // SMS en file d'attente
      const [[sms]] = await pool.query(
        `SELECT COUNT(*) AS n FROM notifications_sms WHERE statut = 'en_file'`
      );
      if (sms.n > 0) {
        items.push({
          id: 'sms-queue',
          type: 'sms',
          icone: '📱',
          titre: `${sms.n} SMS en file d'attente`,
          desc: 'À envoyer via Sonatel/Orange',
          lien: `/staff/sms`,
        });
      }
      total = attente.length + (sms.n > 0 ? 1 : 0);
    }

    res.json({ total, items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur notifications' });
  }
});

export default router;
