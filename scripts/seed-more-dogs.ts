import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import { generatePersona } from '../lib/persona';

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const adapter = new PrismaBetterSqlite3({
    url: `file:${dbPath}`,
});
const prisma = new PrismaClient({ adapter });

const BREEDS = ['柴犬', 'プードル', 'チワワ', 'ゴールデンレトリバー', 'ポメラニアン', 'フレンチブルドッグ', 'ダックスフンド', 'シュナウザー', 'パグ', 'コーギー'];
const NAMES = ['ハナ', 'ソラ', 'コタロウ', 'モモ', 'チョコ', 'ベル', 'レオ', 'ムギ', 'サクラ', 'マル'];
const LOCATIONS = ['東京都 世田谷区', '神奈川県 横浜市', '大阪府 吹田市', '愛知県 名古屋市', '福岡県 福岡市', '北海道 札幌市', '千葉県 船橋市', '埼玉県 さいたま市', '兵庫県 神戸市', '京都府 京都市'];
const PERSONALITIES = [
    '散歩が大好きで、外に出ると尻尾が止まりません。',
    'ちょっと内気だけど、家族には甘えん坊です。',
    'とにかく食べることが大好き。おやつの音には敏感！',
    'ボール遊びなら誰にも負けません！',
    'のんびりお昼寝するのが一番の幸せ。',
    '近所の犬たちとドッグランで走るのが趣味。',
    '少し怖がりだけど、好奇心は旺盛です。',
    '飼い主のひざの上が定位置の、超甘えん坊。',
    '賢くて、新しい芸を覚えるのが得意。',
    'いつも元気いっぱい、家中を走り回っています。'
];

async function seed() {
    console.log('--- Seeding 10 additional test dogs ---');

    // Get an existing owner to attach these dogs to (or create a system owner)
    let owner = await prisma.ownerUser.findFirst();
    if (!owner) {
        console.log('No owner found. Please create one first or run regular seed.');
        return;
    }

    for (let i = 0; i < 10; i++) {
        const dogName = NAMES[i];
        const breed = BREEDS[i];
        const location = LOCATIONS[i];
        const personality = PERSONALITIES[i];
        const birthday = `202${Math.floor(Math.random() * 4)}-0${Math.floor(Math.random() * 9) + 1}-10`;

        const newDog = await prisma.dog.create({
            data: {
                name: dogName,
                ownerId: owner.id,
                breed: breed,
                sex: Math.random() > 0.5 ? 'male' : 'female',
                birthday: birthday,
                birthplace: '日本',
                location: location,
                personalityInput: personality,
            }
        });

        // Generate and save persona
        const personaData = generatePersona(dogName, breed, birthday, '日本', personality);
        await prisma.dogPersona.create({
            data: {
                dogId: newDog.id,
                toneStyle: personaData.toneStyle,
                emojiLevel: personaData.emojiLevel,
                sociability: personaData.sociability,
                curiosity: personaData.curiosity,
                calmness: personaData.calmness,
                bio: personaData.bio,
                topicsJson: JSON.stringify(personaData.topics),
                dislikesJson: JSON.stringify(personaData.dislikes),
                catchphrasesJson: JSON.stringify(personaData.catchphrases),
                behaviorJson: JSON.stringify(personaData.behaviorParams),
            }
        });

        console.log(`Added: ${dogName} (${breed})`);
    }

    console.log('Seeding complete.');
}

seed()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
