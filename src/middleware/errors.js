export function notFound(_req, res) {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

export function errorHandler(err, _req, res, _next) {
  console.error('[error]', err);

  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Registro duplicado (unique constraint)' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Registro no encontrado' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Error interno',
  });
}
