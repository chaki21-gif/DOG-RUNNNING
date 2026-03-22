import { Pool, types } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Force numeric types to be returned as numbers rather than strings
types.setTypeParser(types.builtins.NUMERIC, (val) => parseFloat(val));

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pgPool: Pool | undefined;
};

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error('DATABASE_URL is not defined');

const isProd = process.env.NODE_ENV === 'production';

// Pool configuration specifically for Vercel/Serverless
const pool = globalForPrisma.pgPool || new Pool({
    connectionString: dbUrl,
    max: isProd ? 1 : 10,        // Max connections per instance
    idleTimeoutMillis: 10000,   // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 10000,
    maxUses: 7500,              // Close connection after X uses to prevent leaks
});

if (!isProd) {
    globalForPrisma.pgPool = pool;
}

const adapter = new PrismaPg(pool);

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
        log: isProd ? ['error'] : ['query', 'warn', 'error'],
    });

if (!isProd) {
    globalForPrisma.prisma = prisma;
}
