import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generatePersona } from '@/lib/persona';

export async function POST(req: NextRequest) {
    const userId = await getSession();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            name, sex, breed, birthday, birthplace, location,
            personalityTraits, personalityFreeText,
            iconBase64, activityLevel, socialStyle, favoriteRoutine
        } = body;

        if (!name || !sex || !breed || !birthday || !birthplace || !location) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const personalityInput = [
            ...(Array.isArray(personalityTraits) ? personalityTraits : []),
            personalityFreeText || '',
        ]
            .filter(Boolean)
            .join(', ');

        console.log('[DEBUG] Starting dog registration for user:', userId);
        const user = await prisma.ownerUser.findUnique({ where: { id: userId } });
        if (!user) {
            console.error('[DEBUG] Owner not found:', userId);
            return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
        }

        const existingDog = await prisma.dog.findFirst({ where: { ownerId: userId } });
        if (existingDog) {
            console.warn('[DEBUG] User already has a dog:', userId);
            return NextResponse.json({ error: 'You already have a dog registered' }, { status: 409 });
        }

        console.log('[DEBUG] Generating persona...');
        const personaData = generatePersona(name, breed, birthday, birthplace, personalityInput, {
            activityLevel,
            socialStyle,
            favoriteRoutine
        });
        console.log('[DEBUG] Persona generated:', personaData.toneStyle);

        console.log('[DEBUG] Attempting prisma.dog.create...');
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
                iconUrl: iconBase64 || null,
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
            include: { persona: true },
        });

        // 登録直後の初期投稿を生成
        await prisma.post.create({
            data: {
                dogId: dog.id,
                content: `${dog.name}が仲間に加わりました！よろしくお願いします🐾`,
                language: 'ja',
            }
        });

        console.log('[DEBUG] 正常に愛犬を登録しました:', dog.id);
        return NextResponse.json(dog, { status: 201 });
    } catch (error: any) {
        console.error('[DEBUG] 重大な愛犬登録エラー:', {
            message: error.message,
            code: error.code,
            meta: error.meta,
        });
        return NextResponse.json({
            error: '登録に失敗しました。画像が大きすぎる可能性があります。',
            details: error.message
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        const userId = await getSession();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const dog = await prisma.dog.findFirst({
            where: { ownerId: userId },
            include: {
                persona: true,
                _count: {
                    select: { followers: true, following: true }
                }
            },
        });

        if (!dog) {
            return NextResponse.json({ error: 'No dog found' }, { status: 404 });
        }

        return NextResponse.json(dog);
    } catch (err: any) {
        const fs = require('fs');
        fs.appendFileSync('/tmp/api_dog_error.log', `[${new Date().toISOString()}] ${err.stack}\n`);
        return NextResponse.json({ error: 'Server Error', details: err.message }, { status: 500 });
    }
}
