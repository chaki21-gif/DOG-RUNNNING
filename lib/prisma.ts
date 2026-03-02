import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pgPool: Pool | undefined;
};

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error('DATABASE_URL is not defined');

const isProd = process.env.NODE_ENV === 'production';

// Poolの作成をシングルトン化
const pool = globalForPrisma.pgPool || new Pool({
    connectionString: dbUrl,
    max: isProd ? 1 : 2,         // Vercelインスタンス1つにつき最大1接続
    idleTimeoutMillis: 5000,    // 5秒でアイドルを解放
    connectionTimeoutMillis: 5000,
});

if (!isProd) {
    globalForPrisma.pgPool = pool;
}

const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma || new PrismaClient({
    adapter,
    log: isProd ? ['error'] : ['warn', 'error'],
});

if (!isProd) {
    globalForPrisma.prisma = prisma;
}


