// =====================================================================
// auth.js — Middleware d'authentification JWT et de contrôle de rôle
// =====================================================================
// Toutes les routes protégées passent par ces deux middlewares.
// JWT = jeton signé envoyé par le client dans le header HTTP Authorization.
// =====================================================================

import jwt from 'jsonwebtoken';

// --- Middleware 1 : requireAuth ----------------------------------------
/**
 * Vérifie qu'un token JWT valide accompagne la requête.
 *   - Si token absent ou invalide → renvoie 401 (sauf si optional=true)
 *   - Si token OK → décodage et attache l'utilisateur à req.user
 *
 * Usage : router.get('/me', requireAuth(), handler)
 */
export function requireAuth({ optional = false } = {}) {
  return (req, res, next) => {
    // 1) Extraction du token depuis "Authorization: Bearer xxx.yyy.zzz"
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    // 2) Pas de token : refuser, sauf si la route le tolère
    if (!token) {
      if (optional) {
        req.user = null;
        return next();
      }
      return res.status(401).json({ error: 'Authentification requise' });
    }

    // 3) Vérification cryptographique du token avec notre secret serveur
    try {
      const secret = process.env.JWT_SECRET || 'hemolink-dev-secret';
      const payload = jwt.verify(token, secret); // lève si signature invalide ou expiré

      // 4) On copie les infos utiles dans req.user pour la suite du pipeline
      req.user = {
        id: payload.id,
        email: payload.email,
        role: payload.role,            // 'donneur' | 'hopital' | 'cnts' | 'admin'
        hopital_id: payload.hopital_id ?? null,
      };
      next();
    } catch (e) {
      // Token expiré ou trafiqué
      if (optional) {
        req.user = null;
        return next();
      }
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
  };
}

// --- Middleware 2 : requireRole ----------------------------------------
/**
 * Restreint l'accès aux seuls rôles indiqués.
 * À chaîner APRÈS requireAuth().
 *
 * Usage : router.get('/admin', requireAuth(), requireRole('cnts','admin'), handler)
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé pour ce rôle' });
    }
    next();
  };
}

// =====================================================================
// EXPLICATION POUR LA SOUTENANCE (15 secondes) :
// ---------------------------------------------------------------------
// On a 4 rôles dans HemoLink : donneur, hopital, cnts, admin. Chacun a
// accès à des routes différentes. Au lieu de répéter la vérification dans
// chaque handler, on définit DEUX middlewares :
//   • requireAuth() vérifie que l'utilisateur est connecté (JWT valide)
//   • requireRole('hopital','cnts') restreint à certains rôles
// Sur chaque route on les chaîne : un donneur qui tente d'appeler une
// route staff reçoit un 403 propre. C'est le pattern standard d'Express.
// Le JWT est stocké côté navigateur dans localStorage et envoyé à chaque
// requête dans le header Authorization.
// =====================================================================
