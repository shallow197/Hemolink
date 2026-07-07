// =====================================================================
// logger.js — Journalisation des requêtes HTTP (sans dépendance)
// =====================================================================
// Équivalent minimaliste de morgan : pour chaque requête on loggue
//   [2026-07-07T12:00:00.000Z] GET /api/donneurs 200 12ms
// Le code couleur (vert 2xx, jaune 4xx, rouge 5xx) facilite la lecture
// en dev. Désactivable via LOG_REQUESTS=0 dans .env.
// =====================================================================

const COLORS = { green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', reset: '\x1b[0m' };

function colorFor(status) {
  if (status >= 500) return COLORS.red;
  if (status >= 400) return COLORS.yellow;
  return COLORS.green;
}

export function requestLogger(req, res, next) {
  if (process.env.LOG_REQUESTS === '0') return next();
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const c = colorFor(res.statusCode);
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ` +
      `${c}${res.statusCode}${COLORS.reset} ${ms.toFixed(1)}ms`
    );
  });

  next();
}
