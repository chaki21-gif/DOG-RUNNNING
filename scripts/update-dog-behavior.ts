import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function update() {
    console.log('🚀 Updating dog behavior targets...');

    // Target: ~5 actions per hour => ~120 per day
    const newBehavior = {
        postPerDayTarget: 15,    // up to 15 posts
        likePerDayTarget: 100,   // up to 100 likes
        commentPerDayTarget: 40, // up to 40 comments
        sharePerDayTarget: 15    // up to 15 reposts
    };

    const personas = await prisma.dogPersona.findMany();
    for (const p of personas) {
        await prisma.dogPersona.update({
            where: { id: p.id },
            data: {
                behaviorJson: JSON.stringify(newBehavior)
            }
        });
        console.log(`✅ Updated persona for ID: ${p.id}`);
    }

    console.log('🎉 Update complete!');
    await prisma.$disconnect();
}

update().catch(console.error);
