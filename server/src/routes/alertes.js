import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';

const router = Router();

const reponseSchema = z.object({
  reponse: z.enum(['accepte', 'refuse']),
  message_donneur: z.string().max(500).optional().default(''),
});

const statutSchema = z.object({
  statut: z.enum(['en_cours', 'resolue', 'expiree', 'annulee']),
});

// ---------------------------------------------------------------
// GET /api/alertes  (toutes les alertes — staff)
// ---------------------------------------------------------------
router.get('/', requireAuth(), requireRole('hopital', 'cnts', 'admin'), async (req, res) => {
  try {
    let sql = `SELECT a.*, h.nom AS hopital_nom, h.ville AS hopital_ville
               FROM alertes a JOIN hopitaux h ON h.id = a.hopital_id`;
    const params = [];
    if (req.user.role === 'hopital') {
      sql += ' WHERE a.hopital_id = ?';
      params.push(req.user.hopital_id);
    }
    sql += ' ORDER BY a.date_creation DESC LIMIT 200';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur alertes' });
  }
});

// ---------------------------------------------------------------
// GET /api/alertes/mes  (alertes reçues par le donneur connecté)
// ---------------------------------------------------------------
router.get('/mes', requireAuth(), requireRole('donneur'), async (req, res) => {
  try {
    const [[d]] = await pool.query('SELECT id FROM donneurs WHERE user_id = ?', [req.user.id]);
    if (!d) return res.json([]);
    const [rows] = await pool.query(
      `SELECT r.id AS reponse_id, r.reponse, r.distance_km, r.date_notification, r.date_reponse, r.date_lecture,
              a.id AS alerte_id, a.groupe_sanguin, a.niveau_urgence, a.message, a.rayon_km, a.statut, a.date_creation,
              h.id AS hopital_id, h.nom AS hopital_nom, h.ville AS hopital_ville, h.telephone AS hopital_tel,
              h.latitude AS hopital_lat, h.longitude AS hopital_lng
       FROM reponses_alertes r
       JOIN alertes a ON a.id = r.alerte_id
       JOIN hopitaux h ON h.id = a.hopital_id
       WHERE r.donneur_id = ?
       ORDER BY r.date_notification DESC
       LIMIT 100`,
      [d.id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur mes alertes' });
  }
});

// ---------------------------------------------------------------
// POST /api/alertes/:id/repondre  (donneur accepte/refuse)
// ---------------------------------------------------------------
router.post('/:id/repondre', requireAuth(), requireRole('donneur'), validate(reponseSchema), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const alerteId = Number(req.params.id);
    const { reponse, message_donneur } = req.body;

    const [[d]] = await conn.query('SELECT id FROM donneurs WHERE user_id = ?', [req.user.id]);
    if (!d) return res.status(404).json({ error: 'Profil donneur introuvable' });

    const [[existing]] = await conn.query(
      'SELECT id, reponse FROM reponses_alertes WHERE alerte_id = ? AND donneur_id = ?',
      [alerteId, d.id]
    );
    if (!existing) {
      return res.status(404).json({ error: "Vous n'êtes pas destinataire de cette alerte" });
    }
    if (existing.reponse !== 'pas_repondu') {
      return res.status(409).json({ error: 'Vous avez déjà répondu à cette alerte' });
    }

    await conn.beginTransaction();
    await conn.query(
      `UPDATE reponses_alertes SET reponse = ?, message_donneur = ?, date_reponse = NOW()
       WHERE id = ?`,
      [reponse, message_donneur || null, existing.id]
    );

    // Mise à jour des compteurs sur l'alerte
    const [[counts]] = await conn.query(
      `SELECT
        SUM(CASE WHEN reponse <> 'pas_repondu' THEN 1 ELSE 0 END) AS repondus,
        SUM(CASE WHEN reponse = 'accepte' THEN 1 ELSE 0 END) AS acceptes
       FROM reponses_alertes WHERE alerte_id = ?`,
      [alerteId]
    );
    await conn.query(
      `UPDATE alertes SET donneurs_repondus = ?, donneurs_acceptes = ? WHERE id = ?`,
      [counts.repondus || 0, counts.acceptes || 0, alerteId]
    );

    // Auto-résolution si on a assez d'acceptations
    const [[al]] = await conn.query(
      'SELECT poches_necessaires, statut FROM alertes WHERE id = ?',
      [alerteId]
    );
    if (al && al.statut === 'en_cours' && counts.acceptes >= al.poches_necessaires) {
      await conn.query(
        `UPDATE alertes SET statut = 'resolue', date_resolution = NOW() WHERE id = ?`,
        [alerteId]
      );
    }

    await conn.commit();
    await audit(req, 'repondre_alerte', 'alertes', alerteId, { reponse });

    res.json({ ok: true, reponse });
  } catch (e) {
    await conn.rollback().catch(() => {});
    console.error(e);
    res.status(500).json({ error: 'Erreur réponse alerte' });
  } finally {
    conn.release();
  }
});

// ---------------------------------------------------------------
// GET /api/alertes/:id  (détail)
// ---------------------------------------------------------------
router.get('/:id', requireAuth(), async (req, res) => {
  try {
    const [al] = await pool.query(
      `SELECT a.*, h.nom AS hopital_nom, h.ville AS hopital_ville, h.telephone AS hopital_tel,
              h.latitude AS hopital_lat, h.longitude AS hopital_lng
       FROM alertes a JOIN hopitaux h ON h.id = a.hopital_id WHERE a.id = ?`,
      [req.params.id]
    );
    if (!al.length) return res.status(404).json({ error: 'Alerte introuvable' });
    const alerte = al[0];

    // Restriction d'accès : un staff hôpital ne voit que ses alertes
    if (req.user.role === 'hopital' && alerte.hopital_id !== req.user.hopital_id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    // Un donneur ne peut voir que les alertes dans lesquelles il est destinataire
    if (req.user.role === 'donneur') {
      const [[d]] = await pool.query('SELECT id FROM donneurs WHERE user_id = ?', [req.user.id]);
      if (!d) return res.status(403).json({ error: 'Profil introuvable' });
      const [[mine]] = await pool.query(
        'SELECT id FROM reponses_alertes WHERE alerte_id = ? AND donneur_id = ?',
        [alerte.id, d.id]
      );
      if (!mine) return res.status(403).json({ error: 'Accès refusé' });
    }

    const [reponses] = await pool.query(
      `SELECT r.*, d.nom, d.prenom, d.telephone, d.groupe_sanguin, d.ville
       FROM reponses_alertes r JOIN donneurs d ON d.id = r.donneur_id
       WHERE r.alerte_id = ? ORDER BY r.reponse DESC, r.date_reponse`,
      [req.params.id]
    );

    const timeline = [];
    timeline.push({ label: 'Création', date: alerte.date_creation, detail: 'Alerte lancée' });
    for (const r of reponses) {
      if (r.date_reponse) {
        timeline.push({
          label: r.reponse === 'accepte' ? 'Donneur accepte' : 'Donneur refuse',
          date: r.date_reponse,
          detail: `${r.prenom} ${r.nom} (${r.groupe_sanguin})`,
        });
      }
    }
    if (alerte.date_resolution) {
      timeline.push({ label: 'Résolution', date: alerte.date_resolution, detail: 'Alerte clôturée' });
    }
    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ ...alerte, reponses, timeline });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur détail alerte' });
  }
});

// ---------------------------------------------------------------
// PATCH /api/alertes/:id/statut  (résolution / annulation)
// ---------------------------------------------------------------
router.patch('/:id/statut', requireAuth(), requireRole('hopital', 'cnts', 'admin'), validate(statutSchema), async (req, res) => {
  try {
    const { statut } = req.body;
    const [[al]] = await pool.query('SELECT hopital_id FROM alertes WHERE id = ?', [req.params.id]);
    if (!al) return res.status(404).json({ error: 'Alerte introuvable' });
    if (req.user.role === 'hopital' && al.hopital_id !== req.user.hopital_id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const dateRes = statut === 'resolue' ? new Date() : null;
    await pool.query(
      `UPDATE alertes SET statut = ?, date_resolution = COALESCE(?, date_resolution) WHERE id = ?`,
      [statut, dateRes, req.params.id]
    );
    await audit(req, 'update_alerte_statut', 'alertes', Number(req.params.id), { statut });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur mise à jour' });
  }
});

export default router;
