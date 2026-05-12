import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { groupesCompatiblesPourReceveur } from '../utils/blood.js';
import { distanceKm } from '../utils/geo.js';

const router = Router();

// ---------------------------------------------------------------
// GET /api/dashboard/kpis (public, alimente la landing + dashboards)
// ---------------------------------------------------------------
router.get('/kpis', async (_req, res) => {
  try {
    const [[d]] = await pool.query('SELECT COUNT(*) AS n FROM donneurs WHERE en_attente_validation = 0');
    const [[a]] = await pool.query(`SELECT COUNT(*) AS n FROM alertes WHERE statut = 'en_cours'`);
    const [[m]] = await pool.query(
      `SELECT COUNT(*) AS n FROM reponses_alertes
       WHERE reponse = 'accepte' AND date_reponse >= DATE_FORMAT(NOW(), '%Y-%m-01')`
    );
    const [crit] = await pool.query(
      `SELECT COUNT(DISTINCT hopital_id) AS n FROM stocks_sang WHERE quantite_poches < seuil_critique`
    );
    const [[h]] = await pool.query('SELECT COUNT(*) AS n FROM hopitaux');
    const [[dons]] = await pool.query('SELECT COUNT(*) AS n FROM historique_dons');
    res.json({
      donneurs_inscrits: d.n,
      alertes_actives: a.n,
      dons_mois: m.n,
      hopitaux_stock_critique: crit[0]?.n ?? 0,
      hopitaux_total: h.n,
      dons_total: dons.n,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur KPIs' });
  }
});

// ---------------------------------------------------------------
// GET /api/dashboard/carte
// ---------------------------------------------------------------
router.get('/carte', async (_req, res) => {
  try {
    const [donneurs] = await pool.query(
      `SELECT id, nom, prenom, groupe_sanguin, ville, latitude, longitude, disponible, en_attente_validation
       FROM donneurs WHERE latitude IS NOT NULL AND longitude IS NOT NULL`
    );
    const [hopitaux] = await pool.query(
      'SELECT id, nom, type, ville, latitude, longitude FROM hopitaux WHERE latitude IS NOT NULL AND longitude IS NOT NULL'
    );
    const [alertes] = await pool.query(
      `SELECT a.id, a.hopital_id, a.groupe_sanguin, a.niveau_urgence, a.rayon_km, a.statut,
              h.latitude AS hop_lat, h.longitude AS hop_lng, h.nom AS hopital_nom
       FROM alertes a JOIN hopitaux h ON h.id = a.hopital_id
       WHERE a.statut = 'en_cours'`
    );

    const compatIds = new Set();
    for (const al of alertes) {
      const groupes = groupesCompatiblesPourReceveur(al.groupe_sanguin);
      const rayon = al.rayon_km >= 9000 ? null : al.rayon_km;
      for (const d of donneurs) {
        if (!d.disponible || d.en_attente_validation) continue;
        if (!groupes.includes(d.groupe_sanguin)) continue;
        if (rayon != null) {
          const dist = distanceKm(Number(al.hop_lat), Number(al.hop_lng), Number(d.latitude), Number(d.longitude));
          if (dist > rayon) continue;
        }
        compatIds.add(d.id);
      }
    }

    res.json({
      donneurs,
      hopitaux,
      alertes_actives: alertes,
      donneurs_compatibles_ids: [...compatIds],
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur carte' });
  }
});

// ---------------------------------------------------------------
// GET /api/dashboard/alertes-recentes
// ---------------------------------------------------------------
router.get('/alertes-recentes', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.id, a.groupe_sanguin, a.statut, a.date_creation, a.niveau_urgence,
              h.nom AS hopital_nom
       FROM alertes a JOIN hopitaux h ON h.id = a.hopital_id
       ORDER BY a.date_creation DESC LIMIT 12`
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur alertes récentes' });
  }
});

// ---------------------------------------------------------------
// GET /api/dashboard/cnts/national (vue nationale agrégée — CNTS)
// ---------------------------------------------------------------
router.get('/cnts/national', requireAuth(), async (req, res) => {
  try {
    if (!['cnts', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Réservé au CNTS' });
    }

    // Stocks agrégés par groupe (somme nationale)
    const [parGroupe] = await pool.query(
      `SELECT groupe_sanguin,
              SUM(quantite_poches) AS total,
              SUM(seuil_critique) AS seuil
       FROM stocks_sang GROUP BY groupe_sanguin ORDER BY groupe_sanguin`
    );

    // Donneurs par région
    const [parRegion] = await pool.query(
      `SELECT r.id, r.nom, COUNT(d.id) AS donneurs,
              SUM(CASE WHEN d.en_attente_validation = 0 AND d.disponible = 1 THEN 1 ELSE 0 END) AS disponibles
       FROM regions r LEFT JOIN donneurs d ON d.region_id = r.id
       GROUP BY r.id, r.nom ORDER BY donneurs DESC`
    );

    // Donneurs par groupe sanguin
    const [parGS] = await pool.query(
      `SELECT groupe_sanguin, COUNT(*) AS n FROM donneurs
       WHERE en_attente_validation = 0 GROUP BY groupe_sanguin ORDER BY groupe_sanguin`
    );

    // Alertes des 30 derniers jours
    const [alertes30j] = await pool.query(
      `SELECT DATE(date_creation) AS jour, COUNT(*) AS n,
              SUM(CASE WHEN statut = 'resolue' THEN 1 ELSE 0 END) AS resolues
       FROM alertes WHERE date_creation >= NOW() - INTERVAL 30 DAY
       GROUP BY DATE(date_creation) ORDER BY jour`
    );

    // Comptes en attente de validation
    const [[attente]] = await pool.query(
      'SELECT COUNT(*) AS n FROM donneurs WHERE en_attente_validation = 1'
    );

    // Délai moyen de réponse (en minutes)
    const [[delai]] = await pool.query(
      `SELECT AVG(TIMESTAMPDIFF(MINUTE, date_notification, date_reponse)) AS minutes
       FROM reponses_alertes WHERE date_reponse IS NOT NULL`
    );

    res.json({
      stocks_par_groupe: parGroupe,
      donneurs_par_region: parRegion,
      donneurs_par_groupe: parGS,
      alertes_30j: alertes30j,
      comptes_en_attente: attente.n,
      delai_moyen_reponse_minutes: Number(delai.minutes ?? 0).toFixed(1),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur dashboard CNTS' });
  }
});

// ---------------------------------------------------------------
// GET /api/dashboard/hopital/:id  (vue staff hôpital)
// ---------------------------------------------------------------
router.get('/hopital/:id', requireAuth(), async (req, res) => {
  try {
    const hopitalId = Number(req.params.id);
    if (req.user.role === 'hopital' && req.user.hopital_id !== hopitalId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const [[h]] = await pool.query('SELECT * FROM hopitaux WHERE id = ?', [hopitalId]);
    if (!h) return res.status(404).json({ error: 'Hôpital introuvable' });

    const [stocks] = await pool.query(
      'SELECT * FROM stocks_sang WHERE hopital_id = ? ORDER BY groupe_sanguin',
      [hopitalId]
    );

    const [[alActives]] = await pool.query(
      `SELECT COUNT(*) AS n FROM alertes WHERE hopital_id = ? AND statut = 'en_cours'`,
      [hopitalId]
    );

    const [recentes] = await pool.query(
      `SELECT id, groupe_sanguin, niveau_urgence, statut, date_creation, donneurs_contactes, donneurs_acceptes
       FROM alertes WHERE hopital_id = ? ORDER BY date_creation DESC LIMIT 10`,
      [hopitalId]
    );

    const [[acceptes]] = await pool.query(
      `SELECT COUNT(*) AS n FROM reponses_alertes r
       JOIN alertes a ON a.id = r.alerte_id
       WHERE a.hopital_id = ? AND r.reponse = 'accepte'
         AND r.date_reponse >= DATE_FORMAT(NOW(), '%Y-%m-01')`,
      [hopitalId]
    );

    res.json({
      hopital: h,
      stocks,
      alertes_actives: alActives.n,
      alertes_recentes: recentes,
      acceptations_mois: acceptes.n,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur dashboard hôpital' });
  }
});

export default router;
