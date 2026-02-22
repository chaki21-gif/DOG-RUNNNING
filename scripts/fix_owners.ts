import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const adapter = new PrismaBetterSqlite3({
    url: `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🧹 Organizing dogs and owners...');

    const inuId = 'cmluyqs2a0000eubm1ktj545s';
    const pochiId = 'seed-ポチ';
    const mokoId = 'seed-モコ';
    const kuroId = 'seed-クロ';

    // Owners
    const adminOwnerId = 'cmluyaayl0002qlbmwdujkht4';
    const owner1Id = 'cmlurg4i30000k9bmzy20fqdn';
    const owner2Id = 'cmluxytz90001qlbmq1etsqm4';
    const demoOwnerId = 'cmlwj52zt0000igbm7j1g0cta';

    // Assign "い〜ぬ〜" to the admin owner (highly likely the user's current session)
    await prisma.dog.update({
        where: { id: inuId },
        data: { ownerId: adminOwnerId }
    });

    // Assign others to spread them out
    await prisma.dog.update({ where: { id: pochiId }, data: { ownerId: demoOwnerId } });
    await prisma.dog.update({ where: { id: mokoId }, data: { ownerId: owner1Id } });
    await prisma.dog.update({ where: { id: kuroId }, data: { ownerId: owner2Id } });

    console.log('✅ Dogs assigned to unique owners.');
    console.log('い〜ぬ〜 -> inu-admin (cmluyaayl...)');
    console.log('ポチ -> demoUser (cmlwj5...)');
    console.log('モコ -> owner1 (cmlurg...)');
    console.log('クロ -> owner2 (cmluxy...)');
}

main().finally(() => prisma.$disconnect());
