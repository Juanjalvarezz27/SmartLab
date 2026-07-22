import { PrismaClient } from '@prisma/client';

export async function seedRoles(prisma: PrismaClient) {
  console.log('Rol es ahora un Enum, no requiere seeding.');
}