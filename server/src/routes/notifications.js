// =====================================================================
// notifications.js — Notifications applicatives (page + cloche header)
// =====================================================================
// 4 endpoints :
//   GET   /api/notifications          → liste des notifications du connecté
//                                       (filtres ?type=&lu=&limit=)
//   GET   /api/notifications/count    → compteur + aperçu pour la cloche
//   PATCH /api/notifications/:id/lu   → marquer UNE notification comme lue
//   POST  /api/notifications/tout-lu  → tout marquer comme lu
//
// Résolution du destinataire :
//   • rôle donneur → notifications avec donneur_id = son profil
//                    (+ celles adressées à son user_id)
//   • rôle staff   → notifications avec user_id = son compte
// =====================================================================

import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const TYPES = ['alerte_urgente', 'don_reussi', 'rappel_eligibilite', 'validation_profil', 'alerte_resolue', 'stock_critique', 'info'];

// Icône par type — le front peut s'en servir directement.
const ICONES = {
  alerte_urgente: '🚨',
  don_reussi: '🩸',
  rappel_eligibilite: '⏰',
  validation_profil: '✅',
  alerte_resolue: '🎉',
  stock_critique: '📉',
  info: 'ℹ️',
};

/**
 * Construit la clause WHERE qui cible les notifications du user connecté.
 * Renvoie { where, params } ou null si donneur sans profil.
 */
async function clauseDestinataire(user) {
  if (user.role === 'donneur') {
    const [[d]] = await pool.query('SELECT id FROM donneurs WHERE user_id = ?', [user.id]);
    if (!d) return null;
    return { where: '(n.donneur_id = ? OR n.user_id = ?)', params: [d.id, user.id] };
  }
  return { where: 'n.user_id = ?', params: [user.id] };
}

// ---------------------------------------------------------------
// GET /api/notifications  → liste complète (page Notifications)
// ---------------------------------------------------------------
router.get('/', requireAuth(), async (req, res) => {
  try {
    const dest = await clauseDestinataire(req.user);
    if (!dest) return res.json([]);

    const { type, lu } = req.query;
    const limit = Math.min(Number(req.query.limit) || 100, 200);

    let sql = `SELECT n.*, a.groupe_sanguin AS alerte_groupe, a.niveau_urgence AS alerte_urgence,
                      a.statut AS alerte_statut
               FROM notifications n
               LEFT JOIN alertes a ON a.id = n.alerte_id
               WHERE ${dest.where}`;
    const params = [...dest.params];

    if (type && TYPES.includes(type)) {
      sql += ' AND n.type = ?';
      params.push(type);
    }
    if (lu === '0' || lu === 'false') sql += ' AND n.lu = 0';
    else if (lu === '1' || lu === 'true') sql += ' AND n.lu = 1';

    sql += ' ORDER BY n.date_creation DESC LIMIT ?';
    params.push(limit);

    const [rows] = await pool.query(sql, params);
    res.json(rows.map((r) => ({ ...r, icone: ICONES[r.type] || 'ℹ️' })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur liste notifications' });
  }
});

// ---------------------------------------------------------------
// GET /api/notifications/count  → cloche du header
// ---------------------------------------------------------------
// Combine les notifications NON LUES de la table + les éléments
// "temps réel" propres au rôle (alertes en attente de réponse pour un
// donneur, donneurs à valider pour le CNTS, SMS en file...).
router.get('/count', requireAuth(), async (req, res) => {
  try {
    const items = [];
    let total = 0;

    // 1) Notifications non lues (table notifications)
    const dest = await clauseDestinataire(req.user);
    if (dest) {
      const [notifs] = await pool.query(
        `SELECT n.id, n.type, n.titre, n.message, n.lien
         FROM notifications n WHERE ${dest.where} AND n.lu = 0
         ORDER BY n.date_creation DESC LIMIT 10`,
        dest.params
      );
      notifs.forEach((n) => {
        items.push({
          id: `n-${n.id}`,
          notif_id: n.id,
          type: n.type,
          icone: ICONES[n.type] || 'ℹ️',
          titre: n.titre,
          desc: n.message,
          lien: n.lien || '/notifications',
        });
      });
      const [[{ nb }]] = await pool.query(
        `SELECT COUNT(*) AS nb FROM notifications n WHERE ${dest.where} AND n.lu = 0`,
        dest.params
      );
      total += nb;
    }

    // 2) Éléments "temps réel" selon le rôle
    if (req.user.role === 'donneur') {
      const [[d]] = await pool.query('SELECT id FROM donneurs WHERE user_id = ?', [req.user.id]);
      if (d) {
        const [rows] = await pool.query(
          `SELECT r.id, a.groupe_sanguin, a.niveau_urgence, h.nom AS hopital_nom
           FROM reponses_alertes r
           JOIN alertes a ON a.id = r.alerte_id
           JOIN hopitaux h ON h.id = a.hopital_id
           WHERE r.donneur_id = ? AND r.reponse = 'pas_repondu' AND a.statut = 'en_cours'
           ORDER BY r.date_notification DESC LIMIT 10`,
          [d.id]
        );
        rows.forEach((r) => {
          items.push({
            id: `a-${r.id}`,
            type: 'alerte',
            icone: r.niveau_urgence === 'critique' ? '🚨' : '⚠',
            titre: `Alerte ${r.niveau_urgence} — ${r.groupe_sanguin}`,
            desc: r.hopital_nom,
            lien: '/mon-espace/alertes',
          });
        });
        total += rows.length;
      }
    } else if (req.user.role === 'hopital') {
      const [rows] = await pool.query(
        `SELECT id, groupe_sanguin, niveau_urgence, donneurs_contactes, donneurs_acceptes
         FROM alertes WHERE hopital_id = ? AND statut = 'en_cours'
         ORDER BY date_creation DESC LIMIT 10`,
        [req.user.hopital_id]
      );
      rows.forEach((r) => {
        items.push({
          id: `a-${r.id}`,
          type: 'alerte_active',
          icone: r.niveau_urgence === 'critique' ? '🚨' : '⚠',
          titre: `Alerte ${r.groupe_sanguin} en cours`,
          desc: `${r.donneurs_acceptes || 0} / ${r.donneurs_contactes} donneurs`,
          lien: `/staff/alertes/${r.id}`,
        });
      });
      total += rows.length;
    } else if (req.user.role === 'cnts' || req.user.role === 'admin') {
      const [attente] = await pool.query(
        `SELECT id, prenom, nom, groupe_sanguin, ville FROM donneurs
         WHERE en_attente_validation = 1 ORDER BY date_inscription DESC LIMIT 5`
      );
      attente.forEach((d) => {
        items.push({
          id: `v-${d.id}`,
          type: 'validation',
          icone: '✅',
          titre: `${d.prenom} ${d.nom} attend validation`,
          desc: `${d.groupe_sanguin} — ${d.ville}`,
          lien: '/staff/donneurs',
        });
      });
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
          lien: '/staff/sms',
        });
      }
      total += attente.length + (sms.n > 0 ? 1 : 0);
    }

    res.json({ total, items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur notifications' });
  }
});

// ---------------------------------------------------------------
// PATCH /api/notifications/:id/lu  → marquer comme lue
// ---------------------------------------------------------------
// Sécurité : on ne peut marquer QUE ses propres notifications
// (la clause destinataire est incluse dans le UPDATE).
router.patch('/:id/lu', requireAuth(), async (req, res) => {
  try {
    const dest = await clauseDestinataire(req.user);
    if (!dest) return res.status(404).json({ error: 'Profil introuvable' });

    const [r] = await pool.query(
      `UPDATE notifications n SET n.lu = 1, n.date_lecture = NOW()
       WHERE n.id = ? AND ${dest.where}`,
      [Number(req.params.id), ...dest.params]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Notification introuvable' });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur lecture notification' });
  }
});

// ---------------------------------------------------------------
// POST /api/notifications/tout-lu  → tout marquer comme lu
// ---------------------------------------------------------------
router.post('/tout-lu', requireAuth(), async (req, res) => {
  try {
    const dest = await clauseDestinataire(req.user);
    if (!dest) return res.status(404).json({ error: 'Profil introuvable' });

    const [r] = await pool.query(
      `UPDATE notifications n SET n.lu = 1, n.date_lecture = NOW()
       WHERE n.lu = 0 AND ${dest.where}`,
      dest.params
    );
    res.json({ ok: true, marquees: r.affectedRows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur tout-lu' });
  }
});

export default router;

// =====================================================================
// EXPLICATION POUR LA SOUTENANCE (20 secondes) :
// ---------------------------------------------------------------------
// La table notifications stocke des messages TYPÉS (alerte urgente, don
// réussi, rappel d'éligibilité, validation de profil...). Chaque type a
// son icône. Le front (Pôle 5) appelle GET /api/notifications pour la
// page "Notifications" (avec filtre ?type=), et /count pour la cloche.
// Un donneur ne voit que SES notifications : la clause destinataire est
// recalculée côté serveur à partir du JWT — impossible de lire celles
// d'un autre.
// =====================================================================
