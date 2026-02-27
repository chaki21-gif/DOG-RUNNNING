import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pgPool: Pool | undefined;
};

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    throw new Error('DATABASE_URL is not defined');
}

let prisma: PrismaClient;

if (globalForPrisma.prisma) {
    prisma = globalForPrisma.prisma;
} else {
    const pool = new Pool({ connectionString: dbUrl });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
    globalForPrisma.prisma = prisma;
    globalForPrisma.pgPool = pool;
}

export { prisma };
