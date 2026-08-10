import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { libroSchema, libroUpdateSchema } from '../validators/schemas.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res, next) => {
  try {
    const libros = await db.libro.findMany({
      include: { autor: { select: { id: true, nombre: true } } },
      orderBy: { titulo: 'asc' },
    });
    res.json(libros);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const libro = await db.libro.findUnique({
      where: { id },
      include: { autor: true, prestamos: true },
    });
    if (!libro) return res.status(404).json({ error: 'Libro no encontrado' });
    res.json(libro);
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(libroSchema), async (req, res, next) => {
  try {
    const autor = await db.autor.findUnique({ where: { id: req.body.autorId } });
    if (!autor) return res.status(400).json({ error: 'autorId no existe' });

    const libro = await db.libro.create({ data: req.body });
    res.status(201).json(libro);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validate(libroUpdateSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (req.body.autorId) {
      const autor = await db.autor.findUnique({ where: { id: req.body.autorId } });
      if (!autor) return res.status(400).json({ error: 'autorId no existe' });
    }
    const libro = await db.libro.update({ where: { id }, data: req.body });
    res.json(libro);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await db.libro.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
