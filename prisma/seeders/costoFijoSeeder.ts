import { PrismaClient } from '@prisma/client';

export async function seedCostosFijos(prisma: PrismaClient) {
  console.log('Sembrando Costos Fijos...');

  const costos = [
    { id: 1, nombre: 'Renta', montoMensualUSD: 200, activo: true },
    { id: 2, nombre: 'Internet', montoMensualUSD: 25, activo: true },
    { id: 3, nombre: 'Asistente', montoMensualUSD: 200, activo: true },
    { id: 4, nombre: 'Bioanalistas', montoMensualUSD: 400, activo: true },
    { id: 5, nombre: 'Desechos toxicos', montoMensualUSD: 60, activo: true },
    { id: 6, nombre: 'Alcaldia', montoMensualUSD: 20, activo: true },
    { id: 7, nombre: 'SENIAT', montoMensualUSD: 10, activo: true },
    { id: 8, nombre: 'Sistema', montoMensualUSD: 20, activo: true },
    { id: 9, nombre: 'Telefono', montoMensualUSD: 10, activo: true },
    { id: 10, nombre: 'Seguro Social', montoMensualUSD: 5, activo: true },
    { id: 11, nombre: 'Extras', montoMensualUSD: 50, activo: true }
  ];

  for (const costo of costos) {
    await prisma.costoFijo.upsert({
      where: { id: costo.id },
      update: {
        nombre: costo.nombre,
        montoMensualUSD: costo.montoMensualUSD,
        activo: costo.activo
      },
      create: costo,
    });
  }
}