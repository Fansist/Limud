/**
 * Prisma Client — v9.5.0
 * 
 * Optimized for concurrent users:
 * - Connection pooling with explicit limits
 * - Global singleton pattern (prevents connection leaks in dev hot-reload)
 * - Logging only in development
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    // Connection pool size is controlled by DATABASE_URL ?connection_limit=N
    // Default: 5 in SQLite, configurable in PostgreSQL/MySQL
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
