// =====================================================================
// validate.js — Middleware Express de validation avec Zod
// =====================================================================
// Au lieu de répéter "if (!body.email) return res.status(400)..." dans
// chaque route, on définit un SCHÉMA Zod et on plug ce middleware.
// Si les données reçues ne respectent pas le schéma, on renvoie un 400
// propre avec la liste des erreurs avant même de toucher au handler.
// =====================================================================

/**
 * Crée un middleware qui valide req[source] (par défaut : req.body) avec
 * un schéma Zod. Si invalide → 400 + détails. Si valide → on remplace
 * req[source] par la version "parsed" (avec defaults et coercion) et next().
 *
 * Usage : router.post('/', validate(loginSchema), handler)
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = req[source];
    // safeParse ne lève pas d'exception : il renvoie { success, error|data }
    const result = schema.safeParse(data);
    if (!result.success) {
      // On formate les erreurs Zod en liste claire pour le frontend
      const issues = result.error.issues.map((i) => ({
        path: i.path.join('.'),  // ex : "email" ou "donneur.poids_kg"
        message: i.message,
      }));
      return res.status(400).json({ error: 'Données invalides', issues });
    }
    // On remplace par la version validée (Zod applique defaults, coerce, etc.)
    req[source] = result.data;
    next();
  };
}

// =====================================================================
// EXPLICATION POUR LA SOUTENANCE (10 secondes) :
// ---------------------------------------------------------------------
// Zod est une bibliothèque qui permet de définir le SCHÉMA exact des
// données attendues (email valide, mot de passe ≥ 8 chars, poids > 0,
// etc.). Ce middleware factorise la validation : dans chaque route, on
// écrit juste `router.post('/', validate(monSchema), handler)`. Si le
// client envoie des données invalides, il reçoit un 400 propre avec la
// liste précise des problèmes — sans jamais que notre handler s'exécute.
// C'est une défense de type "Fail Fast" qui simplifie énormément le code.
// =====================================================================
