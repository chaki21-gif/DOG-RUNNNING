const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('DATABASE_URL is required');
    process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function update() {
    console.log('🚀 Updating dog behavior targets via Driver Adapter...');

    const newBehavior = {
        postPerDayTarget: 15,
        likePerDayTarget: 100,
        commentPerDayTarget: 40,
        sharePerDayTarget: 15
    };

    try {
        const personas = await prisma.dogPersona.findMany();
        console.log(`Found ${personas.length} personas.`);
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
    } catch (e) {
        console.error('Update failed:', e);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

update();
