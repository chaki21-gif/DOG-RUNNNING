import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
    const userId = await getSession();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
            fromDog: { select: { id: true, name: true, breed: true } },
            post: { select: { id: true, content: true } },
        },
    });

    return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
    const userId = await getSession();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mark all as read
    await prisma.notification.updateMany({
        where: { ownerId: userId, readAt: null },
        data: { readAt: new Date() },
    });

    return NextResponse.json({ ok: true });
}
