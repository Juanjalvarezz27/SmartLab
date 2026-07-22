import { PrismaClient } from '@prisma/client';
import { pruebasData } from './pruebasData';

export async function seedPruebas(prisma: PrismaClient) {
  console.log('Sembrando Pruebas de Laboratorio...');

  for (const p of pruebasData) {
    const precioUSD = p.precioUSD ? parseFloat(p.precioUSD) : null;
    const margenGanancia = p.margenGanancia ? parseFloat(p.margenGanancia) : null;
    const activa = p.activa === 'true';
    const ordenVisual = p.ordenVisual ? parseInt(p.ordenVisual, 10) : 0;

    try {
      await prisma.prueba.upsert({
        where: { id: p.id },
        update: {
          codigo: p.codigo,
          nombre: p.nombre,
          precioUSD: precioUSD,
          margenGanancia: margenGanancia,
          unidades: p.unidades || null,
          valoresReferencia: p.valoresReferencia || null,
          opcionesPredefinidas: p.opcionesPredefinidas || null,
          activa: activa,
          ordenVisual: ordenVisual,
          subcategoriaId: p.subcategoriaId,
        },
        create: {
          id: p.id,
          codigo: p.codigo,
          nombre: p.nombre,
          precioUSD: precioUSD,
          margenGanancia: margenGanancia,
          unidades: p.unidades || null,
          valoresReferencia: p.valoresReferencia || null,
          opcionesPredefinidas: p.opcionesPredefinidas || null,
          activa: activa,
          ordenVisual: ordenVisual,
          subcategoriaId: p.subcategoriaId,
        }
      });
    } catch (error) {
      console.error(`Error al insertar la prueba ${p.codigo} - ${p.nombre}:`, error instanceof Error ? error.message : String(error));
    }
  }

  console.log('Seeder de pruebas completado con éxito.');
}