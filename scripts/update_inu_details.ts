import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

// Redefining generatePersona here to avoid ESM import issues in script
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

    const sociability = 8; // High based on "playful"
    const curiosity = 9;   // High based on "driving/going out"
    const calmness = 4;    // Lower based on "teasing others/hating bath"
    const toneStyle = 'cheerful';

    const bio = `${birthplace}生まれの${breed}です🐾 人間や他のわんこと遊ぶのが大好き！ドライブでお出かけするのも楽しみなんだ。たまにちょっかい出しすぎちゃうこともあるけど、仲良くしてね！`;

    return {
        toneStyle,
        emojiLevel: 2,
        sociability,
        curiosity,
        calmness,
        bio,
        topics: ['ドライブ', 'お出かけ', '遊び', '柴犬', '友だち'],
        dislikes: ['お風呂', '雷'],
        catchphrases: ['わーい！', 'ドライブいく？'],
        behaviorParams: {
            postPerDayTarget: 4,
            likePerDayTarget: 30,
            commentPerDayTarget: 10,
            sharePerDayTarget: 2
        }
    };
}

const adapter = new PrismaBetterSqlite3({
    url: `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('📝 Re-registering "い〜ぬ〜" with user-provided details...');

    const dogId = 'cmluyqs2a0000eubm1ktj545s';
    const name = 'い〜ぬ〜';
    const breed = '柴犬';
    const birthday = '2023-09-18';
    const sex = 'male';
    const birthplace = '栃木県';
    const location = '沖縄県';
    const personalityInput = '人間や犬と遊ぶのが大好き、ドライブも大好き、よく飼い主とお出かけに行く、好みのメスはスレンダーで小柄の子、自分のことを嫌がる犬にちょっかいをかけるクセがある、お風呂嫌い';

    // 1. Update Dog record
    await prisma.dog.update({
        where: { id: dogId },
        data: {
            name,
            breed,
            birthday,
            sex,
            birthplace,
            location,
            personalityInput
        }
    });

    // 2. Generate new Persona
    const personaData = generatePersona(name, breed, birthday, birthplace, personalityInput);

    // 3. Update DogPersona
    await prisma.dogPersona.update({
        where: { dogId: dogId },
        data: {
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

    console.log('✅ "い〜ぬ〜" has been updated successfully.');
}

main().finally(() => prisma.$disconnect());
