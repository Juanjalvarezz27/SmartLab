import { PrismaClient } from '@prisma/client';

export async function seedCategorias(prisma: PrismaClient) {
  console.log('Sembrando Categorías de Pruebas...');

  const categorias = [
    { id: 1, nombre: 'HEMATOLOGIA' },
    { id: 2, nombre: 'QUIMICA' },
    { id: 3, nombre: 'QUIMICA URINARIA' },
    { id: 5, nombre: 'HORMONAS' },
    { id: 6, nombre: 'PERFILES' },
    { id: 7, nombre: 'COAGULACION' },
    { id: 8, nombre: 'ORINA' },
    { id: 9, nombre: 'VELOCIDAD DE SEDIMENTACION GLOBULAR' },
    { id: 10, nombre: 'HECES' }
  ];

  for (const cat of categorias) {
    await prisma.categoriaPrueba.upsert({
      where: { id: cat.id },
      update: { nombre: cat.nombre },
      create: cat,
    });
  }
}