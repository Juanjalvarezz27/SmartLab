import { PrismaClient } from '@prisma/client';

export async function seedMetodosPago(prisma: PrismaClient) {
  await prisma.metodoPago.createMany({
    data: [
      { nombre: 'EFECTIVO_USD' },
      { nombre: 'EFECTIVO_BS' },
      { nombre: 'PAGO_MOVIL' },
      { nombre: 'TRANSFERENCIA_BS' },
      { nombre: 'PUNTO_VENTA' },
    ],
    skipDuplicates: true,
  });
}