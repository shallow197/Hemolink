// =====================================================================
// hopitaux.js — Routes API pour les hôpitaux, leurs stocks et les alertes
// =====================================================================
// Ce fichier contient le CŒUR MÉTIER de HemoLink :
// l'algorithme qui cible les bons donneurs lors d'une alerte urgente.
// =====================================================================

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

// --- Schémas de validation Zod (vérifient le contenu des requêtes) -----
// Si une donnée ne respecte pas le schéma, la route reçoit un 400 propre
// avant même d'exécuter la moindre ligne de code métier.
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

// =====================================================================
// BLOC 1 — Liste publique des hôpitaux + stocks (pour la landing/carte)
// =====================================================================
// GET /api/hopitaux
// Renvoie tous les hôpitaux avec, pour chacun, la liste de ses 8 stocks.
// Chaque stock est annoté d'un niveau ('critique' | 'faible' | 'ok').
router.get('/', async (_req, res) => {
  try {
    // Requête 1 : tous les hôpitaux (joins avec la région pour le nom)
    const [hopitaux] = await pool.query(
      `SELECT h.*, r.nom AS region_nom
       FROM hopitaux h LEFT JOIN regions r ON r.id = h.region_id
       ORDER BY h.type, h.nom`
    );
    // Requête 2 : tous les stocks
    const [stocks] = await pool.query(
      'SELECT hopital_id, groupe_sanguin, quantite_poches, seuil_critique, date_maj FROM stocks_sang ORDER BY hopital_id, groupe_sanguin'
    );

    // On regroupe les stocks par hôpital (map id → hôpital)
    const byH = {};
    for (const h of hopitaux) byH[h.id] = { ...h, stocks: [] };
    for (const s of stocks) {
      if (byH[s.hopital_id]) {
        const critique = s.quantite_poches < s.seuil_critique;
        byH[s.hopital_id].stocks.push({
          ...s,
          // Calcul du niveau d'alerte du stock
          niveau: critique
            ? 'critique'
            : s.quantite_poches < s.seuil_critique * 2 ? 'faible' : 'ok',
        });
      }
    }
    res.json(Object.values(byH));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur hôpitaux' });
  }
});

// =====================================================================
// BLOC 2 — Fiche d'un hôpital individuel
// =====================================================================
// GET /api/hopitaux/:id
router.get('/:id', async (req, res) => {
  try {
    const [[h]] = await pool.query(
      `SELECT h.*, r.nom AS region_nom FROM hopitaux h
       LEFT JOIN regions r ON r.id = h.region_id WHERE h.id = ?`,
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

// =====================================================================
// BLOC 3 — Édition d'un stock (UPSERT)
// =====================================================================
// PUT /api/hopitaux/:id/stocks/:groupe
// Le staff hôpital met à jour son propre stock. Si la ligne (hopital_id,
// groupe) n'existe pas, on l'INSERT. Sinon, on UPDATE → c'est l'UPSERT
// MySQL (ON DUPLICATE KEY UPDATE).
router.put('/:id/stocks/:groupe', requireAuth(), requireRole('hopital', 'cnts', 'admin'), validate(stockSchema), async (req, res) => {
  try {
    const hopitalId = Number(req.params.id);
    const groupe = req.params.groupe;

    // Sécurité : un staff hôpital ne peut modifier QUE les stocks de son hôpital
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

    // Traçabilité : on enregistre cette action dans audit_log
    await audit(req, 'update_stock', 'stocks_sang', hopitalId, { groupe, quantite_poches, seuil_critique });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur mise à jour stock' });
  }
});

// =====================================================================
// BLOC 4 — CRÉATION D'UNE ALERTE (CŒUR MÉTIER DE HEMOLINK)
// =====================================================================
// POST /api/hopitaux/alerte
//
// Algorithme en 6 étapes :
//   1. Sécurité : un hôpital ne peut créer une alerte que pour lui-même
//   2. INSERT de l'alerte (statut 'en_cours')
//   3. Calcul des groupes de donneurs compatibles (table COMPAT)
//   4. Récupération de TOUS les donneurs avec coordonnées GPS
//   5. Filtrage : disponible + validé + groupe compatible + distance < rayon
//   6. INSERT en masse des notifications dans reponses_alertes
//
// Résultat : une alerte cible chirurgicalement les bons donneurs.
router.post('/alerte', requireAuth(), requireRole('hopital', 'cnts', 'admin'), validate(alerteSchema), async (req, res) => {
  // On prend une connexion dédiée pour ce traitement (plusieurs requêtes)
  const conn = await pool.getConnection();
  try {
    let { hopital_id, groupe_sanguin, niveau_urgence, message, rayon_km, poches_necessaires } = req.body;

    // ÉTAPE 1 — Sécurité : un staff hôpital force son propre hopital_id
    if (req.user.role === 'hopital') {
      hopital_id = req.user.hopital_id;
    }
    if (!hopital_id) {
      return res.status(400).json({ error: 'hopital_id requis' });
    }

    // Convention : rayon ≥ 9000 = "tout le Sénégal"
    if (rayon_km >= 9000) rayon_km = 9999;

    // On récupère les coordonnées GPS de l'hôpital
    const [[h]] = await conn.query('SELECT latitude, longitude FROM hopitaux WHERE id = ?', [hopital_id]);
    if (!h) {
      return res.status(404).json({ error: 'Hôpital introuvable' });
    }

    // ÉTAPE 2 — INSERT de l'alerte (compteurs à 0 pour le moment)
    const [ins] = await conn.query(
      `INSERT INTO alertes (hopital_id, cree_par_user_id, groupe_sanguin, niveau_urgence, message, rayon_km,
        poches_necessaires, statut, donneurs_contactes, donneurs_repondus, donneurs_acceptes)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'en_cours', 0, 0, 0)`,
      [hopital_id, req.user.id, groupe_sanguin, niveau_urgence, message || '', rayon_km, poches_necessaires]
    );
    const alerteId = ins.insertId;

    // ÉTAPE 3 — Calcul des groupes compatibles
    // (ex : pour un receveur O+, on accepte O+ et O-)
    const groupes = groupesCompatiblesPourReceveur(groupe_sanguin);

    // ÉTAPE 4 — On récupère tous les donneurs ayant une position GPS
    const [donneurs] = await conn.query(
      `SELECT id, telephone, latitude, longitude, disponible, en_attente_validation, groupe_sanguin
       FROM donneurs WHERE latitude IS NOT NULL AND longitude IS NOT NULL`
    );

    // ÉTAPE 5 — Filtrage en JS (plus simple à débugger que tout en SQL)
    const useRadius = rayon_km < 9000;
    const cibles = [];
    for (const d of donneurs) {
      // Filtre 1 : doit être disponible et validé
      if (!d.disponible || d.en_attente_validation) continue;
      // Filtre 2 : groupe sanguin compatible
      if (!groupes.includes(d.groupe_sanguin)) continue;
      // Filtre 3 : distance dans le rayon (Haversine)
      let dist = null;
      if (h.latitude != null && h.longitude != null && d.latitude != null && d.longitude != null) {
        dist = distanceKm(Number(h.latitude), Number(h.longitude), Number(d.latitude), Number(d.longitude));
        if (useRadius && dist > rayon_km) continue;
      } else if (useRadius) {
        continue;
      }
      cibles.push({ id: d.id, dist, telephone: d.telephone });
    }

    // Mise à jour du compteur "donneurs contactés"
    await conn.query('UPDATE alertes SET donneurs_contactes = ? WHERE id = ?', [cibles.length, alerteId]);

    // ÉTAPE 6 — INSERT en masse des notifications (1 ligne par donneur ciblé)
    // Chaque donneur verra cette alerte dans son espace "Mes alertes".
    if (cibles.length) {
      const values = cibles.map((c) => [alerteId, c.id, 'pas_repondu', c.dist != null ? c.dist.toFixed(2) : null]);
      await conn.query(
        'INSERT INTO reponses_alertes (alerte_id, donneur_id, reponse, distance_km) VALUES ?',
        [values]
      );

      // ÉTAPE 6bis — File d'attente SMS (canal secondaire)
      // Chaque alerte génère aussi un SMS pré-formaté, mis en file d'attente.
      // Dans la démo actuelle, l'envoi est simulé ; en production, un worker
      // consommerait cette file via l'API Sonatel/Orange.
      const [[hopInfo]] = await conn.query('SELECT nom FROM hopitaux WHERE id = ?', [hopital_id]);
      const nomHop = hopInfo?.nom || 'un hôpital';
      const smsText = `ALERTE HemoLink ${niveau_urgence.toUpperCase()} — Sang ${groupe_sanguin} demandé a ${nomHop}. Repondez sur hemolink.sn/a/${alerteId} ou appelez le ${h.telephone || 'CNTS'}.`;
      const smsValues = cibles
        .filter((c) => c.telephone)
        .map((c) => [alerteId, c.id, c.telephone, smsText.slice(0, 160), 'orange', 'en_file']);
      if (smsValues.length) {
        await conn.query(
          'INSERT INTO notifications_sms (alerte_id, donneur_id, telephone, message, operateur, statut) VALUES ?',
          [smsValues]
        );
      }
    }

    // Traçabilité (audit log)
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
    // Très important : on rend la connexion au pool, sinon fuite mémoire
    conn.release();
  }
});

export default router;

// =====================================================================
// EXPLICATION POUR LA SOUTENANCE (30 secondes) :
// ---------------------------------------------------------------------
// C'est LE fichier le plus important du backend. Quand un médecin de
// Fann clique "Lancer une alerte O- urgent rayon 25 km", voici ce qui
// se passe en moins d'une seconde :
//   1. On vérifie qu'il est bien staff de Fann (pas un autre hôpital)
//   2. On crée la ligne dans alertes
//   3. On calcule les groupes compatibles pour O- → ici uniquement O-
//   4. On lit TOUS les donneurs de la base
//   5. Pour chacun : disponible ? validé ? bon groupe ? à moins de 25 km
//      de Fann (calcul Haversine) ?
//   6. Pour chaque donneur qui passe les filtres, on crée une ligne dans
//      reponses_alertes — c'est ce qui fait apparaître l'alerte dans son
//      espace "Mes alertes" sur son téléphone.
// C'est ça la "magie" de HemoLink : un ciblage chirurgical en 1 clic.
// =====================================================================
