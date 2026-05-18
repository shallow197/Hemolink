// =====================================================================
// sqlGuard.js — Garde de sécurité pour les requêtes SQL générées par l'IA
// =====================================================================
// L'assistant IA (Groq/Llama) génère parfois des requêtes SQL pour répondre
// aux questions des utilisateurs. PROBLÈME : si on exécute aveuglément ce
// SQL, l'IA pourrait (volontairement ou par bug) faire DELETE, DROP,
// UPDATE, etc. C'est inacceptable pour un système médical.
//
// Cette fonction est notre "pare-feu" : elle inspecte le SQL généré et
// n'autorise QUE des SELECT en lecture seule, sur des tables spécifiques.
// =====================================================================

/** Valide une requête SQL en lecture seule pour l'assistant IA. */
export function validateReadOnlySql(sql) {
  // --- Garde 1 : la requête doit être une chaîne non vide ---
  if (!sql || typeof sql !== 'string') {
    return { ok: false, error: 'Requête vide ou invalide.' };
  }

  // Normalisation : on enlève espaces et point-virgule final
  let s = sql.trim();
  if (s.endsWith(';')) s = s.slice(0, -1).trim();

  // --- Garde 2 : pas de commentaires SQL ---
  // Les commentaires (-- ou /* */) peuvent cacher du code malicieux.
  // On supprime les blocs /* */ pour faciliter le parsing puis on refuse "--".
  const blockComment = /\/\*[\s\S]*?\*\//g;
  s = s.replace(blockComment, '');
  if (/--/m.test(s)) {
    return { ok: false, error: 'Les commentaires SQL ne sont pas autorisés.' };
  }

  // --- Garde 3 : une seule instruction (pas de stacked queries) ---
  // "SELECT 1; DROP TABLE users" doit être refusé.
  if (s.includes(';')) {
    return { ok: false, error: 'Une seule instruction SQL est autorisée.' };
  }

  // --- Garde 4 : doit commencer par SELECT ---
  const upper = s.toUpperCase();
  if (!upper.startsWith('SELECT')) {
    return { ok: false, error: 'Seules les requêtes SELECT sont autorisées.' };
  }

  // --- Garde 5 : aucun mot-clé de modification ou d'I/O fichier ---
  // Même dans une "SELECT", il est possible de glisser un INSERT via CTE.
  // On refuse tout mot-clé dangereux par regex.
  const forbidden = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|REPLACE|GRANT|REVOKE|EXECUTE|CALL|OUTFILE|DUMPFILE|LOAD_FILE|LOAD\s+DATA)\b/i;
  if (forbidden.test(s)) {
    return { ok: false, error: 'Cette requête contient des opérations non autorisées.' };
  }

  // --- Garde 6 : tables explicitement listées (whitelist) ---
  // Même en SELECT, on ne veut pas que l'IA lise des tables système
  // (mysql.user, information_schema.*, etc.). On ne tolère QUE nos tables métier.
  const allowedTables = ['donneurs', 'hopitaux', 'stocks_sang', 'alertes', 'reponses_alertes'];

  // On extrait toutes les tables nommées après FROM et JOIN
  const fromParts = s.match(/\bFROM\s+`?([a-zA-Z_][a-zA-Z0-9_]*)`?/gi) || [];
  const joinParts = s.match(/\bJOIN\s+`?([a-zA-Z_][a-zA-Z0-9_]*)`?/gi) || [];
  const tables = [];
  for (const m of fromParts) {
    const t = m.replace(/FROM\s+/i, '').replace(/`/g, '').trim();
    tables.push(t);
  }
  for (const m of joinParts) {
    const t = m.replace(/\bJOIN\s+/i, '').replace(/`/g, '').trim();
    tables.push(t);
  }

  if (tables.length === 0) {
    return { ok: false, error: 'La requête doit citer au moins une table dans FROM.' };
  }

  for (const t of tables) {
    if (!allowedTables.includes(t)) {
      return { ok: false, error: `Table non autorisée : ${t}` };
    }
  }

  // Tout est OK : on renvoie la requête nettoyée, prête à exécuter
  return { ok: true, sql: s };
}

// =====================================================================
// EXPLICATION POUR LA SOUTENANCE (15 secondes) :
// ---------------------------------------------------------------------
// On utilise une IA (Llama 3.3 via Groq) pour répondre aux questions du
// staff médical en langage naturel. Mais l'IA génère du SQL, et exécuter
// ce SQL sans contrôle serait dangereux : elle pourrait faire DROP TABLE,
// lire la table des mots de passe, etc. Ce "garde" inspecte chaque requête
// avec 6 vérifications successives (commence par SELECT, pas de commentaire,
// une seule instruction, pas de mots-clés dangereux, et table dans une
// whitelist). Si une seule garde échoue → requête refusée. C'est une
// approche "défense en profondeur" indispensable pour un système médical.
// =====================================================================
