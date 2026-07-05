/**
 * Middleware de validation Zod.
 * Usage : router.post('/', validate(schema), handler)
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = req[source];
    const result = schema.safeParse(data);
    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return res.status(400).json({ error: 'Données invalides', issues });
    }
    req[source] = result.data;
    next();
  };
}
