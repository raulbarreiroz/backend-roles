/** Valida body/query/params con un schema Zod */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validación fallida',
        details: parsed.error.flatten(),
      });
    }
    req[source] = parsed.data;
    next();
  };
}
