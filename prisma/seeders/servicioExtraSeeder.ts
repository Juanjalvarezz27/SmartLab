import { PrismaClient } from '@prisma/client';

export async function seedServiciosExtra(prisma: PrismaClient) {
  console.log('Iniciando seeder de servicios extra...');

  const servicios = [
    { nombre: 'Servicio de extracción', precioUSD: 0.5 },
    { nombre: 'Servicio de extracción hospitalaria', precioUSD: 1.0 },
    { nombre: 'Servicio de extracción a domicilio', precioUSD: 2.0 },
  ];

  for (const servicio of servicios) {
    await prisma.servicioExtra.upsert({
      where: { nombre: servicio.nombre },
      update: { precioUSD: servicio.precioUSD },
      create: {
        nombre: servicio.nombre,
        precioUSD: servicio.precioUSD,
        activo: true,
      },
    });
  }

  console.log('Seeder de servicios extra completado con éxito.');
}
