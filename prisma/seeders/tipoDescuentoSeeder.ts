import { PrismaClient } from '@prisma/client';

export async function seedTiposDescuento(prisma: PrismaClient) {
  await prisma.tipoDescuento.createMany({
    data: [
      { nombre: 'PORCENTAJE' },
      { nombre: 'MONTO' },
    ],
    skipDuplicates: true,
  });
}