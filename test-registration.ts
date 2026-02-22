import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const adapter = new PrismaBetterSqlite3({
    url: `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`,
});

const prisma = new PrismaClient({ adapter });

async function test() {
    console.log('--- DIAGNOSTIC START ---');
    try {
        // Mock data from user's report
        const userId = "cmluyaayl0002qlbmwdujkht4";
        const name = "い〜ぬ〜";
        const breed = "柴犬";
        const sex = "male";
        const birthday = "2023-09-18";
        const birthplace = "栃木県";
        const location = "沖縄県";
        const personalityInput = "sociable, cuddly, curious, stubborn, foodie, calm, energetic, intelligent, 人間や犬と遊ぶのが大好き、ドライブも大好き、よく飼い主とお出かけに行く、好みのメスはスレンダーで小柄の子、自分のことを嫌がる犬にちょっかいをかけるクセがある、お風呂嫌い";
        const iconUrl = null;

        // Mock persona data (normally from generatePersona)
        const personaData = {
            toneStyle: 'cheerful',
            emojiLevel: 2,
            sociability: 8,
            curiosity: 7,
            calmness: 5,
            bio: "栃木県生まれの柴犬です🐾 ドライブとお出かけが大好き！",
            topics: ["散歩", "ごはん", "友だち"],
            dislikes: ["お風呂"],
            catchphrases: ["わーい！"],
            behaviorParams: { postPerDayTarget: 3, likePerDayTarget: 15, commentPerDayTarget: 5, sharePerDayTarget: 2 }
        };

        // Attempt creation
        const dog = await prisma.dog.create({
            data: {
                ownerId: userId,
                name,
                sex,
                breed,
                birthday,
                birthplace,
                location,
                personalityInput,
                iconUrl,
                persona: {
                    create: {
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
                    },
                },
            },
        });

        console.log('SUCCESS: Dog created!', dog.id);
    } catch (error: any) {
        console.error('FAILURE: Prisma Error Details:');
        console.error('Message:', error.message);
        console.error('Code:', error.code);
        console.error('Meta:', error.meta);
    } finally {
        await prisma.$disconnect();
        console.log('--- DIAGNOSTIC END ---');
    }
}

test();
