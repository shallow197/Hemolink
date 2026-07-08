// =====================================================================
// test-api.js — Tests d'intégration des endpoints HemoLink (Pôle 4)
// =====================================================================
// ZÉRO dépendance : fetch natif (Node 18+) + child_process.
// Le script :
//   1. (option --init) réinitialise la base via scripts/init-db.js
//   2. démarre le serveur sur un port de test (4100)
//   3. exécute ~40 tests GET/POST/PUT/PATCH/DELETE sur l'API
//   4. affiche un rapport et sort avec un code 0 (succès) ou 1 (échec)
//
// Usage :
//   node scripts/test-api.js          → tests sur la base actuelle
//   node scripts/test-api.js --init   → réinitialise la base AVANT les tests
//   npm test                          → équivalent avec --init
//
// ⚠ Les tests écrivent en base (création/suppression d'un donneur de test,
//   une alerte, un don). Utiliser --init pour repartir d'une base propre.
// =====================================================================

import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_DIR = path.join(__dirname, '..');
const PORT = Number(process.env.TEST_PORT) || 4100;
const BASE = `http://127.0.0.1:${PORT}/api`;
const PASSWORD = 'Hemolink2026!';

// ---------------------------------------------------------------------
// Mini harnais de test
// ---------------------------------------------------------------------
let passed = 0;
let failed = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, error: e.message });
    console.log(`  ❌ ${name}\n     → ${e.message}`);
  }
}

function expect(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function api(method, url, { token, body } = {}) {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* réponse non-JSON */ }
  return { status: res.status, json };
}

async function login(email) {
  const { status, json } = await api('POST', '/auth/login', { body: { email, password: PASSWORD } });
  expect(status === 200 && json?.token, `login ${email} a échoué (HTTP ${status})`);
  return json.token;
}

// ---------------------------------------------------------------------
// Démarrage / arrêt du serveur de test
// ---------------------------------------------------------------------
let serverProc = null;

async function startServer() {
  serverProc = spawn(process.execPath, ['src/index.js'], {
    cwd: SERVER_DIR,
    env: { ...process.env, PORT: String(PORT), LOG_REQUESTS: '0', NODE_ENV: 'test' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  serverProc.stderr.on('data', (d) => process.stderr.write(`[serveur] ${d}`));

  // Attente du healthcheck (max 15 s)
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${BASE}/health`);
      if (r.ok) return;
    } catch { /* pas encore prêt */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('Le serveur de test ne démarre pas (vérifier MySQL et .env)');
}

function stopServer() {
  if (serverProc) serverProc.kill('SIGTERM');
}

// ---------------------------------------------------------------------
// Suite de tests
// ---------------------------------------------------------------------
async function main() {
  if (process.argv.includes('--init')) {
    console.log('♻  Réinitialisation de la base (init-db)...');
    const r = spawnSync(process.execPath, ['scripts/init-db.js'], { cwd: SERVER_DIR, stdio: 'inherit' });
    if (r.status !== 0) throw new Error('init-db a échoué');
  }

  console.log(`🚀 Démarrage du serveur de test sur le port ${PORT}...`);
  await startServer();
  console.log('');

  // ----- Santé & 404 --------------------------------------------------
  console.log('— Santé & routage —');
  await test('GET /health → 200', async () => {
    const { status, json } = await api('GET', '/health');
    expect(status === 200 && json.ok === true, `HTTP ${status}`);
  });
  await test('GET /route-inconnue → 404 JSON', async () => {
    const { status, json } = await api('GET', '/route-inconnue');
    expect(status === 404 && json?.error, `HTTP ${status}`);
  });

  // ----- Authentification ---------------------------------------------
  console.log('\n— Authentification —');
  let tokAdmin, tokCnts, tokFann, tokAminata;
  await test('POST /auth/login (admin) → 200 + token', async () => { tokAdmin = await login('admin@hemolink.sn'); });
  await test('POST /auth/login (cnts) → 200 + token', async () => { tokCnts = await login('cnts@hemolink.sn'); });
  await test('POST /auth/login (staff Fann) → 200 + token', async () => { tokFann = await login('fann@hemolink.sn'); });
  await test('POST /auth/login (donneur Aminata) → 200 + token', async () => { tokAminata = await login('aminata@example.sn'); });
  await test('POST /auth/login mauvais mot de passe → 401', async () => {
    const { status } = await api('POST', '/auth/login', { body: { email: 'admin@hemolink.sn', password: 'faux' } });
    expect(status === 401, `HTTP ${status}`);
  });
  await test('GET /auth/me avec token → 200', async () => {
    const { status, json } = await api('GET', '/auth/me', { token: tokAdmin });
    expect(status === 200 && json?.user?.email === 'admin@hemolink.sn', `HTTP ${status}`);
  });
  await test('GET /auth/me sans token → 401', async () => {
    const { status } = await api('GET', '/auth/me');
    expect(status === 401, `HTTP ${status}`);
  });

  // ----- Donneurs (staff) ----------------------------------------------
  console.log('\n— Donneurs (staff) —');
  await test('GET /donneurs (staff) → 200 + liste', async () => {
    const { status, json } = await api('GET', '/donneurs', { token: tokCnts });
    expect(status === 200 && Array.isArray(json) && json.length >= 30, `HTTP ${status}, ${json?.length} donneurs`);
  });
  await test('GET /donneurs (donneur) → 403', async () => {
    const { status } = await api('GET', '/donneurs', { token: tokAminata });
    expect(status === 403, `HTTP ${status}`);
  });
  await test('GET /donneurs?search=Diop → filtre par nom', async () => {
    const { status, json } = await api('GET', '/donneurs?search=Diop', { token: tokCnts });
    expect(status === 200 && json.length > 0 && json.every((d) => `${d.nom} ${d.prenom} ${d.telephone} ${d.email} ${d.quartier}`.includes('Diop')), `HTTP ${status}`);
  });
  await test('GET /donneurs?groupe_sanguin=O- → filtre groupe', async () => {
    const { status, json } = await api('GET', '/donneurs?groupe_sanguin=O-', { token: tokCnts });
    expect(status === 200 && json.length > 0 && json.every((d) => d.groupe_sanguin === 'O-'), `HTTP ${status}`);
  });
  await test('GET /donneurs?ville=Thiès → filtre localité', async () => {
    const { status, json } = await api('GET', '/donneurs?ville=Thi%C3%A8s', { token: tokCnts });
    expect(status === 200 && json.length > 0 && json.every((d) => d.ville.includes('Thiès')), `HTTP ${status}`);
  });
  await test('GET /donneurs?validation=attente → donneurs à valider', async () => {
    const { status, json } = await api('GET', '/donneurs?validation=attente', { token: tokCnts });
    expect(status === 200 && json.length > 0 && json.every((d) => d.en_attente_validation === 1), `HTTP ${status}`);
  });

  let donneurTestId;
  await test('POST /donneurs → 201 (création par staff)', async () => {
    const { status, json } = await api('POST', '/donneurs', {
      token: tokFann,
      body: {
        nom: 'Testeur', prenom: 'Pole Quatre', telephone: '+221700000042',
        groupe_sanguin: 'O+', ville: 'Dakar', sexe: 'homme',
        date_naissance: '1990-01-01', poids_kg: 75,
        latitude: 14.69, longitude: -17.44, en_attente_validation: true,
      },
    });
    expect(status === 201 && json?.id, `HTTP ${status}`);
    donneurTestId = json.id;
  });
  await test('POST /donneurs corps invalide → 400 (Zod)', async () => {
    const { status } = await api('POST', '/donneurs', { token: tokFann, body: { nom: 'X' } });
    expect(status === 400, `HTTP ${status}`);
  });
  await test('GET /donneurs/:id → 200 + éligibilité', async () => {
    const { status, json } = await api('GET', `/donneurs/${donneurTestId}`, { token: tokFann });
    expect(status === 200 && json?.eligibilite && json.nom === 'Testeur', `HTTP ${status}`);
  });
  await test('PATCH /donneurs/:id → 200 (modification staff)', async () => {
    const { status, json } = await api('PATCH', `/donneurs/${donneurTestId}`, {
      token: tokFann, body: { quartier: 'Plateau', poids_kg: 78 },
    });
    expect(status === 200 && json?.quartier === 'Plateau', `HTTP ${status}`);
  });
  await test('POST /donneurs/:id/valider (staff hôpital) → 403', async () => {
    const { status } = await api('POST', `/donneurs/${donneurTestId}/valider`, { token: tokFann });
    expect(status === 403, `HTTP ${status}`);
  });
  await test('POST /donneurs/:id/valider (cnts) → 200', async () => {
    const { status, json } = await api('POST', `/donneurs/${donneurTestId}/valider`, { token: tokCnts });
    expect(status === 200 && json?.ok, `HTTP ${status}`);
  });

  // ----- Espace donneur -------------------------------------------------
  console.log('\n— Espace donneur —');
  await test('GET /donneurs/me → 200 (profil + éligibilité)', async () => {
    const { status, json } = await api('GET', '/donneurs/me', { token: tokAminata });
    expect(status === 200 && json?.donneur?.prenom === 'Aminata' && json?.eligibilite, `HTTP ${status}`);
  });
  await test('PATCH /donneurs/me → 200 (édition profil)', async () => {
    const { status, json } = await api('PATCH', '/donneurs/me', { token: tokAminata, body: { quartier: 'Mermoz' } });
    expect(status === 200 && json?.donneur?.quartier === 'Mermoz', `HTTP ${status}`);
  });

  // ----- Hôpitaux & stocks ----------------------------------------------
  console.log('\n— Hôpitaux & stocks —');
  await test('GET /hopitaux (public) → 200 + stocks annotés', async () => {
    const { status, json } = await api('GET', '/hopitaux');
    expect(status === 200 && json.length >= 15 && json[0].stocks, `HTTP ${status}`);
  });
  await test('GET /hopitaux/:id → 200', async () => {
    const { status, json } = await api('GET', '/hopitaux/3');
    expect(status === 200 && json?.nom?.includes('Fann'), `HTTP ${status}`);
  });
  await test('PUT /hopitaux/3/stocks/O- (staff Fann) → 200', async () => {
    const { status, json } = await api('PUT', '/hopitaux/3/stocks/O-', {
      token: tokFann, body: { groupe_sanguin: 'O-', quantite_poches: 6, seuil_critique: 5 },
    });
    expect(status === 200 && json?.ok, `HTTP ${status}`);
  });
  await test('PUT /hopitaux/4/stocks/O- (staff Fann sur autre hôpital) → 403', async () => {
    const { status } = await api('PUT', '/hopitaux/4/stocks/O-', {
      token: tokFann, body: { groupe_sanguin: 'O-', quantite_poches: 6 },
    });
    expect(status === 403, `HTTP ${status}`);
  });
  await test('PUT stock sous le seuil → notification stock_critique créée', async () => {
    await api('PUT', '/hopitaux/3/stocks/AB-', {
      token: tokFann, body: { groupe_sanguin: 'AB-', quantite_poches: 1, seuil_critique: 2 },
    });
    const { status, json } = await api('GET', '/notifications?type=stock_critique&lu=0', { token: tokFann });
    expect(status === 200 && json.some((n) => n.titre.includes('AB-')), `HTTP ${status}`);
  });

  // ----- Cycle de vie d'une alerte ---------------------------------------
  console.log('\n— Alertes (cycle complet) —');
  let alerteId;
  await test('POST /hopitaux/alerte (staff Fann, O-, 25 km) → 201 + ciblage', async () => {
    const { status, json } = await api('POST', '/hopitaux/alerte', {
      token: tokFann,
      body: { groupe_sanguin: 'O-', niveau_urgence: 'critique', message: 'Test Pôle 4', rayon_km: 25, poches_necessaires: 1 },
    });
    expect(status === 201 && json?.id && json.donneurs_contactes >= 1, `HTTP ${status}, contactés=${json?.donneurs_contactes}`);
    alerteId = json.id;
  });
  await test('GET /alertes (staff) → 200, staff Fann ne voit que Fann', async () => {
    const { status, json } = await api('GET', '/alertes', { token: tokFann });
    expect(status === 200 && json.length > 0 && json.every((a) => a.hopital_nom.includes('Fann')), `HTTP ${status}`);
  });
  await test('GET /alertes/mes (Aminata) → contient la nouvelle alerte', async () => {
    const { status, json } = await api('GET', '/alertes/mes', { token: tokAminata });
    expect(status === 200 && json.some((n) => n.alerte_id === alerteId), `HTTP ${status}`);
  });
  await test('Notification alerte_urgente créée pour Aminata', async () => {
    const { status, json } = await api('GET', '/notifications?type=alerte_urgente&lu=0', { token: tokAminata });
    expect(status === 200 && json.some((n) => n.alerte_id === alerteId), `HTTP ${status}`);
  });
  await test('GET /alertes/:id (donneur destinataire) → 200 + timeline', async () => {
    const { status, json } = await api('GET', `/alertes/${alerteId}`, { token: tokAminata });
    expect(status === 200 && Array.isArray(json?.timeline), `HTTP ${status}`);
  });
  await test('POST /alertes/:id/repondre (accepte) → 200 + auto-résolution', async () => {
    const { status, json } = await api('POST', `/alertes/${alerteId}/repondre`, {
      token: tokAminata, body: { reponse: 'accepte' },
    });
    expect(status === 200 && json?.ok, `HTTP ${status}`);
    const detail = await api('GET', `/alertes/${alerteId}`, { token: tokFann });
    expect(detail.json?.statut === 'resolue', `statut=${detail.json?.statut} (attendu resolue)`);
  });
  await test('POST /alertes/:id/repondre 2e fois → 409', async () => {
    const { status } = await api('POST', `/alertes/${alerteId}/repondre`, {
      token: tokAminata, body: { reponse: 'refuse' },
    });
    expect(status === 409, `HTTP ${status}`);
  });
  await test('Notification alerte_resolue créée pour le staff Fann', async () => {
    const { status, json } = await api('GET', '/notifications?type=alerte_resolue&lu=0', { token: tokFann });
    expect(status === 200 && json.some((n) => n.alerte_id === alerteId), `HTTP ${status}`);
  });
  await test('PATCH /alertes/:id/statut → 200 (clôture manuelle)', async () => {
    const { status, json } = await api('PATCH', `/alertes/${alerteId}/statut`, {
      token: tokFann, body: { statut: 'resolue' },
    });
    expect(status === 200 && json?.ok, `HTTP ${status}`);
  });

  // ----- Enregistrement d'un don + notification don_reussi ----------------
  console.log('\n— Dons —');
  await test('POST /donneurs/1/dons (staff Fann) → 201', async () => {
    const { status, json } = await api('POST', '/donneurs/1/dons', {
      token: tokFann, body: { alerte_id: alerteId, poches_prelevees: 1 },
    });
    expect(status === 201 && json?.id, `HTTP ${status}`);
  });
  await test('Notification don_reussi créée pour Aminata', async () => {
    const { status, json } = await api('GET', '/notifications?type=don_reussi&lu=0', { token: tokAminata });
    expect(status === 200 && json.length > 0, `HTTP ${status}`);
  });
  await test('Le profil donneur est mis à jour (nombre_dons +1)', async () => {
    const { status, json } = await api('GET', '/donneurs/me', { token: tokAminata });
    expect(status === 200 && json?.donneur?.nombre_dons >= 5, `nombre_dons=${json?.donneur?.nombre_dons}`);
  });

  // ----- Notifications ------------------------------------------------------
  console.log('\n— Notifications —');
  let notifId;
  await test('GET /notifications (Aminata) → 200 + types variés', async () => {
    const { status, json } = await api('GET', '/notifications', { token: tokAminata });
    expect(status === 200 && json.length >= 3 && json[0].icone, `HTTP ${status}`);
    notifId = json.find((n) => !n.lu)?.id;
  });
  await test('GET /notifications?type=rappel_eligibilite → filtre par type', async () => {
    const { status, json } = await api('GET', '/notifications?type=rappel_eligibilite', { token: tokAminata });
    expect(status === 200 && json.every((n) => n.type === 'rappel_eligibilite'), `HTTP ${status}`);
  });
  await test('PATCH /notifications/:id/lu → 200', async () => {
    const { status, json } = await api('PATCH', `/notifications/${notifId}/lu`, { token: tokAminata });
    expect(status === 200 && json?.ok, `HTTP ${status}`);
  });
  await test('PATCH /notifications/:id/lu sur la notif d\'un autre → 404', async () => {
    const { status } = await api('PATCH', `/notifications/${notifId}/lu`, { token: tokFann });
    expect(status === 404, `HTTP ${status}`);
  });
  await test('POST /notifications/tout-lu → 200', async () => {
    const { status, json } = await api('POST', '/notifications/tout-lu', { token: tokAminata });
    expect(status === 200 && json?.ok, `HTTP ${status}`);
    const check = await api('GET', '/notifications?lu=0', { token: tokAminata });
    expect(check.json.length === 0, `${check.json.length} non lues restantes`);
  });
  await test('GET /notifications/count → 200 (cloche)', async () => {
    const { status, json } = await api('GET', '/notifications/count', { token: tokCnts });
    expect(status === 200 && typeof json?.total === 'number' && Array.isArray(json?.items), `HTTP ${status}`);
  });

  // ----- Dashboard & DELETE -------------------------------------------------
  console.log('\n— Dashboard & suppression —');
  await test('GET /dashboard/kpis (public) → 200', async () => {
    const { status, json } = await api('GET', '/dashboard/kpis');
    expect(status === 200 && json, `HTTP ${status}`);
  });
  await test('DELETE /donneurs/:id (staff hôpital) → 403', async () => {
    const { status } = await api('DELETE', `/donneurs/${donneurTestId}`, { token: tokFann });
    expect(status === 403, `HTTP ${status}`);
  });
  await test('DELETE /donneurs/:id (cnts) → 200', async () => {
    const { status, json } = await api('DELETE', `/donneurs/${donneurTestId}`, { token: tokCnts });
    expect(status === 200 && json?.ok, `HTTP ${status}`);
  });
  await test('GET /donneurs/:id après suppression → 404', async () => {
    const { status } = await api('GET', `/donneurs/${donneurTestId}`, { token: tokCnts });
    expect(status === 404, `HTTP ${status}`);
  });

  // ----- IA prédictive (Lots 2, 3, 4) ----------------------------------------
  console.log('\n— IA prédictive —');
  await test('GET /ai/previsions (staff Fann) → 200, uniquement son hôpital', async () => {
    const { status, json } = await api('GET', '/ai/previsions', { token: tokFann });
    expect(status === 200 && Array.isArray(json?.previsions) && json.previsions.length === 8, `HTTP ${status}, ${json?.previsions?.length} lignes`);
    expect(json.previsions.every((p) => p.hopital_id === 3), 'fuite de données d\'un autre hôpital');
    const p = json.previsions[0];
    expect('jours_autonomie' in p && 'date_rupture_estimee' in p && 'niveau' in p && 'conso_estimee_par_jour' in p, 'champs prédiction manquants');
  });
  await test('GET /ai/previsions (cnts) → 200, vue nationale + résumé', async () => {
    const { status, json } = await api('GET', '/ai/previsions', { token: tokCnts });
    expect(status === 200 && json.previsions.length >= 100, `HTTP ${status}, ${json?.previsions?.length} lignes`);
    expect(json.resume && typeof json.resume.critique === 'number', 'résumé manquant');
    // tri par autonomie croissante
    const j = json.previsions.map((p) => p.jours_autonomie);
    expect(j.every((v, i) => i === 0 || v >= j[i - 1]), 'tri par autonomie incorrect');
  });
  await test('GET /ai/previsions?niveau=critique → filtre', async () => {
    const { status, json } = await api('GET', '/ai/previsions?niveau=critique', { token: tokCnts });
    expect(status === 200 && json.previsions.every((p) => p.niveau === 'critique'), `HTTP ${status}`);
  });
  await test('GET /ai/previsions (donneur) → 403', async () => {
    const { status } = await api('GET', '/ai/previsions', { token: tokAminata });
    expect(status === 403, `HTTP ${status}`);
  });

  await test('GET /alertes/:id/recommandations → 200 + scores triés', async () => {
    const { status, json } = await api('GET', `/alertes/${alerteId}/recommandations`, { token: tokFann });
    expect(status === 200 && Array.isArray(json?.recommandations) && json.recommandations.length >= 1, `HTTP ${status}`);
    const r = json.recommandations[0];
    expect(typeof r.score === 'number' && r.details_score?.eligibilite && r.details_score?.fiabilite, 'détail du score manquant');
  });
  await test('GET /alertes/1/recommandations (alerte seed, 4 ciblés) → 200', async () => {
    const { status, json } = await api('GET', '/alertes/1/recommandations', { token: tokCnts });
    expect(status === 200 && json.recommandations.length === 4, `HTTP ${status}, ${json?.recommandations?.length} reco`);
    // les "pas_repondu" doivent être en tête
    const premiers = json.recommandations.slice(0, 2).map((r) => r.reponse_actuelle);
    expect(premiers.every((r) => r === 'pas_repondu'), `ordre inattendu : ${premiers.join(',')}`);
  });
  await test('GET /alertes/:id/recommandations (donneur) → 403', async () => {
    const { status } = await api('GET', `/alertes/${alerteId}/recommandations`, { token: tokAminata });
    expect(status === 403, `HTTP ${status}`);
  });

  let bilan1;
  await test('POST /ai/generer-notifications (cnts) → 200 + créations', async () => {
    // On provoque une rupture réelle à Fann pour tester la règle prédictive
    await api('PUT', '/hopitaux/3/stocks/AB-', {
      token: tokFann, body: { groupe_sanguin: 'AB-', quantite_poches: 0, seuil_critique: 2 },
    });
    const { status, json } = await api('POST', '/ai/generer-notifications', { token: tokCnts });
    expect(status === 200 && json?.ok && typeof json.total === 'number', `HTTP ${status}`);
    bilan1 = json;
    expect(json.total > 0, 'aucune notification générée (seed pourtant favorable)');
  });
  await test('POST /ai/generer-notifications rejoué → idempotent (0 doublon)', async () => {
    const { status, json } = await api('POST', '/ai/generer-notifications', { token: tokCnts });
    expect(status === 200 && json.total === 0, `2e passage a créé ${json?.total} notification(s) — doublons !`);
  });
  await test('POST /ai/generer-notifications (staff hôpital) → 403', async () => {
    const { status } = await api('POST', '/ai/generer-notifications', { token: tokFann });
    expect(status === 403, `HTTP ${status}`);
  });
  await test('Le staff Fann voit une notification stock_critique prédictive', async () => {
    const { status, json } = await api('GET', '/notifications?type=stock_critique&lu=0', { token: tokFann });
    expect(status === 200 && json.some((n) => n.titre.includes('rupture') || n.titre.includes('Rupture')), `HTTP ${status}, ${json?.length} notifs`);
  });

  // ----- Rapport --------------------------------------------------------------

  console.log('\n' + '='.repeat(60));
  console.log(`Résultat : ${passed} réussis · ${failed} échoués · ${passed + failed} total`);
  if (failures.length) {
    console.log('\nÉchecs :');
    failures.forEach((f) => console.log(`  ✗ ${f.name} — ${f.error}`));
  }
  console.log('='.repeat(60));

  stopServer();
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error('\n💥 Erreur fatale :', e.message);
  stopServer();
  process.exit(1);
});
