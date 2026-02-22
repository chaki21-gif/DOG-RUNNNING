import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const adapter = new PrismaBetterSqlite3({
    url: `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`,
});
const prisma = new PrismaClient({ adapter });

async function update() {
    console.log('🚀 Updating dog behavior targets...');

    // Target: ~5 actions per hour => ~120 per day
    const newBehavior = {
        postPerDayTarget: 120,
        likePerDayTarget: 300,
        commentPerDayTarget: 100,
        sharePerDayTarget: 50
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
