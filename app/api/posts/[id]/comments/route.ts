import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getSession();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId } = await params;

    const comments = await prisma.comment.findMany({
        where: { postId },
        orderBy: { createdAt: 'asc' },
        include: {
            dog: { select: { id: true, name: true, breed: true } },
        },
    });

    return NextResponse.json(comments);
}
