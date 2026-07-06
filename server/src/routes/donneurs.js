// =====================================================================
// donneurs.js — Routes API pour la gestion des donneurs de sang
// =====================================================================
// 6 endpoints :
//   GET    /api/donneurs              → liste filtrable (staff)
//   GET    /api/donneurs/me           → profil + éligibilité + historique (donneur)
//   PATCH  /api/donneurs/me           → édition de son propre profil
//   GET    /api/donneurs/:id          → fiche d'un donneur (staff)
//   POST   /api/donneurs              → création (staff)
//   POST   /api/donneurs/:id/valider  → validation par le CNTS
// =====================================================================

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

// ---------------------------------------------------------------
// GET /api/donneurs/me/hopitaux-proches  → top 3 hôpitaux les plus proches
// ---------------------------------------------------------------
router.get('/me/hopitaux-proches', requireAuth(), requireRole('donneur'), async (req, res) => {
  try {
    const [[d]] = await pool.query(
      'SELECT id, latitude, longitude FROM donneurs WHERE user_id = ?',
      [req.user.id]
    );
    if (!d || d.latitude == null || d.longitude == null) return res.json([]);

    const [hopitaux] = await pool.query(
      `SELECT id, nom, ville, type, telephone, latitude, longitude
       FROM hopitaux WHERE service_transfusion = 1 AND latitude IS NOT NULL AND longitude IS NOT NULL`
    );

    // Haversine simple inline
    const R = 6371;
    const toRad = (x) => (x * Math.PI) / 180;
    const lat1 = Number(d.latitude), lon1 = Number(d.longitude);
    const withDist = hopitaux.map((h) => {
      const dLat = toRad(Number(h.latitude) - lat1);
      const dLon = toRad(Number(h.longitude) - lon1);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(Number(h.latitude))) * Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { ...h, distance_km: R * c };
    });

    withDist.sort((a, b) => a.distance_km - b.distance_km);
    res.json(withDist.slice(0, 3));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur hôpitaux proches' });
  }
});

// =====================================================================
// BLOC RGPD — Droits du donneur (Loi 2008-12 Sénégal + RGPD)
// =====================================================================
// 3 endpoints qui matérialisent les droits du donneur sur ses données :
//   GET    /api/donneurs/me/export      → portabilité (téléchargement JSON)
//   POST   /api/donneurs/me/anonymiser  → anonymisation (option B des CGU)
//   DELETE /api/donneurs/me             → suppression totale (option A, droit à l'oubli)
//
// Le staff peut aussi exécuter ces actions sur un donneur précis sur demande
// du donneur via email (canal dpo@hemolink.sn — cf. CGU art. 11.2).
// =====================================================================

// GET /api/donneurs/me/export  → renvoie toutes les données du donneur en JSON
router.get('/me/export', requireAuth(), requireRole('donneur'), async (req, res) => {
  try {
    const [[d]] = await pool.query('SELECT * FROM donneurs WHERE user_id = ?', [req.user.id]);
    if (!d) return res.status(404).json({ error: 'Profil introuvable' });

    const [historique] = await pool.query(
      `SELECT hd.*, h.nom AS hopital_nom, h.ville AS hopital_ville
       FROM historique_dons hd JOIN hopitaux h ON h.id = hd.hopital_id
       WHERE hd.donneur_id = ? ORDER BY hd.date_don DESC`,
      [d.id]
    );

    const [reponses] = await pool.query(
      `SELECT r.*, a.groupe_sanguin AS alerte_groupe, a.niveau_urgence, a.date_creation AS alerte_date,
              h.nom AS hopital_nom
       FROM reponses_alertes r
       JOIN alertes a ON a.id = r.alerte_id
       JOIN hopitaux h ON h.id = a.hopital_id
       WHERE r.donneur_id = ? ORDER BY r.date_notification DESC`,
      [d.id]
    );

    const [[user]] = await pool.query(
      'SELECT id, email, role, actif, email_verifie, derniere_connexion, date_creation FROM users WHERE id = ?',
      [req.user.id]
    );

    const exportData = {
      meta: {
        export_date: new Date().toISOString(),
        legal_basis: ['Loi 2008-12 Sénégal art. 70 (droit à la portabilité)', 'RGPD art. 20'],
        format_version: '1.0',
      },
      compte: user,
      profil_donneur: d,
      historique_dons: historique,
      alertes_recues: reponses,
    };

    await audit(req, 'rgpd_export', 'donneurs', d.id);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition',
      `attachment; filename="hemolink-mes-donnees-${d.prenom}-${d.nom}-${new Date().toISOString().slice(0,10)}.json"`);
    res.send(JSON.stringify(exportData, null, 2));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur export RGPD' });
  }
});

// POST /api/donneurs/me/anonymiser  → option B des CGU (recommandée)
// Efface l'identité mais conserve l'historique médical sans lien identifiable
router.post('/me/anonymiser', requireAuth(), requireRole('donneur'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [[d]] = await conn.query('SELECT id FROM donneurs WHERE user_id = ?', [req.user.id]);
    if (!d) return res.status(404).json({ error: 'Profil introuvable' });

    await conn.beginTransaction();

    // 1) Anonymisation du profil donneur (on garde id pour les FK historique)
    const pseudo = 'ANONYMISÉ-' + d.id;
    await conn.query(
      `UPDATE donneurs SET
        user_id = NULL,
        nom = ?, prenom = ?,
        telephone = 'XXXXXXXXXX', email = NULL,
        date_naissance = NULL, sexe = 'autre',
        poids_kg = NULL, region_id = NULL,
        ville = '—', quartier = NULL,
        latitude = NULL, longitude = NULL,
        disponible = 0, en_attente_validation = 1,
        consentement_rgpd = 0
       WHERE id = ?`,
      [pseudo, pseudo, d.id]
    );

    // 2) On purge les réponses aux alertes (pas de besoin médical)
    await conn.query('DELETE FROM reponses_alertes WHERE donneur_id = ?', [d.id]);

    // 3) On supprime le compte user (impossible de se reconnecter)
    await conn.query('DELETE FROM users WHERE id = ?', [req.user.id]);

    await conn.commit();

    // Audit log volontairement SANS référence au donneur réel (anonymisation)
    await audit(req, 'rgpd_anonymisation', 'donneurs', d.id, { type: 'option_B' });

    res.json({ ok: true, message: 'Votre compte a été anonymisé conformément à la Loi 2008-12. Vos données identitaires ont été supprimées, votre historique médical est conservé anonymement.' });
  } catch (e) {
    await conn.rollback().catch(() => {});
    console.error(e);
    res.status(500).json({ error: 'Erreur anonymisation RGPD' });
  } finally {
    conn.release();
  }
});

// DELETE /api/donneurs/me  → option A des CGU (suppression totale)
// Efface tout : compte, profil, historique, réponses
router.delete('/me', requireAuth(), requireRole('donneur'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [[d]] = await conn.query('SELECT id FROM donneurs WHERE user_id = ?', [req.user.id]);

    await conn.beginTransaction();

    if (d) {
      // ON DELETE CASCADE supprime aussi reponses_alertes et historique_dons via FK
      await conn.query('DELETE FROM donneurs WHERE id = ?', [d.id]);
    }
    await conn.query('DELETE FROM users WHERE id = ?', [req.user.id]);

    await conn.commit();

    await audit(req, 'rgpd_suppression_totale', 'donneurs', d?.id ?? null, { type: 'option_A' });

    res.json({ ok: true, message: 'Votre compte et toutes vos données ont été supprimés définitivement, conformément à la Loi 2008-12 (droit à l\'oubli).' });
  } catch (e) {
    await conn.rollback().catch(() => {});
    console.error(e);
    res.status(500).json({ error: 'Erreur suppression RGPD' });
  } finally {
    conn.release();
  }
});

export default router;

// =====================================================================
// EXPLICATION POUR LA SOUTENANCE (15 secondes) :
// ---------------------------------------------------------------------
// Ce fichier expose deux mondes : le STAFF (liste, fiche, création,
// validation des donneurs) et le DONNEUR lui-même (/me pour son profil
// + éligibilité + historique). Le calcul d'éligibilité est délégué à
// utils/eligibility.js (règles CNTS sur âge/poids/délai inter-dons).
// La validation par le CNTS est un endpoint séparé /valider — c'est le
// processus terrain : un donneur s'inscrit en ligne, puis le CNTS
// confirme son éligibilité avant qu'il commence à recevoir des alertes.
// =====================================================================
