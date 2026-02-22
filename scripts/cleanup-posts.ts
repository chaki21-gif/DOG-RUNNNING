import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const adapter = new PrismaBetterSqlite3({
    url: `file:${dbPath}`,
});
const prisma = new PrismaClient({ adapter });

async function cleanup() {
    console.log('--- Cleaning up problematic posts ---');

    const inu = await prisma.dog.findFirst({
        where: { name: 'い〜ぬ〜' }
    });

    if (!inu) {
        console.log('い〜ぬ〜 not found.');
        return;
    }

    const posts = await prisma.post.findMany({
        where: {
            dogId: inu.id,
            OR: [
                { content: { contains: '今日のログ：' } },
                { content: { contains: '！ ' } }
            ]
        }
    });

    console.log(`Found ${posts.length} problematic posts. Deleting with dependencies...`);

    for (const post of posts) {
        // Delete dependent records first (since no CASCADE in schema)
        await prisma.like.deleteMany({ where: { postId: post.id } });
        await prisma.comment.deleteMany({ where: { postId: post.id } });
        await prisma.repost.deleteMany({ where: { postId: post.id } });
        await prisma.notification.deleteMany({ where: { postId: post.id } });

        await prisma.post.delete({ where: { id: post.id } });
        console.log(`Deleted: ${post.id}`);
    }

    console.log('Cleanup complete.');
}

cleanup()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
