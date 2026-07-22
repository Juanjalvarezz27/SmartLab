import { PrismaClient } from '@prisma/client';
import { seedEstados } from './seeders/estadoSeeder';
import { seedMetodosPago } from './seeders/metodoPagoSeeder';
import { seedTiposDescuento } from './seeders/tipoDescuentoSeeder';
import { seedUsuarios } from './seeders/usuarioSeeder';
import { seedCategorias } from './seeders/categoriaSeeder';     
import { seedSubcategorias } from './seeders/subcategoriaSeeder';  
import { seedPruebas } from './seeders/pruebaSeeder';
import { seedServiciosExtra } from './seeders/servicioExtraSeeder';
import { seedCostosFijos } from './seeders/costoFijoSeeder'; 

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando carga de datos (InitDB)...');

  try {
    // 1. Estados y Tipos (Globales)
    await seedEstados(prisma);
    console.log('Estados de orden cargados correctamente.');

    await seedTiposDescuento(prisma);
    console.log('Tipos de descuento cargados correctamente.');

    // 2. Crear Laboratorio Demo (Tenant Principal)
    let lab = await prisma.laboratorio.findFirst({
      where: { nombre: 'Laboratorio Leyma C.A.' }
    });

    if (!lab) {
      lab = await prisma.laboratorio.create({
        data: {
          nombre: 'Laboratorio Leyma C.A.',
          telefono: '+58 000 0000000',
          correo: 'info@smartlab.com',
          direccion: 'C.C. Demo, Local 1',
        }
      });
      console.log('Laboratorio Leyma C.A. creado correctamente.');
    } else {
      console.log('Laboratorio Leyma C.A. ya existe.');
    }

    const labId = lab.id;

    // 3. Crear Usuarios (SUPERADMIN, LABORATORIO, ASISTENTE)
    await seedUsuarios(prisma, labId);
    console.log('Usuarios base cargados correctamente.');

    // 4. Catálogos dependientes del Laboratorio
    await seedMetodosPago(prisma, labId);
    console.log('Metodos de pago cargados correctamente.');

    await seedCategorias(prisma, labId);
    console.log('Categorías de pruebas cargadas correctamente.');

    await seedSubcategorias(prisma, labId);
    console.log('Subcategorías de pruebas cargadas correctamente.');

    await seedPruebas(prisma, labId);
    console.log('Pruebas de laboratorio cargadas correctamente.');

    await seedServiciosExtra(prisma, labId);
    console.log('Servicios extra cargados correctamente.');

    await seedCostosFijos(prisma, labId);
    console.log('Costos fijos cargados correctamente.');

    console.log('Sistema inicializado con exito.');
  } catch (error) {
    console.error('Error en la carga de datos iniciales:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();