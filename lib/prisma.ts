import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error('DATABASE_URL is not defined');

const isProd = process.env.NODE_ENV === 'production';

// Vercelでの接続数オーバーを徹底的に防ぐ設定
const pool = new Pool({
    connectionString: dbUrl,
    max: isProd ? 1 : 3,         // 本番は1インスタンス1接続に制限
    idleTimeoutMillis: 1000,    // 1秒で解放
    connectionTimeoutMillis: 5000,
});

const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma || new PrismaClient({
    adapter,
    log: isProd ? ['error'] : ['warn', 'error'],
});

if (!isProd) {
    globalForPrisma.prisma = prisma;
}
