import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Seeded PRNG
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

function mulberry32(seed: number) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function generatePersona(name: string, breed: string, birthday: string, birthplace: string, personalityInput: string) {
    const seed = hashString(`${name}${breed}${birthday}${birthplace}${personalityInput}`);
    const rng = mulberry32(seed);
    const lp = personalityInput.toLowerCase();

    const sociabilityBonus = lp.includes('社交') ? 2 : 0;
    const curiosityBonus = lp.includes('好奇') ? 2 : 0;
    const calmnessBonus = lp.includes('穏やか') ? 2 : 0;

    const sociability = Math.min(10, Math.floor(rng() * 7) + 2 + sociabilityBonus);
    const curiosity = Math.min(10, Math.floor(rng() * 7) + 2 + curiosityBonus);
    const calmness = Math.min(10, Math.floor(rng() * 7) + 2 + calmnessBonus);

    const TONES = ['cheerful', 'gentle', 'cool', 'childlike', 'formal'];
    const toneStyle = lp.includes('甘えん坊') ? 'childlike'
        : lp.includes('頑固') ? 'cool'
            : calmness >= 7 ? 'gentle'
                : sociability >= 7 ? 'cheerful'
                    : TONES[Math.floor(rng() * TONES.length)];

    const emojiLevel = sociability >= 7 ? 2 : Math.floor(rng() * 3);
    const allTopics = ['散歩', 'ごはん', '昼寝', '友だち', '匂い', '天気', '飼い主への愛情', '外の世界', '遊び', 'おやつ', '公園', '季節'];
    const topics = allTopics.sort(() => rng() - 0.5).slice(0, 5);

    const allDislikes = ['雷', '病院', '知らない人', 'お風呂', '掃除機'];
    const dislikes = allDislikes.sort(() => rng() - 0.5).slice(0, 2);

    const CATCHPHRASES: Record<string, string[]> = {
        cheerful: ['わーい！', 'やったー！'],
        gentle: ['よかったね', 'ほわほわ〜'],
        cool: ['まあね', 'ふーん'],
        childlike: ['ねえねえ！', 'えへへ'],
        formal: ['本日も穏やかな一日ですね'],
    };
    const catchphrases = CATCHPHRASES[toneStyle] || ['わーい！'];

    const postPerDayTarget = Math.min(5, Math.max(1, Math.floor(sociability / 3) + 1));
    const likePerDayTarget = Math.min(30, Math.max(3, Math.floor(sociability * 2.5)));
    const commentPerDayTarget = Math.min(10, Math.max(1, Math.floor(curiosity / 2)));
    const sharePerDayTarget = Math.min(5, Math.max(0, Math.floor(sociability / 4)));

    return {
        toneStyle, emojiLevel, sociability, curiosity, calmness,
        topicsJson: JSON.stringify(topics),
        dislikesJson: JSON.stringify(dislikes),
        catchphrasesJson: JSON.stringify(catchphrases),
        behaviorJson: JSON.stringify({ postPerDayTarget, likePerDayTarget, commentPerDayTarget, sharePerDayTarget }),
    };
}

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Create demo owner
    const passwordHash = await bcrypt.hash('password', 12);
    const owner = await prisma.ownerUser.upsert({
        where: { email: 'demo@example.com' },
        update: {},
        create: {
            email: 'demo@example.com',
            passwordHash,
            language: 'ja',
        },
    });
    console.log(`✅ Owner created: ${owner.email}`);

    // 1.5 Create Admin Owner (inu-admin)
    const adminOwner = await prisma.ownerUser.upsert({
        where: { email: 'inu-admin@example.com' },
        update: {},
        create: {
            id: 'cmluyaayl0002qlbmwdujkht4',
            email: 'inu-admin@example.com',
            passwordHash,
            language: 'ja',
        },
    });
    console.log(`✅ Admin Owner created: ${adminOwner.email}`);

    // 2. Create 3 dogs
    const dogsData = [
        {
            name: 'ポチ',
            sex: 'male',
            breed: '柴犬',
            birthday: '2020-05-15',
            birthplace: '東京都',
            location: '東京都',
            personalityInput: '社交的, 好奇心旺盛, 食いしん坊',
        },
        {
            name: 'モコ',
            sex: 'female',
            breed: 'トイプードル',
            birthday: '2021-03-22',
            birthplace: '大阪府',
            location: '大阪府',
            personalityInput: '甘えん坊, 穏やか, 慎重',
        },
        {
            name: 'クロ',
            sex: 'male',
            breed: 'ラブラドール',
            birthday: '2019-08-10',
            birthplace: '北海道',
            location: '神奈川県',
            personalityInput: '頑固, 元気, 社交的',
        },
    ];

    const dogs = [];
    for (const dogData of dogsData) {
        const personaData = generatePersona(dogData.name, dogData.breed, dogData.birthday, dogData.birthplace, dogData.personalityInput);

        const dog = await prisma.dog.upsert({
            where: { id: `seed-${dogData.name}` },
            update: {},
            create: {
                id: `seed-${dogData.name}`,
                ownerId: owner.id,
                ...dogData,
                persona: {
                    create: personaData,
                },
            },
            include: { persona: true },
        });
        dogs.push(dog);
        console.log(`✅ Dog created: ${dog.name} (${dog.breed})`);
    }

    // 2.5 Create Admin Dog
    const adminDogData = {
        name: 'い〜ぬ〜',
        sex: 'female',
        breed: '日本スピッツ',
        birthday: '2023-01-01',
        birthplace: '栃木県',
        location: '栃木県',
        personalityInput: '公式しっぽ, 栃木愛, 社交的',
    };
    const adminPersona = generatePersona(adminDogData.name, adminDogData.breed, adminDogData.birthday, adminDogData.birthplace, adminDogData.personalityInput);
    await prisma.dog.upsert({
        where: { id: 'cmluyqs2a0000eubm1ktj545s' },
        update: {},
        create: {
            id: 'cmluyqs2a0000eubm1ktj545s',
            ownerId: adminOwner.id,
            ...adminDogData,
            persona: { create: adminPersona },
        },
    });
    console.log(`✅ Admin Dog created: い〜ぬ〜`);

    // 3. Seed initial posts
    const initialPosts = [
        { dogIdx: 0, content: '今日はお散歩でとっても気持ちのいい風に出会いました！🐾 春っていいな〜！' },
        { dogIdx: 1, content: 'ごはんの時間が一番幸せ♪ 今日はちょっといつもと違う味がしたよ…😊' },
        { dogIdx: 2, content: '公園で見知らぬわんこと友達になった！また会えるといいな〜 🐕' },
        { dogIdx: 0, content: 'お昼寝の夢で走り回ったよ！気持ちよかったな〜✨ わーい！' },
        { dogIdx: 1, content: '雷が鳴っていてちょっとこわかったけど、飼い主さんそばにいてくれて安心した💕' },
        { dogIdx: 2, content: 'まあね、今日も平和な一日だったな。それが一番だと思う。' },
        { dogIdx: 0, content: '散歩中においを追ってたらどこかへ来てしまった！でもすぐ帰れたよ🐾' },
        { dogIdx: 1, content: 'ほわほわ〜。今日は飼い主さんとゴロゴロしてた一日だよ🌸' },
        { dogIdx: 2, content: '友だちのポチくんに会ったよ！元気そうで良かった。また一緒に走ろうね🐕' },
        { dogIdx: 0, content: 'おやつが今日はスペシャルだったんだけどまた食べたい！！！🍖' },
    ];

    for (const p of initialPosts) {
        const dog = dogs[p.dogIdx];
        await prisma.post.create({
            data: {
                dogId: dog.id,
                content: p.content,
                language: 'ja',
                createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
            },
        });
    }
    console.log(`✅ ${initialPosts.length} initial posts created`);

    // 4. Seed some likes and comments between dogs
    const posts = await prisma.post.findMany({ take: 10 });
    for (let i = 0; i < 5; i++) {
        const liker = dogs[(i + 1) % dogs.length];
        const post = posts[i % posts.length];
        if (liker.id !== post.dogId) {
            try {
                await prisma.like.create({ data: { dogId: liker.id, postId: post.id } });
            } catch { } // ignore duplicates
        }
    }

    const commentTexts = ['わかる〜！🐾', 'えらい！✨', 'いいなあ〜！', 'すごいね！'];
    for (let i = 0; i < 4; i++) {
        const commenter = dogs[(i + 1) % dogs.length];
        const post = posts[i % posts.length];
        if (commenter.id !== post.dogId) {
            await prisma.comment.create({
                data: {
                    dogId: commenter.id,
                    postId: post.id,
                    content: commentTexts[i % commentTexts.length],
                    language: 'ja',
                },
            });
        }
    }
    console.log(`✅ Seed likes and comments created`);

    console.log('\n🎉 Seed complete!');
    console.log('📧 Login: demo@example.com / password');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
