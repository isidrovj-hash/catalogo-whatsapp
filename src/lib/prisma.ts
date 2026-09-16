import { PrismaClient } from '@prisma/client';

// Evita agotar el pool de conexiones en desarrollo, donde Next.js recarga
// módulos en caliente y crearía un PrismaClient nuevo en cada cambio.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
