import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('DATABASE_URL is not defined');
    process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Granting admin rights to all users...');
    const result = await prisma.ownerUser.updateMany({
        data: { isAdmin: true } as any // Using as any because of possible type sync delay
    });
    console.log(`Success! Updated ${result.count} users.`);
}

main()
    .catch(err => console.error('Error:', err))
    .finally(() => {
        prisma.$disconnect();
        pool.end();
    });
