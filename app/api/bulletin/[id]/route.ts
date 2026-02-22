import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const topic = await prisma.bulletinTopic.findUnique({
        where: { id },
        include: {
            owner: { select: { id: true, dogs: { select: { name: true, iconUrl: true }, take: 1 } } },
            posts: {
                orderBy: { createdAt: 'asc' },
                include: {
                    owner: { select: { id: true, dogs: { select: { name: true, iconUrl: true }, take: 1 } } }
                }
            }
        }
    });

    if (!topic) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const enriched = {
        ...topic,
        isMyTopic: topic.ownerId === userId,
        posts: topic.posts.map(p => ({
            ...p,
            isMyPost: p.ownerId === userId,
        })),
    };

    return NextResponse.json(enriched);

}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { content } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 });

    const post = await prisma.bulletinPost.create({
        data: { topicId: id, ownerId: userId, content: content.trim() },
        include: {
            owner: { select: { id: true, dogs: { select: { name: true, iconUrl: true }, take: 1 } } }
        }
    });

    // トピックの updatedAt を更新
    await prisma.bulletinTopic.update({ where: { id }, data: { updatedAt: new Date() } });

    return NextResponse.json(post, { status: 201 });
}
