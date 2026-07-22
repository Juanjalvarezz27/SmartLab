import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const subcategorias = await prisma.subcategoriaPrueba.findMany({
    include: { pruebas: true }
  })
  console.log(JSON.stringify(subcategorias, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
