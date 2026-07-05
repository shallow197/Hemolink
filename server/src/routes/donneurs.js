import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { calculerEligibilite } from '../utils/eligibility.js';
import { audit } from '../utils/audit.js';

const router = Router();

const GROUPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function badgeStatut(row) {
  if (row.en_attente_validation) return 'en_attente';
  if (row.disponible) return 'disponible';
  return 'indisponible';
}

const createDonneurSchema = z.object({
  nom: z.string().min(2),
  prenom: z.string().min(2),
  telephone: z.string().min(7),
  email: z.string().email().optional().nullable(),
  date_naissance: z.string().optional().nullable(),
  sexe: z.enum(['homme', 'femme', 'autre']).optional().default('autre'),
  groupe_sanguin: z.enum(GROUPES),
  poids_kg: z.number().positive().optional().nullable(),
  region_id: z.number().int().positive().optional().nullable(),
  ville: z.string().min(1),
  quartier: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  disponible: z.boolean().optional().default(true),
  en_attente_validation: z.boolean().optional().default(false),
  derniere_date_don: z.string().optional().nullable(),
});

const updateProfileSchema = z.object({
  nom: z.string().min(2).optional(),
  prenom: z.string().min(2).optional(),
  telephone: z.string().min(7).optional(),
  email: z.string().email().optional().nullable(),
  date_naissance: z.string().optional().nullable(),
  sexe: z.enum(['homme', 'femme', 'autre']).optional(),
  poids_kg: z.number().positive().optional().nullable(),
  ville: z.string().optional(),
  quartier: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  disponible: z.boolean().optional(),
});

// ---------------------------------------------------------------
// GET /api/donneurs  (staff hôpital, CNTS, admin)
// ---------------------------------------------------------------
router.get('/', requireAuth(), requireRole('hopital', 'cnts', 'admin'), async (req, res) => {
  try {
    const { groupe_sanguin, ville, disponible, validation } = req.query;
    let sql = `SELECT id, user_id, nom, prenom, telephone, email, sexe, groupe_sanguin, poids_kg,
      ville, quartier, region_id, latitude, longitude,
      disponible, en_attente_validation, derniere_date_don, nombre_dons, date_inscription
      FROM donneurs WHERE 1=1`;
    const params = [];
    if (groupe_sanguin) {
      sql += ' AND groupe_sanguin = ?';
      params.push(groupe_sanguin);
    }
    if (ville) {
      sql += ' AND ville LIKE ?';
      params.push(`%${ville}%`);
    }
    if (disponible === '1' || disponible === 'true') {
      sql += ' AND disponible = 1 AND en_attente_validation = 0';
    } else if (disponible === '0' || disponible === 'false') {
      sql += ' AND disponible = 0';
    }
    if (validation === 'attente') {
      sql += ' AND en_attente_validation = 1';
    } else if (validation === 'valide') {
      sql += ' AND en_attente_validation = 0';
    }
    sql += ' ORDER BY en_attente_validation DESC, nom, prenom';
    const [rows] = await pool.query(sql, params);
    const withBadge = rows.map((r) => ({ ...r, statut_badge: badgeStatut(r) }));
    res.json(withBadge);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur liste donneurs' });
  }
});

// ---------------------------------------------------------------
// GET /api/donneurs/me  (espace donneur)
// ---------------------------------------------------------------
router.get('/me', requireAuth(), requireRole('donneur'), async (req, res) => {
  try {
    const [[d]] = await pool.query('SELECT * FROM donneurs WHERE user_id = ?', [req.user.id]);
    if (!d) return res.status(404).json({ error: 'Profil donneur introuvable' });

    const eligibilite = calculerEligibilite(d);

    const [historique] = await pool.query(
      `SELECT hd.*, h.nom AS hopital_nom
       FROM historique_dons hd
       JOIN hopitaux h ON h.id = hd.hopital_id
       WHERE hd.donneur_id = ?
       ORDER BY hd.date_don DESC
       LIMIT 50`,
      [d.id]
    );

    res.json({
      donneur: { ...d, statut_badge: badgeStatut(d) },
      eligibilite,
      historique,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur profil donneur' });
  }
});

// ---------------------------------------------------------------
// PATCH /api/donneurs/me  (le donneur édite son propre profil)
// ---------------------------------------------------------------
router.patch('/me', requireAuth(), requireRole('donneur'), validate(updateProfileSchema), async (req, res) => {
  try {
    const fields = req.body;
    const [[d]] = await pool.query('SELECT id FROM donneurs WHERE user_id = ?', [req.user.id]);
    if (!d) return res.status(404).json({ error: 'Profil introuvable' });

    const sets = [];
    const params = [];
    for (const [k, v] of Object.entries(fields)) {
      sets.push(`${k} = ?`);
      params.push(v);
    }
    if (!sets.length) return res.json({ ok: true });
    params.push(d.id);
    await pool.query(`UPDATE donneurs SET ${sets.join(', ')} WHERE id = ?`, params);
    await audit(req, 'update_profile', 'donneurs', d.id, fields);

    const [[updated]] = await pool.query('SELECT * FROM donneurs WHERE id = ?', [d.id]);
    res.json({ donneur: { ...updated, statut_badge: badgeStatut(updated) } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur mise à jour profil' });
  }
});

// ---------------------------------------------------------------
// GET /api/donneurs/:id  (staff)
// ---------------------------------------------------------------
router.get('/:id', requireAuth(), requireRole('hopital', 'cnts', 'admin'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM donneurs WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Donneur introuvable' });
    const r = rows[0];
    const eligibilite = calculerEligibilite(r);
    const [historique] = await pool.query(
      `SELECT hd.*, h.nom AS hopital_nom FROM historique_dons hd JOIN hopitaux h ON h.id = hd.hopital_id WHERE hd.donneur_id = ? ORDER BY hd.date_don DESC`,
      [r.id]
    );
    res.json({ ...r, statut_badge: badgeStatut(r), eligibilite, historique });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur fiche donneur' });
  }
});

// ---------------------------------------------------------------
// POST /api/donneurs  (staff crée un donneur — sans compte)
// ---------------------------------------------------------------
router.post('/', requireAuth(), requireRole('hopital', 'cnts', 'admin'), validate(createDonneurSchema), async (req, res) => {
  try {
    const b = req.body;
    const [r] = await pool.query(
      `INSERT INTO donneurs (nom, prenom, telephone, email, date_naissance, sexe, groupe_sanguin, poids_kg,
        region_id, ville, quartier, latitude, longitude, disponible, en_attente_validation, derniere_date_don, consentement_rgpd)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        b.nom, b.prenom, b.telephone, b.email ?? null, b.date_naissance || null, b.sexe || 'autre',
        b.groupe_sanguin, b.poids_kg ?? null, b.region_id ?? null, b.ville, b.quartier ?? null,
        b.latitude ?? null, b.longitude ?? null,
        b.disponible ? 1 : 0, b.en_attente_validation ? 1 : 0,
        b.derniere_date_don || null,
      ]
    );
    await audit(req, 'create_donneur', 'donneurs', r.insertId);
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur création donneur' });
  }
});

// ---------------------------------------------------------------
// POST /api/donneurs/:id/valider  (CNTS valide un donneur en attente)
// ---------------------------------------------------------------
router.post('/:id/valider', requireAuth(), requireRole('cnts', 'admin'), async (req, res) => {
  try {
    await pool.query('UPDATE donneurs SET en_attente_validation = 0 WHERE id = ?', [req.params.id]);
    await audit(req, 'valider_donneur', 'donneurs', Number(req.params.id));
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur validation donneur' });
  }
});

export default router;
