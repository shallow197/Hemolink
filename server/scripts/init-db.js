/**
 * Initialisation de la base HemoLink :
 *   1. Crée la base (si nécessaire) et applique schema.sql
 *   2. Applique seed.sql (données de démo)
 *   3. Régénère les hash bcrypt pour les comptes de démo
 *
 * Usage :  node scripts/init-db.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEMO_PASSWORD = 'Hemolink2026!';

const DEMO_EMAILS = [
  'admin@hemolink.sn',
  'cnts@hemolink.sn',
  'fann@hemolink.sn',
  'principal@hemolink.sn',
  'daljamm@hemolink.sn',
  'aminata@example.sn',
  'cheikh@example.sn',
  'fatou@example.sn',
];

function loadSqlFile(name) {
  const p = path.resolve(__dirname, '..', 'sql', name);
  return fs.readFileSync(p, 'utf8');
}

async function execScript(conn, sql) {
  // mysql2 supporte multipleStatements quand activé sur la connexion
  await conn.query(sql);
}

async function run() {
  const cfg = {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD ?? '',
    multipleStatements: true,
  };

  console.log(`→ Connexion à MySQL ${cfg.host}:${cfg.port} en ${cfg.user}`);

  // Étape 1 : créer la base et appliquer schema
  let conn = await mysql.createConnection(cfg);
  console.log('→ Application de schema.sql');
  const schema = loadSqlFile('schema.sql');
  await execScript(conn, schema);
  await conn.end();

  // Étape 2 : seed
  conn = await mysql.createConnection({ ...cfg, database: process.env.MYSQL_DATABASE || 'hemolink' });
  console.log('→ Application de seed.sql');
  const seed = loadSqlFile('seed.sql');
  await execScript(conn, seed);

  // Étape 3 : régénération des hash bcrypt
  console.log(`→ Régénération des mots de passe (${DEMO_PASSWORD})`);
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  for (const email of DEMO_EMAILS) {
    await conn.query('UPDATE users SET password_hash = ? WHERE email = ?', [hash, email]);
  }
  await conn.end();

  console.log('\n✅ Base HemoLink prête.');
  console.log('   Comptes de démo (mot de passe : Hemolink2026!) :');
  console.log('   - admin@hemolink.sn       (admin)');
  console.log('   - cnts@hemolink.sn        (CNTS — vue nationale)');
  console.log('   - fann@hemolink.sn        (hôpital CHNU Fann)');
  console.log('   - principal@hemolink.sn   (hôpital Principal)');
  console.log('   - daljamm@hemolink.sn     (hôpital Dalal Jamm)');
  console.log('   - aminata@example.sn      (donneuse O-)');
  console.log('   - cheikh@example.sn       (donneur A+)');
  console.log('   - fatou@example.sn        (donneuse B+)');
}

run().catch((e) => {
  console.error('\n❌ Erreur init-db :', e.message);
  if (e.code === 'ER_PARSE_ERROR') console.error('SQL :', e.sql);
  process.exit(1);
});
