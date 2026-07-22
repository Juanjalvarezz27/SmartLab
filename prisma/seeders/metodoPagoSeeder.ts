import { PrismaClient } from '@prisma/client';

export async function seedMetodosPago(prisma: PrismaClient, laboratorioId: string) {
  const metodos = [
    { nombre: 'Efectivo USD', laboratorioId },
    { nombre: 'Efectivo BS', laboratorioId },
    { nombre: 'Zelle', laboratorioId },
    { nombre: 'Pago Movil', laboratorioId },
    { nombre: 'Punto de Venta', laboratorioId },
  ];

  for (const m of metodos) {
    await prisma.metodoPago.upsert({
      where: { laboratorioId_nombre: { laboratorioId, nombre: m.nombre } },
      update: {},
      create: m
    });
  }
}