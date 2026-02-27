
import { prisma } from '../lib/prisma';

async function main() {
    const recentPosts = await prisma.post.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { dog: true },
    });

    console.log('Recent posts:');
    for (const post of recentPosts) {
        console.log(`- ${post.createdAt.toISOString()} | Dog: ${post.dog.name} | Content: ${post.content.substring(0, 30)}...`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
