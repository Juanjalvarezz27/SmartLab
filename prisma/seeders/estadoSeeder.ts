import { PrismaClient } from '@prisma/client';

export async function seedEstados(prisma: PrismaClient) {
  await prisma.estadoOrden.createMany({
    data: [
      { nombre: 'BORRADOR' },
      { nombre: 'CERRADA' },
      { nombre: 'ANULADA' },
    ],
    skipDuplicates: true,
  });
}