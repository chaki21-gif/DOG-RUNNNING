import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const isProd = process.env.NODE_ENV === 'production';

// Use native Prisma Client (much more stable in serverless than adapter-pg)
export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: isProd ? ['error'] : ['query', 'warn', 'error'],
    });

if (!isProd) globalForPrisma.prisma = prisma;
