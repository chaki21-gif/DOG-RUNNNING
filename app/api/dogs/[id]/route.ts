import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generatePersona } from '@/lib/persona';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const dog = await prisma.dog.findUnique({
            where: { id },
            include: {
                persona: true,
                posts: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                    include: {
                        dog: {
                            select: { id: true, name: true, breed: true, iconUrl: true }
                        },
                        _count: {
                            select: { likes: true, comments: true, reposts: true }
                        }
                    }
                },
                _count: {
                    select: { followers: true, following: true }
                }
            },
        });

        if (!dog) {
            return NextResponse.json({ error: 'Dog not found' }, { status: 404 });
        }

        return NextResponse.json(dog);
    } catch (error) {
        console.error('Error fetching dog profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getSession();
    const { id } = await params;

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            name, sex, breed, birthday, birthplace, location,
            personalityInput, iconBase64,
            activityLevel, socialStyle, favoriteRoutine
        } = body;

        // 自分の犬か確認
        const dog = await prisma.dog.findUnique({
            where: { id },
            include: { persona: true }
        });

        if (!dog || dog.ownerId !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // 性格等の入力が変わった場合はペルソナを再生成
        let updatedPersonaData = null;
        if (personalityInput || activityLevel !== undefined || socialStyle || favoriteRoutine) {
            updatedPersonaData = generatePersona(
                name || dog.name,
                breed || dog.breed,
                birthday || dog.birthday,
                birthplace || dog.birthplace,
                personalityInput || dog.personalityInput,
                {
                    activityLevel: activityLevel ?? 5,
                    socialStyle: socialStyle || 'friendly',
                    favoriteRoutine: favoriteRoutine || ''
                }
            );
        }

        const updatedDog = await prisma.dog.update({
            where: { id },
            data: {
                name: name !== undefined ? name : undefined,
                sex: sex !== undefined ? sex : undefined,
                breed: breed !== undefined ? breed : undefined,
                birthday: birthday !== undefined ? birthday : undefined,
                birthplace: birthplace !== undefined ? birthplace : undefined,
                location: location !== undefined ? location : undefined,
                personalityInput: personalityInput !== undefined ? personalityInput : undefined,
                iconUrl: iconBase64 !== undefined ? iconBase64 : undefined,
                persona: updatedPersonaData ? {
                    update: {
                        toneStyle: updatedPersonaData.toneStyle,
                        emojiLevel: updatedPersonaData.emojiLevel,
                        sociability: updatedPersonaData.sociability,
                        curiosity: updatedPersonaData.curiosity,
                        calmness: updatedPersonaData.calmness,
                        bio: updatedPersonaData.bio,
                        topicsJson: JSON.stringify(updatedPersonaData.topics),
                        dislikesJson: JSON.stringify(updatedPersonaData.dislikes),
                        catchphrasesJson: JSON.stringify(updatedPersonaData.catchphrases),
                        behaviorJson: JSON.stringify(updatedPersonaData.behaviorParams),
                    }
                } : undefined
            },
            include: {
                persona: true,
                posts: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                    include: {
                        dog: {
                            select: { id: true, name: true, breed: true, iconUrl: true }
                        },
                        _count: {
                            select: { likes: true, comments: true, reposts: true }
                        }
                    }
                },
                _count: {
                    select: { followers: true, following: true }
                }
            }
        });

        return NextResponse.json(updatedDog);
    } catch (error: any) {
        console.error('Error updating dog profile:', error);
        return NextResponse.json({ error: 'Update failed', details: error.message }, { status: 500 });
    }
}
