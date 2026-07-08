// =====================================================================
// autoNotifs.js — Notifications intelligentes générées automatiquement
// =====================================================================
// Deux règles, toutes deux IDEMPOTENTES (relancer ne crée pas de doublon) :
//
//   1. RAPPEL D'ÉLIGIBILITÉ : un donneur dont le délai inter-dons est
//      écoulé (90 j hommes / 120 j femmes) reçoit une notification
//      "rappel_eligibilite" — une seule par cycle d'éligibilité.
//
//   2. STOCK CRITIQUE PRÉDICTIF : quand les prévisions (previsions.js)
//      annoncent une rupture sous 7 jours, le staff de l'hôpital est
//      notifié — pas de doublon tant que la précédente n'est pas lue.
//
// Déclenchement : POST /api/ai/generer-notifications (cnts/admin)
// ou en ligne de commande : node scripts/auto-notifs.js (cron-compatible).
// =====================================================================

import { pool } from '../db/pool.js';
import { calculerPrevisions } from './previsions.js';

// ---------------------------------------------------------------------
// Règle 1 — Rappels d'éligibilité
// ---------------------------------------------------------------------
// La sous-requête NOT EXISTS garantit l'idempotence : on ne recrée pas
// de rappel si un rappel a déjà été émis DEPUIS la date d'éligibilité
// (= derniere_date_don + délai). Un nouveau don réinitialise le cycle.
export async function genererRappelsEligibilite(conn = pool) {
  const [eligibles] = await conn.query(
    `SELECT d.id, d.prenom, d.groupe_sanguin, d.sexe,
            DATE_ADD(d.derniere_date_don,
                     INTERVAL (CASE WHEN d.sexe = 'femme' THEN 120 ELSE 90 END) DAY) AS date_eligibilite
     FROM donneurs d
     WHERE d.disponible = 1
       AND d.en_attente_validation = 0
       AND d.derniere_date_don IS NOT NULL
       AND DATE_ADD(d.derniere_date_don,
                    INTERVAL (CASE WHEN d.sexe = 'femme' THEN 120 ELSE 90 END) DAY) <= CURDATE()
       AND NOT EXISTS (
         SELECT 1 FROM notifications n
         WHERE n.donneur_id = d.id
           AND n.type = 'rappel_eligibilite'
           AND n.date_creation >= DATE_ADD(d.derniere_date_don,
                 INTERVAL (CASE WHEN d.sexe = 'femme' THEN 120 ELSE 90 END) DAY)
       )`
  );

  if (!eligibles.length) return 0;

  const values = eligibles.map((d) => [
    null,
    d.id,
    'rappel_eligibilite',
    'Vous êtes de nouveau éligible au don',
    `Bonne nouvelle ${d.prenom} : votre délai inter-dons est écoulé depuis le ${new Date(d.date_eligibilite).toISOString().slice(0, 10)}. Votre groupe ${d.groupe_sanguin} peut sauver des vies — trouvez un hôpital proche sur votre espace.`,
    '/mon-espace',
    null,
  ]);
  await conn.query(
    'INSERT INTO notifications (user_id, donneur_id, type, titre, message, lien, alerte_id) VALUES ?',
    [values]
  );
  return eligibles.length;
}

// ---------------------------------------------------------------------
// Règle 2 — Stock critique prédictif (à partir des prévisions J-7)
// ---------------------------------------------------------------------
// Idempotence : on ne renvoie pas de notification à un membre du staff
// tant qu'il a déjà une notification "stock_critique" NON LUE portant
// sur le même groupe sanguin (titre normalisé "Prévision ... <groupe>").
export async function genererAlertesStockPredictives(conn = pool) {
  const previsions = await calculerPrevisions({}, conn);
  const critiques = previsions.filter((p) => p.niveau === 'rupture' || p.niveau === 'critique');
  if (!critiques.length) return 0;

  let crees = 0;
  for (const p of critiques) {
    const [staff] = await conn.query(
      `SELECT u.id FROM users u
       WHERE u.hopital_id = ? AND u.actif = 1 AND u.role IN ('hopital','cnts','admin')
         AND NOT EXISTS (
           SELECT 1 FROM notifications n
           WHERE n.user_id = u.id AND n.type = 'stock_critique' AND n.lu = 0
             AND n.titre = ?
         )`,
      [p.hopital_id, titrePrevision(p)]
    );
    if (!staff.length) continue;

    const message = p.niveau === 'rupture'
      ? `${p.hopital_nom} : stock ${p.groupe_sanguin} épuisé (0 poche). Lancez une alerte donneurs sans attendre.`
      : `${p.hopital_nom} : au rythme actuel (${p.conso_estimee_par_jour} poche/j), le stock ${p.groupe_sanguin} (${p.stock_actuel} poches) sera épuisé vers le ${p.date_rupture_estimee}. Pensez à lancer une alerte.`;

    const values = staff.map((u) => [
      u.id, null, 'stock_critique', titrePrevision(p), message, '/staff/stocks', null,
    ]);
    await conn.query(
      'INSERT INTO notifications (user_id, donneur_id, type, titre, message, lien, alerte_id) VALUES ?',
      [values]
    );
    crees += staff.length;
  }
  return crees;
}

// Titre stable et normalisé → sert de clé de déduplication.
function titrePrevision(p) {
  return p.niveau === 'rupture'
    ? `Rupture de stock ${p.groupe_sanguin}`
    : `Prévision : rupture ${p.groupe_sanguin} dans ${Math.max(1, Math.floor(p.jours_autonomie))} j`;
}

/** Exécute les deux règles et renvoie le bilan. */
export async function genererNotificationsAuto(conn = pool) {
  const rappels = await genererRappelsEligibilite(conn);
  const stocks = await genererAlertesStockPredictives(conn);
  return { rappels_eligibilite: rappels, stocks_predictifs: stocks, total: rappels + stocks };
}
