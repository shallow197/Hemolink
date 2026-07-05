/** Valide une requête SQL en lecture seule pour l’assistant IA */
export function validateReadOnlySql(sql) {
  if (!sql || typeof sql !== 'string') {
    return { ok: false, error: 'Requête vide ou invalide.' };
  }
  let s = sql.trim();
  if (s.endsWith(';')) s = s.slice(0, -1).trim();

  const blockComment = /\/\*[\s\S]*?\*\//g;
  s = s.replace(blockComment, '');
  if (/--/m.test(s)) {
    return { ok: false, error: 'Les commentaires SQL ne sont pas autorisés.' };
  }

  if (s.includes(';')) {
    return { ok: false, error: 'Une seule instruction SQL est autorisée.' };
  }

  const upper = s.toUpperCase();
  if (!upper.startsWith('SELECT')) {
    return { ok: false, error: 'Seules les requêtes SELECT sont autorisées.' };
  }

  const forbidden = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|REPLACE|GRANT|REVOKE|EXECUTE|CALL|OUTFILE|DUMPFILE|LOAD_FILE|LOAD\s+DATA)\b/i;
  if (forbidden.test(s)) {
    return { ok: false, error: 'Cette requête contient des opérations non autorisées.' };
  }

  const allowedTables = ['donneurs', 'hopitaux', 'stocks_sang', 'alertes', 'reponses_alertes'];
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

  return { ok: true, sql: s };
}
