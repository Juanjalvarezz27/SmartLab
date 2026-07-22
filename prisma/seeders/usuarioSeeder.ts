import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedUsuarios(prisma: PrismaClient, laboratorioId: string) {
  const saltRounds = 10;
  const claveHasheada = await bcrypt.hash('1234', saltRounds);

  // 1. Administrador Principal (SUPERADMIN - Sin Laboratorio restringido)
  await prisma.usuario.upsert({
    where: { correo: 'admin@admin' },
    update: {
      nombre: 'Administrador Principal',
      rol: 'SUPERADMIN',
    }, 
    create: {
      nombre: 'Administrador Principal',
      correo: 'admin@admin',
      clave: claveHasheada,
      rol: 'SUPERADMIN',
      activo: true,
      laboratorioId: null, // Superadmin puede ver todo
    },
  });

  // 2. Dueño de Laboratorio (LABORATORIO)
  await prisma.usuario.upsert({
    where: { correo: 'hleslieag@gmail.com' },
    update: {
      nombre: 'Dra. Leslie Alvarez',
      rol: 'LABORATORIO',
      laboratorioId: laboratorioId
    }, 
    create: {
      nombre: 'Dra. Leslie Alvarez',
      correo: 'hleslieag@gmail.com',
      clave: claveHasheada,
      rol: 'LABORATORIO',
      activo: true,
      laboratorioId: laboratorioId
    },
  });

  // 3. Asistente (ASISTENTE)
  await prisma.usuario.upsert({
    where: { correo: 'asistente@gmail.com' },
    update: {
      nombre: 'Asistente de Laboratorio',
      rol: 'ASISTENTE',
      laboratorioId: laboratorioId
    }, 
    create: {
      nombre: 'Asistente de Laboratorio',
      correo: 'asistente@gmail.com',
      clave: claveHasheada,
      rol: 'ASISTENTE',
      activo: true,
      laboratorioId: laboratorioId
    },
  });
}