import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const topics = await prisma.bulletinTopic.findMany({
        orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
        include: {
            owner: { select: { id: true, dogs: { select: { name: true, iconUrl: true }, take: 1 } } },
            _count: { select: { posts: true } },
            posts: { orderBy: { createdAt: 'desc' }, take: 1 }
        }
    });

    const now = new Date();
    const result = topics.map(t => ({
        ...t,
        isNew: (now.getTime() - new Date(t.updatedAt).getTime()) < 24 * 60 * 60 * 1000,
        isMyTopic: t.ownerId === userId,
    }));

    return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, body } = await req.json();
    if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 });

    const topic = await prisma.bulletinTopic.create({
        data: { ownerId: userId, title: title.trim(), body: body?.trim() ?? '' },
        include: {
            owner: { select: { id: true, dogs: { select: { name: true, iconUrl: true }, take: 1 } } },
            _count: { select: { posts: true } }
        }
    });
    return NextResponse.json(topic, { status: 201 });
}
