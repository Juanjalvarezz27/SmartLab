import { PrismaClient } from '@prisma/client';

export async function seedCostos(prisma: PrismaClient) {
  console.log('Iniciando seeder de estructura de costos (Vaciado)...');
  
  // 1. Configuración del Laboratorio Básica
  const config = await prisma.configuracionLaboratorio.findFirst();
  if (!config) {
    await prisma.configuracionLaboratorio.create({
      data: {
        volumenPruebasMensualEstimado: 1, // Valor por defecto inocuo
      },
    });
  }

  // Ya no inyectamos datos falsos
  console.log('  - Seeder de costos completado sin datos de prueba.');
}
