import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
    const userId = await getSession();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dog = await prisma.dog.findFirst({ where: { ownerId: userId } });
    if (!dog) {
        return NextResponse.json([],);
    }

    const diaries = await prisma.dogDiary.findMany({
        where: { dogId: dog.id, ownerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
    });

    return NextResponse.json(diaries);
}

export async function POST(req: NextRequest) {
    const userId = await getSession();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dog = await prisma.dog.findFirst({ where: { ownerId: userId } });
    if (!dog) {
        return NextResponse.json({ error: 'No dog found' }, { status: 404 });
    }

    const { body, date, imageUrl } = await req.json();
    if (!body) {
        return NextResponse.json({ error: 'Body is required' }, { status: 400 });
    }

    const diaryDate = date || new Date().toISOString().split('T')[0];

    const diary = await prisma.dogDiary.create({
        data: {
            dogId: dog.id,
            ownerId: userId,
            date: diaryDate,
            body,
            imageUrl: imageUrl || null,
        },
    });

    return NextResponse.json(diary, { status: 201 });
}
