import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('libros123', 10);

  await prisma.usuario.upsert({
    where: { email: 'bibliotecario@local.dev' },
    update: {},
    create: {
      email: 'bibliotecario@local.dev',
      passwordHash,
      nombre: 'Ana Bibliotecaria',
    },
  });

  const borges = await prisma.autor.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nombre: 'Jorge Luis Borges',
      pais: 'Argentina',
      biografia: 'Autor de Ficciones y El Aleph.',
    },
  });

  await prisma.libro.upsert({
    where: { isbn: '978-8420633130' },
    update: {},
    create: {
      titulo: 'Ficciones',
      isbn: '978-8420633130',
      anio: 1944,
      disponibles: 3,
      autorId: borges.id,
    },
  });

  console.log('Seed OK — bibliotecario@local.dev / libros123');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
