import { PrismaClient } from '@prisma/client';

export async function seedCategorias(prisma: PrismaClient, laboratorioId: string) {
  console.log('Sembrando Categorías de Pruebas...');

  const categorias = [
    { nombre: 'HEMATOLOGIA' },
    { nombre: 'QUIMICA' },
    { nombre: 'QUIMICA URINARIA' },
    { nombre: 'HORMONAS' },
    { nombre: 'PERFILES' },
    { nombre: 'COAGULACION' },
    { nombre: 'ORINA' },
    { nombre: 'VELOCIDAD DE SEDIMENTACION GLOBULAR' },
    { nombre: 'HECES' }
  ];

  for (const cat of categorias) {
    await prisma.categoriaPrueba.upsert({
      where: { laboratorioId_nombre: { laboratorioId, nombre: cat.nombre } },
      update: {},
      create: { ...cat, laboratorioId },
    });
  }
}