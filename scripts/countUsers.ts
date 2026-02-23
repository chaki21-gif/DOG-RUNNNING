import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
    const allUsers = await prisma.ownerUser.findMany({
        include: { dogs: { select: { name: true, breed: true, createdAt: true } } },
        orderBy: { createdAt: 'asc' },
    });

    const postCount = await prisma.post.count();
    const likeCount = await prisma.like.count();
    const commentCount = await prisma.comment.count();
    const dogCount = await prisma.dog.count();
    const followCount = await (prisma as any).follow.count();
    const repostCount = await prisma.repost.count();

    // テストアカウントと判定するパターン
    const TEST_PATTERNS = [
        /test/i, /seed/i, /dummy/i, /sample/i, /dev/i,
        /^dog\d+@/i, /example\.com/i, /fake/i, /bot/i,
    ];
    const isTest = (email: string) => TEST_PATTERNS.some(p => p.test(email));

    console.log('\n============================================================');
    console.log('  DOG RUNNING — ユーザー / 犬 調査レポート');
    console.log('  調査日時: ' + new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));
    console.log('============================================================\n');

    console.log('【ユーザー一覧】');
    console.log('──────────────────────────────────────────────────────────');

    let testCount = 0;
    let realCount = 0;

    for (let i = 0; i < allUsers.length; i++) {
        const u = allUsers[i];
        const flag = u.isAdmin ? '👑ADMIN ' : '       ';
        const tFlag = isTest(u.email) ? '🤖テスト' : '👤実ユーザー';
        const dogs = u.dogs.map(d => `${d.name}(${d.breed})`).join(', ') || '犬なし';
        const jst = new Date(u.createdAt.getTime() + 9 * 3600 * 1000)
            .toISOString().replace('T', ' ').slice(0, 16);

        if (isTest(u.email)) testCount++; else realCount++;

        console.log(`${String(i + 1).padStart(2)}. ${flag}${tFlag} | ${u.email}`);
        console.log(`    登録: ${jst} JST | 犬: ${dogs}`);
    }

    console.log('\n============================================================');
    console.log('【サマリー】');
    console.log(`  総ユーザー数   : ${allUsers.length} 人`);
    console.log(`  👤 実ユーザー  : ${realCount} 人`);
    console.log(`  🤖 テストアカウント : ${testCount} 人`);
    console.log(`  👑 管理者      : ${allUsers.filter(u => u.isAdmin).length} 人`);
    console.log(`  🐕 総犬数      : ${dogCount} 頭`);
    console.log(`  犬なしユーザー : ${allUsers.filter(u => u.dogs.length === 0).length} 人`);
    console.log('');
    console.log('【SNS活動状況】');
    console.log(`  📝 総投稿数    : ${postCount.toLocaleString()} 件`);
    console.log(`  ❤️  総いいね数  : ${likeCount.toLocaleString()} 件`);
    console.log(`  💬 総コメント数: ${commentCount.toLocaleString()} 件`);
    console.log(`  🔁 総リポスト数: ${repostCount.toLocaleString()} 件`);
    console.log(`  👥 総フォロー数: ${followCount.toLocaleString()} 件`);
    console.log('============================================================\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
