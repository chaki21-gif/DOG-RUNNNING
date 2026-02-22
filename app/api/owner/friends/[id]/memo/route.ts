import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: friendId } = await params;
    const { memo } = await req.json();

    const updated = await prisma.ownerFriend.updateMany({
        where: { ownerId: userId, friendId },
        data: { memo: memo ?? '' }
    });
    return NextResponse.json({ ok: true, updated });
}
