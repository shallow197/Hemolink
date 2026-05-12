import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { groupesCompatiblesPourReceveur } from '../utils/blood.js';
import { distanceKm } from '../utils/geo.js';
import { audit } from '../utils/audit.js';

const router = Router();

const GROUPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const alerteSchema = z.object({
  hopital_id: z.number().int().positive().optional(),
  groupe_sanguin: z.enum(GROUPES),
  niveau_urgence: z.enum(['critique', 'urgent', 'normal']),
  message: z.string().max(1000).optional().default(''),
  rayon_km: z.number().int().positive().max(9999),
  poches_necessaires: z.number().int().positive().max(50).optional().default(1),
});

const stockSchema = z.object({
  groupe_sanguin: z.enum(GROUPES),
  quantite_poches: z.number().int().min(0),
  seuil_critique: z.number().int().min(0).optional(),
});

// ---------------------------------------------------------------
// GET /api/hopitaux  (liste publique + stocks)
// ---------------------------------------------------------------
router.get('/', async (_req, res) => {
  try {
    const [hopitaux] = await pool.query(
      `SELECT h.*, r.nom AS region_nom
       FROM hopitaux h LEFT JOIN regions r ON r.id = h.region_id
       ORDER BY h.type, h.nom`
    );
    const [stocks] = await pool.query(
      'SELECT hopital_id, groupe_sanguin, quantite_poches, seuil_critique, date_maj FROM stocks_sang ORDER BY hopital_id, groupe_sanguin'
    );
    const byH = {};
    for (const h of hopitaux) {
      byH[h.id] = { ...h, stocks: [] };
    }
    for (const s of stocks) {
      if (byH[s.hopital_id]) {
        const critique = s.quantite_poches < s.seuil_critique;
        byH[s.hopital_id].stocks.push({
          ...s,
          niveau: critique ? 'critique' : s.quantite_poches < s.seuil_critique * 2 ? 'faible' : 'ok',
        });
      }
    }
    res.json(Object.values(byH));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur hôpitaux' });
  }
});

// ---------------------------------------------------------------
// GET /api/hopitaux/:id
// ---------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const [[h]] = await pool.query(
      `SELECT h.*, r.nom AS region_nom FROM hopitaux h LEFT JOIN regions r ON r.id = h.region_id WHERE h.id = ?`,
      [req.params.id]
    );
    if (!h) return res.status(404).json({ error: 'Hôpital introuvable' });
    const [stocks] = await pool.query(
      'SELECT * FROM stocks_sang WHERE hopital_id = ? ORDER BY groupe_sanguin',
      [req.params.id]
    );
    res.json({ ...h, stocks });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur fiche hôpital' });
  }
});

// ---------------------------------------------------------------
// PUT /api/hopitaux/:id/stocks/:groupe  (édition d'un stock)
// ---------------------------------------------------------------
router.put('/:id/stocks/:groupe', requireAuth(), requireRole('hopital', 'cnts', 'admin'), validate(stockSchema), async (req, res) => {
  try {
    const hopitalId = Number(req.params.id);
    const groupe = req.params.groupe;
    if (req.user.role === 'hopital' && req.user.hopital_id !== hopitalId) {
      return res.status(403).json({ error: 'Vous ne gérez pas cet hôpital' });
    }
    const { quantite_poches, seuil_critique } = req.body;
    await pool.query(
      `INSERT INTO stocks_sang (hopital_id, groupe_sanguin, quantite_poches, seuil_critique)
       VALUES (?, ?, ?, COALESCE(?, 5))
       ON DUPLICATE KEY UPDATE quantite_poches = VALUES(quantite_poches),
         seuil_critique = COALESCE(VALUES(seuil_critique), seuil_critique)`,
      [hopitalId, groupe, quantite_poches, seuil_critique ?? null]
    );
    await audit(req, 'update_stock', 'stocks_sang', hopitalId, { groupe, quantite_poches, seuil_critique });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur mise à jour stock' });
  }
});

// ---------------------------------------------------------------
// POST /api/hopitaux/alerte  (lance une nouvelle alerte)
// ---------------------------------------------------------------
router.post('/alerte', requireAuth(), requireRole('hopital', 'cnts', 'admin'), validate(alerteSchema), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    let { hopital_id, groupe_sanguin, niveau_urgence, message, rayon_km, poches_necessaires } = req.body;

    // Sécurité : un staff hôpital ne peut lancer une alerte que pour son hôpital
    if (req.user.role === 'hopital') {
      hopital_id = req.user.hopital_id;
    }
    if (!hopital_id) {
      return res.status(400).json({ error: 'hopital_id requis' });
    }

    if (rayon_km >= 9000) rayon_km = 9999;

    const [[h]] = await conn.query('SELECT latitude, longitude FROM hopitaux WHERE id = ?', [hopital_id]);
    if (!h) {
      return res.status(404).json({ error: 'Hôpital introuvable' });
    }

    const [ins] = await conn.query(
      `INSERT INTO alertes (hopital_id, cree_par_user_id, groupe_sanguin, niveau_urgence, message, rayon_km,
        poches_necessaires, statut, donneurs_contactes, donneurs_repondus, donneurs_acceptes)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'en_cours', 0, 0, 0)`,
      [hopital_id, req.user.id, groupe_sanguin, niveau_urgence, message || '', rayon_km, poches_necessaires]
    );
    const alerteId = ins.insertId;

    const groupes = groupesCompatiblesPourReceveur(groupe_sanguin);
    const [donneurs] = await conn.query(
      `SELECT id, latitude, longitude, disponible, en_attente_validation, groupe_sanguin
       FROM donneurs WHERE latitude IS NOT NULL AND longitude IS NOT NULL`
    );

    const useRadius = rayon_km < 9000;
    const cibles = [];
    for (const d of donneurs) {
      if (!d.disponible || d.en_attente_validation) continue;
      if (!groupes.includes(d.groupe_sanguin)) continue;
      let dist = null;
      if (h.latitude != null && h.longitude != null && d.latitude != null && d.longitude != null) {
        dist = distanceKm(Number(h.latitude), Number(h.longitude), Number(d.latitude), Number(d.longitude));
        if (useRadius && dist > rayon_km) continue;
      } else if (useRadius) {
        continue;
      }
      cibles.push({ id: d.id, dist });
    }

    await conn.query('UPDATE alertes SET donneurs_contactes = ? WHERE id = ?', [cibles.length, alerteId]);

    if (cibles.length) {
      const values = cibles.map((c) => [alerteId, c.id, 'pas_repondu', c.dist != null ? c.dist.toFixed(2) : null]);
      await conn.query(
        'INSERT INTO reponses_alertes (alerte_id, donneur_id, reponse, distance_km) VALUES ?',
        [values]
      );
    }

    await audit(req, 'create_alerte', 'alertes', alerteId, { groupe_sanguin, niveau_urgence, rayon_km, cibles: cibles.length });

    res.status(201).json({
      id: alerteId,
      donneurs_contactes: cibles.length,
      donneur_ids: cibles.map((c) => c.id),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur création alerte' });
  } finally {
    conn.release();
  }
});

export default router;
