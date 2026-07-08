// =====================================================================
// previsions.js — Intelligence prédictive : rupture de stock
// =====================================================================
// Objectif : pour chaque couple (hôpital, groupe sanguin), estimer dans
// combien de jours le stock sera épuisé, et alerter à J-7.
//
// Méthode (volontairement DÉTERMINISTE et explicable — pas de boîte noire) :
//   1. Demande observée : somme des poches demandées via les alertes des
//      90 derniers jours pour ce couple → demande moyenne / jour.
//   2. Plancher de rotation : le seuil critique représente ~1 mois de
//      réserve minimale → seuil / 30 poches/jour au minimum.
//   3. Conso estimée = max(demande observée, plancher, 0.05).
//   4. Autonomie (jours) = stock actuel / conso estimée.
//   5. Niveau : rupture (0 j) · critique (≤ 7 j) · surveille (≤ 14 j) · ok.
//
// Chaque prévision embarque ses variables d'entrée → le staff peut
// vérifier le raisonnement (exigence d'explicabilité médicale).
// =====================================================================

import { pool } from '../db/pool.js';

const FENETRE_JOURS = 90;   // fenêtre d'observation de la demande
const RESERVE_MOIS = 30;    // le seuil critique ≈ 1 mois de réserve
const CONSO_MIN = 0.05;     // plancher absolu (1 poche / 20 jours)
const SEUIL_CRITIQUE_J = 7; // alerte à J-7
const SEUIL_SURVEILLE_J = 14;

/**
 * Calcule les prévisions de rupture pour tous les stocks
 * (ou ceux d'un hôpital précis si hopitalId est fourni).
 * Renvoie un tableau trié par autonomie croissante.
 */
export async function calculerPrevisions({ hopitalId = null } = {}, conn = pool) {
  // 1) Stocks actuels
  let sqlStocks = `SELECT s.hopital_id, h.nom AS hopital_nom, h.ville AS hopital_ville,
                          s.groupe_sanguin, s.quantite_poches, s.seuil_critique, s.date_maj
                   FROM stocks_sang s JOIN hopitaux h ON h.id = s.hopital_id`;
  const params = [];
  if (hopitalId) {
    sqlStocks += ' WHERE s.hopital_id = ?';
    params.push(hopitalId);
  }
  const [stocks] = await conn.query(sqlStocks, params);

  // 2) Demande observée sur la fenêtre (poches demandées via alertes)
  const [demandes] = await conn.query(
    `SELECT hopital_id, groupe_sanguin, SUM(poches_necessaires) AS poches_90j
     FROM alertes
     WHERE date_creation >= DATE_SUB(NOW(), INTERVAL ? DAY)
       AND statut <> 'annulee'
     GROUP BY hopital_id, groupe_sanguin`,
    [FENETRE_JOURS]
  );
  const demandeMap = new Map(
    demandes.map((d) => [`${d.hopital_id}|${d.groupe_sanguin}`, Number(d.poches_90j) || 0])
  );

  // 3) Calcul par couple (hôpital, groupe)
  const today = new Date();
  const previsions = stocks.map((s) => {
    const poches90j = demandeMap.get(`${s.hopital_id}|${s.groupe_sanguin}`) || 0;
    const consoAlertes = poches90j / FENETRE_JOURS;
    const plancher = (Number(s.seuil_critique) || 0) / RESERVE_MOIS;
    const consoEstimee = Math.max(consoAlertes, plancher, CONSO_MIN);

    const joursAutonomie = s.quantite_poches <= 0
      ? 0
      : Math.round((s.quantite_poches / consoEstimee) * 10) / 10;

    const dateRupture = new Date(today);
    dateRupture.setDate(dateRupture.getDate() + Math.floor(joursAutonomie));

    let niveau = 'ok';
    if (joursAutonomie <= 0) niveau = 'rupture';
    else if (joursAutonomie <= SEUIL_CRITIQUE_J) niveau = 'critique';
    else if (joursAutonomie <= SEUIL_SURVEILLE_J) niveau = 'surveille';

    return {
      hopital_id: s.hopital_id,
      hopital_nom: s.hopital_nom,
      hopital_ville: s.hopital_ville,
      groupe_sanguin: s.groupe_sanguin,
      stock_actuel: s.quantite_poches,
      seuil_critique: s.seuil_critique,
      // --- explicabilité ---
      demande_90j: poches90j,
      conso_estimee_par_jour: Math.round(consoEstimee * 100) / 100,
      // --- prédiction ---
      jours_autonomie: joursAutonomie,
      date_rupture_estimee: dateRupture.toISOString().slice(0, 10),
      niveau,
    };
  });

  previsions.sort((a, b) => a.jours_autonomie - b.jours_autonomie);
  return previsions;
}

/** Petit résumé agrégé pour l'en-tête du dashboard. */
export function resumerPrevisions(previsions) {
  const resume = { rupture: 0, critique: 0, surveille: 0, ok: 0 };
  for (const p of previsions) resume[p.niveau]++;
  return resume;
}
