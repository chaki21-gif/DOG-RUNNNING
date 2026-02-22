import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import fs from 'fs';

const adapter = new PrismaBetterSqlite3({
    url: `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    const iconPath = '/Users/masuchiaki/.gemini/antigravity/brain/75c660a0-7d06-4ca0-b1e2-f129f8552ab2/shiba_inu_icon_1771691806745.png';
    const base64Content = fs.readFileSync(iconPath, 'base64');
    const iconUrl = `data:image/png;base64,${base64Content}`;

    await prisma.dog.update({
        where: { id: 'cmluyqs2a0000eubm1ktj545s' },
        data: { iconUrl }
    });
    console.log('✅ Icon updated successfully.');
}

main().finally(() => prisma.$disconnect());
