/**
 * Vérification rapide post-installation.
 * Usage : node scripts/verify.js
 *
 * Checke :
 *  1. Connexion MySQL
 *  2. Présence des tables et des comptes de démo
 *  3. Hash bcrypt des comptes valide
 */
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const DEMO_PASSWORD = 'Hemolink2026!';

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD ?? '',
    database: process.env.MYSQL_DATABASE || 'hemolink',
  });

  console.log('✅ Connexion MySQL OK');

  const [tables] = await conn.query('SHOW TABLES');
  const noms = tables.map((t) => Object.values(t)[0]);
  const attendues = ['regions', 'hopitaux', 'users', 'donneurs', 'stocks_sang', 'alertes', 'reponses_alertes', 'historique_dons', 'audit_log'];
  const manquantes = attendues.filter((n) => !noms.includes(n));
  if (manquantes.length) {
    console.error('❌ Tables manquantes :', manquantes.join(', '));
    process.exit(1);
  }
  console.log(`✅ ${attendues.length} tables présentes`);

  const [[h]] = await conn.query('SELECT COUNT(*) AS n FROM hopitaux');
  const [[d]] = await conn.query('SELECT COUNT(*) AS n FROM donneurs');
  const [[u]] = await conn.query('SELECT COUNT(*) AS n FROM users');
  console.log(`   ${h.n} hôpitaux · ${d.n} donneurs · ${u.n} comptes utilisateurs`);

  const [[admin]] = await conn.query("SELECT password_hash FROM users WHERE email = 'admin@hemolink.sn'");
  if (!admin) {
    console.error("❌ Compte admin@hemolink.sn introuvable");
    process.exit(1);
  }
  const ok = await bcrypt.compare(DEMO_PASSWORD, admin.password_hash);
  if (!ok) {
    console.error("❌ Le hash bcrypt admin ne correspond pas à 'Hemolink2026!'");
    console.error("   Lancez : npm run init-db");
    process.exit(1);
  }
  console.log('✅ Comptes de démo opérationnels (mot de passe Hemolink2026!)');

  await conn.end();
  console.log('\n🎉 Tout est prêt. Lance le serveur avec : npm run dev');
}

main().catch((e) => {
  console.error('\n❌ Erreur :', e.message);
  console.error('   Vérifie WAMP démarré et les paramètres MySQL dans .env');
  process.exit(1);
});
