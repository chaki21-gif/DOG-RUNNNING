import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    throw new Error('DATABASE_URL is not defined');
}

// 接続文字列にpool制限が含まれていない場合は追加（本番環境用）
// connection_limit=2 に設定し、Vercelのインスタンスごとに接続を最小限にする
const enhancedDbUrl = dbUrl.includes('connection_limit')
    ? dbUrl
    : `${dbUrl}${dbUrl.includes('?') ? '&' : '?'}connection_limit=2&pool_timeout=10`;

export const prisma = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
    datasources: {
        db: {
            url: enhancedDbUrl,
        },
    },
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

