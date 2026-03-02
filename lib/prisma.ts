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
    // Supabase無料プランの接続上限に合わせて制限
    // 本番: max=3（複数のVercel Functionが並列実行される可能性を考慮）
    // 開発: max=5
    const isProd = process.env.NODE_ENV === 'production';
    const pool = new Pool({
        connectionString: dbUrl,
        max: isProd ? 3 : 5,
        idleTimeoutMillis: 10000,   // 10秒でアイドル接続を解放
        connectionTimeoutMillis: 5000, // 5秒で接続タイムアウト
    });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({
        adapter,
        log: isProd ? ['error'] : ['warn', 'error'],
    });
    globalForPrisma.prisma = prisma;
    globalForPrisma.pgPool = pool;
}

export { prisma };
