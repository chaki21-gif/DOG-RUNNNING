import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const adapter = new PrismaBetterSqlite3({
    url: `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🔗 Re-linking "い〜ぬ〜" to the current active owner...');

    // 1. 最近作成された（今ログインしている可能性が高い）オーナーを取得
    const latestOwner = await prisma.ownerUser.findFirst({
        orderBy: { createdAt: 'desc' }
    });

    if (!latestOwner) {
        console.error('No owner found in database.');
        return;
    }

    // 2. 「い〜ぬ〜」(tj545s) の犬を探す
    const inuDog = await prisma.dog.findFirst({
        where: { id: { contains: 'tj545s' } }
    });

    if (inuDog) {
        const oldOwnerId = inuDog.ownerId;
        // 3. 今のオーナーを飼い主に設定
        await prisma.dog.update({
            where: { id: inuDog.id },
            data: { ownerId: latestOwner.id }
        });

        // 旧オーナーIDが予備のものであった場合、それを削除or統合
        if (oldOwnerId !== latestOwner.id) {
            console.log(`Updated owner for い〜ぬ〜 from ${oldOwnerId} to ${latestOwner.id}`);
        }
    } else {
        console.error('い〜ぬ〜 (tj545s) was not found to re-link.');
    }

    console.log('✅ Re-linking process finished.');
}

main().finally(() => prisma.$disconnect());
