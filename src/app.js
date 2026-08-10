import express from 'express';
import authRoutes from './routes/auth.js';
import autoresRoutes from './routes/autores.js';
import librosRoutes from './routes/libros.js';
import prestamosRoutes from './routes/prestamos.js';
import { notFound, errorHandler } from './middleware/errors.js';

export function buildApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'biblio-api' });
  });

  app.use('/auth', authRoutes);
  app.use('/api/autores', autoresRoutes);
  app.use('/api/libros', librosRoutes);
  app.use('/api/prestamos', prestamosRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
