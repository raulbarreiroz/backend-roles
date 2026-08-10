import { PrismaClient } from '@prisma/client';

// Una sola instancia para toda la app
export const db = new PrismaClient();
