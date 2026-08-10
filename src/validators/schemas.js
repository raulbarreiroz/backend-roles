import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombre: z.string().min(1).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const autorSchema = z.object({
  nombre: z.string().min(1),
  pais: z.string().optional(),
  biografia: z.string().optional(),
});

export const autorUpdateSchema = autorSchema.partial();

export const libroSchema = z.object({
  titulo: z.string().min(1),
  isbn: z.string().optional(),
  anio: z.number().int().min(0).max(2100).optional(),
  disponibles: z.number().int().min(0).default(1),
  autorId: z.number().int().positive(),
});

export const libroUpdateSchema = libroSchema.partial();

export const prestamoSchema = z.object({
  libroId: z.number().int().positive(),
  lectorNombre: z.string().min(1),
  lectorEmail: z.string().email(),
});
