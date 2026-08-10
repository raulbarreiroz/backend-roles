import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { prestamoSchema } from '../validators/schemas.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res, next) => {
  try {
    const prestamos = await db.prestamo.findMany({
      include: { libro: { select: { id: true, titulo: true } } },
      orderBy: { fechaPrestamo: 'desc' },
    });
    res.json(prestamos);
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(prestamoSchema), async (req, res, next) => {
  try {
    const { libroId, lectorNombre, lectorEmail } = req.body;

    const result = await db.$transaction(async (tx) => {
      const libro = await tx.libro.findUnique({ where: { id: libroId } });
      if (!libro) {
        const e = new Error('Libro no encontrado');
        e.status = 404;
        throw e;
      }
      if (libro.disponibles < 1) {
        const e = new Error('Sin ejemplares disponibles');
        e.status = 409;
        throw e;
      }

      await tx.libro.update({
        where: { id: libroId },
        data: { disponibles: { decrement: 1 } },
      });

      return tx.prestamo.create({
        data: { libroId, lectorNombre, lectorEmail, estado: 'activo' },
      });
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/devolver', async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const updated = await db.$transaction(async (tx) => {
      const prestamo = await tx.prestamo.findUnique({ where: { id } });
      if (!prestamo) {
        const e = new Error('Préstamo no encontrado');
        e.status = 404;
        throw e;
      }
      if (prestamo.estado === 'devuelto') {
        const e = new Error('Ya estaba devuelto');
        e.status = 409;
        throw e;
      }

      await tx.libro.update({
        where: { id: prestamo.libroId },
        data: { disponibles: { increment: 1 } },
      });

      return tx.prestamo.update({
        where: { id },
        data: { estado: 'devuelto', fechaDevolucion: new Date() },
      });
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
