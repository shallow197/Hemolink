import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const hopitaux = [
  { nom: 'Hôpital Fann', ville: 'Dakar', tel: '+221 33 825 00 01', lat: 14.7019, lng: -17.4512, email: 'contact@hopital-fann.sn' },
  { nom: 'Hôpital Principal de Dakar', ville: 'Dakar', tel: '+221 33 821 30 30', lat: 14.6736, lng: -17.4328, email: 'hpd@sn.gouv.sn' },
  { nom: 'CHU de Fann', ville: 'Dakar', tel: '+221 33 825 12 12', lat: 14.7055, lng: -17.4644, email: 'chu.fann@sn.gouv.sn' },
  { nom: 'Hôpital Aristide Le Dantec', ville: 'Dakar', tel: '+221 33 839 50 50', lat: 14.6731, lng: -17.4447, email: 'dantec@sn.gouv.sn' },
  { nom: 'Hôpital régional de Thiès', ville: 'Thiès', tel: '+221 33 951 12 00', lat: 14.7886, lng: -16.9261, email: 'hr.thies@sn.gouv.sn' },
  { nom: 'Hôpital régional de Saint-Louis', ville: 'Saint-Louis', tel: '+221 33 961 12 34', lat: 16.0326, lng: -16.4816, email: 'hr.saintlouis@sn.gouv.sn' },
  { nom: 'Hôpital régional de Ziguinchor', ville: 'Ziguinchor', tel: '+221 33 991 23 45', lat: 12.5833, lng: -16.2719, email: 'hr.ziguinchor@sn.gouv.sn' },
  { nom: 'Centre hospitalier de Pikine', ville: 'Pikine', tel: '+221 33 877 11 22', lat: 14.7645, lng: -17.3909, email: 'ch.pikine@sn.gouv.sn' },
];

const prenoms = ['Amadou', 'Fatou', 'Ibrahima', 'Aïssatou', 'Moussa', 'Khady', 'Ousmane', 'Marième', 'Cheikh', 'Aminata', 'Babacar', 'Ndèye', 'Mamadou', 'Sokhna', 'Alioune', 'Coumba', 'Modou', 'Anta', 'Pape', 'Ramatoulaye'];
const noms = ['Diop', 'Ndiaye', 'Sarr', 'Fall', 'Sy', 'Ba', 'Cissé', 'Faye', 'Gueye', 'Kane', 'Mbaye', 'Seck', 'Touré', 'Wade', 'Diallo'];

const villes = [
  { ville: 'Dakar', lat: 14.7167, lng: -17.4677 },
  { ville: 'Thiès', lat: 14.7886, lng: -16.9261 },
  { ville: 'Saint-Louis', lat: 16.0333, lng: -16.5000 },
  { ville: 'Ziguinchor', lat: 12.5833, lng: -16.2719 },
];

function jitter(base, spread = 0.08) {
  return base + (Math.random() - 0.5) * spread;
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD ?? '',
    multipleStatements: true,
  });

  const schema = readFileSync(join(__dirname, '../sql/schema.sql'), 'utf8');
  await conn.query(schema);

  await conn.query('USE hemolink');
  await conn.query('SET FOREIGN_KEY_CHECKS=0');
  await conn.query('TRUNCATE TABLE reponses_alertes');
  await conn.query('TRUNCATE TABLE alertes');
  await conn.query('TRUNCATE TABLE stocks_sang');
  await conn.query('TRUNCATE TABLE donneurs');
  await conn.query('TRUNCATE TABLE hopitaux');
  await conn.query('SET FOREIGN_KEY_CHECKS=1');

  const [hRes] = await conn.query('INSERT INTO hopitaux (nom, ville, telephone, latitude, longitude, email) VALUES ?', [
    hopitaux.map((h) => [h.nom, h.ville, h.tel, h.lat, h.lng, h.email]),
  ]);
  const firstHopitalId = Number(hRes.insertId);

  const stockRows = [];
  for (let i = 0; i < hopitaux.length; i++) {
    const hid = firstHopitalId + i;
    for (const g of GROUPS) {
      let q = Math.floor(Math.random() * 25) + 1;
      let seuil = 5;
      if (i === 0 && (g === 'O-' || g === 'AB-')) {
        q = Math.floor(Math.random() * 3);
      }
      if (i === 2 && g === 'A+') q = 2;
      if (i === 4 && g === 'B+') q = 1;
      stockRows.push([hid, g, q, seuil]);
    }
  }
  await conn.query('INSERT INTO stocks_sang (hopital_id, groupe_sanguin, quantite_poches, seuil_critique) VALUES ?', [stockRows]);

  const donneurRows = [];
  for (let i = 0; i < 30; i++) {
    const v = villes[i % villes.length];
    const nom = noms[i % noms.length];
    const prenom = prenoms[i % prenoms.length];
    const gs = GROUPS[i % GROUPS.length];
    const dispo = i % 7 !== 0;
    const attente = !dispo && i % 2 === 0;
    const disponible = attente ? 0 : dispo ? 1 : 0;
    const enAttente = attente ? 1 : 0;
    const tel = `+221 77 ${100 + (i % 900)} ${String(10 + (i % 89)).padStart(2, '0')} ${String(10 + (i % 89)).padStart(2, '0')}`;
    const derniere = new Date();
    derniere.setMonth(derniere.getMonth() - (i % 6));
    const d = derniere.toISOString().slice(0, 10);
    donneurRows.push([
      nom,
      `${prenom}${i > 0 && i % 20 === 0 ? ' Jr' : ''}`,
      tel,
      gs,
      v.ville,
      `Quartier ${(i % 5) + 1}`,
      jitter(v.lat),
      jitter(v.lng),
      disponible,
      enAttente,
      d,
    ]);
  }
  await conn.query(
    'INSERT INTO donneurs (nom, prenom, telephone, groupe_sanguin, ville, quartier, latitude, longitude, disponible, en_attente_validation, derniere_date_don) VALUES ?',
    [donneurRows]
  );

  const [dIds] = await conn.query('SELECT id FROM donneurs ORDER BY id ASC');
  const donorIds = dIds.map((r) => r.id);

  const [a1] = await conn.query(
    `INSERT INTO alertes (hopital_id, groupe_sanguin, niveau_urgence, message, rayon_km, statut, donneurs_contactes, donneurs_repondus, date_creation)
     VALUES (?, 'O-', 'critique', 'Besoin urgent de poches O- pour bloc opératoire.', 50, 'en_cours', 8, 2, NOW())`,
    [firstHopitalId]
  );
  const alerte1Id = a1.insertId;

  const [a2] = await conn.query(
    `INSERT INTO alertes (hopital_id, groupe_sanguin, niveau_urgence, message, rayon_km, statut, donneurs_contactes, donneurs_repondus, date_creation)
     VALUES (?, 'A+', 'urgent', 'Renfort stock A+ — maternité.', 25, 'en_cours', 12, 4, NOW())`,
    [firstHopitalId + 4]
  );
  const alerte2Id = a2.insertId;

  const reponses = [];
  for (let j = 0; j < 3; j++) {
    reponses.push([alerte1Id, donorIds[j], j === 0 ? 'accepte' : j === 1 ? 'refuse' : 'pas_repondu', j < 2 ? new Date() : null]);
  }
  for (let j = 3; j < 8; j++) {
    reponses.push([alerte1Id, donorIds[j], 'pas_repondu', null]);
  }
  for (let j = 0; j < 5; j++) {
    reponses.push([alerte2Id, donorIds[10 + j], j < 2 ? 'accepte' : 'pas_repondu', j < 2 ? new Date() : null]);
  }
  await conn.query('INSERT INTO reponses_alertes (alerte_id, donneur_id, reponse, date_reponse) VALUES ?', [reponses]);

  await conn.query(
    `INSERT INTO alertes (hopital_id, groupe_sanguin, niveau_urgence, message, rayon_km, statut, donneurs_contactes, donneurs_repondus, date_creation, date_resolution)
     VALUES (?, 'B+', 'normal', 'Besoin planifié — bilan satisfait.', 10, 'resolue', 5, 5, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY))`,
    [firstHopitalId + 1]
  );

  await conn.end();
  console.log('Seed HemoLink terminé : hôpitaux, stocks, 30 donneurs, 2 alertes actives + 1 résolue.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
