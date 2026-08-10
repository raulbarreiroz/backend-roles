import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { autorSchema, autorUpdateSchema } from '../validators/schemas.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res, next) => {
  try {
    const autores = await db.autor.findMany({
      include: { _count: { select: { libros: true } } },
      orderBy: { nombre: 'asc' },
    });
    res.json(autores);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const autor = await db.autor.findUnique({
      where: { id },
      include: { libros: true },
    });
    if (!autor) return res.status(404).json({ error: 'Autor no encontrado' });
    res.json(autor);
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(autorSchema), async (req, res, next) => {
  try {
    const autor = await db.autor.create({ data: req.body });
    res.status(201).json(autor);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validate(autorUpdateSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const autor = await db.autor.update({ where: { id }, data: req.body });
    res.json(autor);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await db.autor.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
