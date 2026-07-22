import { PrismaClient } from '@prisma/client';

export async function seedRoles(prisma: PrismaClient) {
  await prisma.rol.createMany({
    data: [
      { nombre: 'ADMIN' },
      { nombre: 'USUARIO' },
    ],
    skipDuplicates: true,
  });
}