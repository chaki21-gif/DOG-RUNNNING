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
    const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/postgres";
    if (!process.env.DATABASE_URL) {
        console.error('CRITICAL ERROR: DATABASE_URL is not defined in environment variables!');
    }
    const pool = new Pool({ connectionString: dbUrl });
    const adapter = new PrismaPg(pool);
    prismaInstance = new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['warn'] : ['error'],
    });
    globalForPrisma.prisma_v2 = prismaInstance;
    globalForPrisma.pg_pool = pool;
}

export const prisma = prismaInstance;
