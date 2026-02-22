import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma_v2: PrismaClient | undefined;
    pg_pool: Pool | undefined;
};

let prismaInstance: PrismaClient;

if (globalForPrisma.prisma_v2) {
    prismaInstance = globalForPrisma.prisma_v2;
} else {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    prismaInstance = new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['warn'] : ['error'],
    });
    globalForPrisma.prisma_v2 = prismaInstance;
    globalForPrisma.pg_pool = pool;
}

export const prisma = prismaInstance;
