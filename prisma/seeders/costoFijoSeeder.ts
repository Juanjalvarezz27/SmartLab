import { PrismaClient } from '@prisma/client';

export async function seedCostosFijos(prisma: PrismaClient, laboratorioId: string) {
  console.log('Sembrando Costos Fijos...');

  const costos = [
    { nombre: 'Renta', montoMensualUSD: 200, activo: true },
    { nombre: 'Internet', montoMensualUSD: 25, activo: true },
    { nombre: 'Asistente', montoMensualUSD: 200, activo: true },
    { nombre: 'Bioanalistas', montoMensualUSD: 400, activo: true },
    { nombre: 'Desechos toxicos', montoMensualUSD: 60, activo: true },
    { nombre: 'Alcaldia', montoMensualUSD: 20, activo: true },
    { nombre: 'SENIAT', montoMensualUSD: 10, activo: true },
    { nombre: 'Sistema', montoMensualUSD: 20, activo: true },
    { nombre: 'Telefono', montoMensualUSD: 10, activo: true },
    { nombre: 'Seguro Social', montoMensualUSD: 5, activo: true },
    { nombre: 'Extras', montoMensualUSD: 50, activo: true }
  ];

  for (const costo of costos) {
    await prisma.costoFijo.upsert({
      where: { laboratorioId_nombre: { laboratorioId, nombre: costo.nombre } },
      update: {
        montoMensualUSD: costo.montoMensualUSD,
        activo: costo.activo
      },
      create: {
        ...costo,
        laboratorioId
      },
    });
  }
}