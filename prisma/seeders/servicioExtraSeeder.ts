import { PrismaClient } from '@prisma/client';

export async function seedServiciosExtra(prisma: PrismaClient, laboratorioId: string) {
  console.log('Iniciando seeder de servicios extra...');

  const servicios = [
    { nombre: 'Servicio de extracción', precioUSD: 0.5 },
    { nombre: 'Servicio de extracción hospitalaria', precioUSD: 1.0 },
    { nombre: 'Servicio de extracción a domicilio', precioUSD: 2.0 },
  ];

  for (const servicio of servicios) {
    await prisma.servicioExtra.upsert({
      where: { laboratorioId_nombre: { laboratorioId, nombre: servicio.nombre } },
      update: { precioUSD: servicio.precioUSD },
      create: {
        ...servicio,
        activo: true,
        laboratorioId,
      },
    });
  }
}
