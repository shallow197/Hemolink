/**
 * Génération automatique des notifications intelligentes (Lot 4).
 * Usage : node scripts/auto-notifs.js
 * Cron (tous les jours à 8h) : 0 8 * * * cd /chemin/server && node scripts/auto-notifs.js
 *
 * Idempotent : relancer plusieurs fois ne crée aucun doublon.
 */
import dotenv from 'dotenv';
dotenv.config();

const { genererNotificationsAuto } = await import('../src/utils/autoNotifs.js');
const { pool } = await import('../src/db/pool.js');

try {
  const bilan = await genererNotificationsAuto();
  console.log('✅ Notifications automatiques générées :');
  console.log(`   ${bilan.rappels_eligibilite} rappel(s) d'éligibilité (donneurs)`);
  console.log(`   ${bilan.stocks_predictifs} alerte(s) de stock prédictives (staff)`);
} catch (e) {
  console.error('❌ Erreur :', e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
