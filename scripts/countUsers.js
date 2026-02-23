// countUsers.js — DBのユーザー/犬を調査するシンプルスクリプト
const { PrismaClient } = require('../node_modules/@prisma/client');

// .envを手動読み込み
const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf-8');
for (const line of envContent.split('\n')) {
    const m = line.match(/^([A-Z_]+)="?(.+?)"?\s*$/);
    if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2];
    }
}

const prisma = new PrismaClient();

const TEST_PATTERNS = [
    /test/i, /seed/i, /dummy/i, /sample/i,
    /^dog\d+@/i, /example\.com/i, /fake/i, /bot/i,
    /system/i, /admin.*@.*\.com$/i,
];

function isTest(email) {
    return TEST_PATTERNS.some(p => p.test(email));
}

async function main() {
    const allUsers = await prisma.ownerUser.findMany({
        include: { dogs: { select: { name: true, breed: true } } },
        orderBy: { createdAt: 'asc' },
    });

    const [postCount, likeCount, commentCount, dogCount, followCount, repostCount] = await Promise.all([
        prisma.post.count(),
        prisma.like.count(),
        prisma.comment.count(),
        prisma.dog.count(),
        prisma.follow.count(),
        prisma.repost.count(),
    ]);

    console.log('\n============================================================');
    console.log('  DOG RUNNING — ユーザー / 犬 調査レポート');
    console.log('  ' + new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));
    console.log('============================================================\n');

    let testCount = 0, realCount = 0;

    for (let i = 0; i < allUsers.length; i++) {
        const u = allUsers[i];
        const adminFlag = u.isAdmin ? '👑' : '  ';
        const typeFlag = isTest(u.email) ? '🤖テスト' : '👤実ユーザー';
        const dogs = u.dogs.map(d => `${d.name}(${d.breed})`).join(', ') || '犬なし';
        const jst = new Date(u.createdAt.getTime() + 9 * 3600 * 1000)
            .toISOString().replace('T', ' ').slice(0, 16);

        if (isTest(u.email)) testCount++; else realCount++;

        console.log(`${String(i + 1).padStart(2)}. ${adminFlag} ${typeFlag}  ${u.email}`);
        console.log(`    登録: ${jst} JST  |  犬: ${dogs}`);
    }

    console.log('\n============================================================');
    console.log('【サマリー】');
    console.log(`  総ユーザー数         : ${allUsers.length} 人`);
    console.log(`  👤 実ユーザー        : ${realCount} 人`);
    console.log(`  🤖 テストアカウント  : ${testCount} 人`);
    console.log(`  👑 管理者            : ${allUsers.filter(u => u.isAdmin).length} 人`);
    console.log(`  🐕 総犬数            : ${dogCount} 頭`);
    console.log(`  犬なしユーザー       : ${allUsers.filter(u => u.dogs.length === 0).length} 人`);
    console.log('\n【SNS活動状況】');
    console.log(`  📝 総投稿数          : ${postCount.toLocaleString()} 件`);
    console.log(`  ❤️  総いいね数       : ${likeCount.toLocaleString()} 件`);
    console.log(`  💬 総コメント数      : ${commentCount.toLocaleString()} 件`);
    console.log(`  🔁 総リポスト数      : ${repostCount.toLocaleString()} 件`);
    console.log(`  👥 総フォロー数      : ${followCount.toLocaleString()} 件`);
    console.log('============================================================\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
