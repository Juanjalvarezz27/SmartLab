import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedUsuarios(prisma: PrismaClient) {
  // 1. Buscamos los roles necesarios
  const adminRol = await prisma.rol.findUnique({ where: { nombre: 'ADMIN' } });
  const usuarioRol = await prisma.rol.findUnique({ where: { nombre: 'USUARIO' } });

  if (!adminRol || !usuarioRol) {
    throw new Error('Los roles ADMIN y USUARIO deben crearse antes que los usuarios.');
  }

  const saltRounds = 10;
  const claveHasheada = await bcrypt.hash('1234', saltRounds);

  // 2. Administrador Principal
  await prisma.usuario.upsert({
    where: { correo: 'admin@admin' },
    update: {
      nombre: 'Administrador Principal',
      rolId: adminRol.id,
    }, 
    create: {
      nombre: 'Administrador Principal',
      correo: 'admin@admin',
      clave: claveHasheada,
      rolId: adminRol.id,
      activo: true,
    },
  });

  // 3. Leslie Alvarez (ADMIN)
  await prisma.usuario.upsert({
    where: { correo: 'hleslieag@gmail.com' },
    update: {
      nombre: 'Dra. Leslie Alvarez',
      rolId: adminRol.id, // Asegura que mantenga el rol correcto
    }, 
    create: {
      nombre: 'Dra. Leslie Alvarez',
      correo: 'hleslieag@gmail.com',
      clave: claveHasheada,
      rolId: adminRol.id,
      activo: true,
    },
  });

  // 4. Mayira (ADMIN)
  await prisma.usuario.upsert({
    where: { correo: 'mayira@gmail.com' },
    update: {
      nombre: 'Lcda. Mayira Flores',
      rolId: adminRol.id,
    }, 
    create: {
      nombre: 'Lcda. Mayira Flores', 
      correo: 'mayira@gmail.com',
      clave: claveHasheada,
      rolId: adminRol.id,
      activo: true,
    },
  });

  // 5. Asistente General (USUARIO)
  await prisma.usuario.upsert({
    where: { correo: 'asistente@gmail.com' },
    update: {
      nombre: 'Asistente de Laboratorio',
      rolId: usuarioRol.id,
    }, 
    create: {
      nombre: 'Asistente de Laboratorio',
      correo: 'asistente@gmail.com',
      clave: claveHasheada,
      rolId: usuarioRol.id,
      activo: true,
    },
  });

  console.log(' Usuarios semilla creados y actualizados correctamente.');
}