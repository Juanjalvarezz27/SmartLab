import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const pruebas = await prisma.prueba.findMany({
    include: { subcategoria: { include: { categoria: true } } }
  });

  const map = new Map<string, { cat: string, sub: string }>();

  for (const p of pruebas) {
    if (!map.has(p.codigo) && p.subcategoria && p.subcategoria.nombre.toUpperCase() !== 'PRUEBA') {
      map.set(p.codigo, { cat: p.subcategoria.categoria.nombre, sub: p.subcategoria.nombre });
    }
  }

  let count = 0;
  for (const p of pruebas) {
    if (!p.categoriaVisual && !p.subcategoriaVisual) {
      const orig = map.get(p.codigo);
      if (orig) {
        await prisma.prueba.update({
          where: { id: p.id },
          data: { categoriaVisual: orig.cat, subcategoriaVisual: orig.sub }
        });
        count++;
      }
    }
  }

  console.log('Actualizados: ' + count);
}

main().catch(console.error).finally(() => prisma.$disconnect());