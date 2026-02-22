import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

async function checkUser() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('DATABASE_URL is missing');
        return;
    }
    const pool = new Pool({ connectionString: dbUrl });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const user = await prisma.ownerUser.findUnique({
            where: { email: 'clbr.spl@gmail.com' },
            include: { dogs: true }
        });

        if (!user) {
            console.log('User not found: clbr.spl@gmail.com');
        } else {
            console.log('User found:', user.email);
            console.log('Number of dogs:', user.dogs.length);
            if (user.dogs.length > 0) {
                console.log('Dog names:', user.dogs.map(d => d.name).join(', '));
            }
        }
    } catch (err) {
        console.error('Error fetching user:', err);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

checkUser();
