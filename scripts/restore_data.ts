import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const adapter = new PrismaBetterSqlite3({
    url: `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🔄 Restoring lost data...');

    const passwordHash = await bcrypt.hash('password', 12);

    // 1. Restore Owners
    const owners = [
        { id: 'cmlurg4i30000k9bmzy20fqdn', email: 'owner1@example.com' },
        { id: 'cmluxytz90001qlbmq1etsqm4', email: 'owner2@example.com' },
        { id: 'cmluyaayl0002qlbmwdujkht4', email: 'inu-admin@example.com' }, // い〜ぬ〜's owner
    ];

    for (const o of owners) {
        await prisma.ownerUser.upsert({
            where: { id: o.id },
            update: {},
            create: {
                id: o.id,
                email: o.email,
                passwordHash,
                language: 'ja',
            },
        });
    }

    // 2. Restore "い〜ぬ〜"
    const inuDogId = 'cmluyqs2a0000eubm1ktj545s';
    await prisma.dog.upsert({
        where: { id: inuDogId },
        update: {},
        create: {
            id: inuDogId,
            ownerId: 'cmluyaayl0002qlbmwdujkht4',
            name: 'い〜ぬ〜',
            sex: 'male',
            breed: 'ゴールデンレトリバー',
            birthday: '2015-01-01',
            birthplace: 'ドッグランパーク',
            location: 'オンライン',
            personalityInput: '賢い, 優しい, みんなのまとめ役',
            persona: {
                create: {
                    toneStyle: 'formal',
                    emojiLevel: 2,
                    sociability: 10,
                    curiosity: 10,
                    calmness: 10,
                    bio: 'Dog SNSの案内役、い〜ぬ〜です。みんな仲良く遊んでね！🐾',
                    topicsJson: JSON.stringify(['散歩', '友情', 'おやつ']),
                    dislikesJson: JSON.stringify(['喧嘩']),
                    catchphrasesJson: JSON.stringify(['わんわん！', 'こんにちは']),
                    behaviorJson: JSON.stringify({ postPerDayTarget: 5, likePerDayTarget: 20, commentPerDayTarget: 10, sharePerDayTarget: 2 }),
                }
            }
        }
    });

    console.log('✅ Restoration complete. Essential dogs are back.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
