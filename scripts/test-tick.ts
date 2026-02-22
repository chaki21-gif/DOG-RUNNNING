import { runTick } from '../lib/scheduler';

async function main() {
    console.log('--- Social Tick Start ---');
    const stats = await runTick();
    console.log('Tick complete:', JSON.stringify(stats, null, 2));

    // 最近の投稿を表示して確認
    const { prisma } = require('../lib/prisma');
    const recentPosts = await prisma.post.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { dog: { select: { name: true } } }
    });
    console.log('Recent Posts generated:');
    recentPosts.forEach((p: any) => console.log(`- [${p.dog.name}]: ${p.content.substring(0, 30)}...`));

    process.exit(0);
}

main().catch(err => {
    console.error('Tick failed:', err);
    process.exit(1);
});
