import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// PATCH /api/bulletin/[id]/posts/[postId] - 投稿編集
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; postId: string }> }
) {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { postId } = await params;
    const { content } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 });

    const post = await prisma.bulletinPost.findUnique({ where: { id: postId } });
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (post.ownerId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const updated = await prisma.bulletinPost.update({
        where: { id: postId },
        data: { content: content.trim() },
    });
    return NextResponse.json(updated);
}

// DELETE /api/bulletin/[id]/posts/[postId] - 投稿削除
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string; postId: string }> }
) {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { postId } = await params;

    const post = await prisma.bulletinPost.findUnique({ where: { id: postId } });
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (post.ownerId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.bulletinPost.delete({ where: { id: postId } });
    return NextResponse.json({ ok: true });
}
