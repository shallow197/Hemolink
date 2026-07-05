import jwt from 'jsonwebtoken';

/**
 * Vérifie le token JWT dans Authorization: Bearer <token>.
 * Si optional=true, n'échoue pas si absent (utile pour /me).
 */
export function requireAuth({ optional = false } = {}) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      if (optional) {
        req.user = null;
        return next();
      }
      return res.status(401).json({ error: 'Authentification requise' });
    }

    try {
      const secret = process.env.JWT_SECRET || 'hemolink-dev-secret';
      const payload = jwt.verify(token, secret);
      req.user = {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        hopital_id: payload.hopital_id ?? null,
      };
      next();
    } catch (e) {
      if (optional) {
        req.user = null;
        return next();
      }
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
  };
}

/**
 * Restreint l'accès aux rôles indiqués.
 * Exemple : requireRole('hopital','cnts','admin')
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
