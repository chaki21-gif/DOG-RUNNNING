import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// お友達一覧または届いているリクエストを取得
export async function GET(req: NextRequest) {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const friendships = await prisma.friendship.findMany({
        where: {
            OR: [
                { userAId: userId },
                { userBId: userId }
            ]
        },
        include: {
            userA: { select: { id: true, dogs: { select: { id: true, name: true, iconUrl: true } } } },
            userB: { select: { id: true, dogs: { select: { id: true, name: true, iconUrl: true } } } }
        }
    });

    return NextResponse.json(friendships);
}

// お友達申請
export async function POST(req: NextRequest) {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { targetUserId } = await req.json();
        if (userId === targetUserId) return NextResponse.json({ error: 'Cannot friend yourself' }, { status: 400 });

        // A < B の順序で保存することで重複を防ぐ
        const [userAId, userBId] = [userId, targetUserId].sort();

        const friendship = await prisma.friendship.upsert({
            where: {
                userAId_userBId: { userAId, userBId }
            },
            update: {},
            create: {
                userAId,
                userBId,
                status: 'PENDING'
            }
        });

        return NextResponse.json(friendship);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to send request' }, { status: 500 });
    }
}

// 承認または解除
export async function PATCH(req: NextRequest) {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { friendshipId, action } = await req.json(); // action: 'ACCEPT' or 'REJECT'

        if (action === 'ACCEPT') {
            const updated = await prisma.friendship.update({
                where: { id: friendshipId },
                data: { status: 'ACCEPTED' }
            });
            return NextResponse.json(updated);
        } else {
            const deleted = await prisma.friendship.delete({
                where: { id: friendshipId }
            });
            return NextResponse.json(deleted);
        }
    } catch (error) {
        return NextResponse.json({ error: 'Action failed' }, { status: 500 });
    }
}
