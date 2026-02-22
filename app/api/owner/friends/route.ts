import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const friends = await prisma.ownerFriend.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: 'desc' },
        include: {
            friend: {
                select: {
                    id: true,
                    email: true,
                    dogs: { select: { id: true, name: true, breed: true, iconUrl: true } }
                }
            }
        }
    });
    return NextResponse.json(friends);
}

export async function POST(req: NextRequest) {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { friendId, memo } = await req.json();
    if (!friendId) return NextResponse.json({ error: 'friendId required' }, { status: 400 });
    if (friendId === userId) return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 });

    // 相手が存在するか確認
    const target = await prisma.ownerUser.findUnique({ where: { id: friendId } });
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const friend = await prisma.ownerFriend.upsert({
        where: { ownerId_friendId: { ownerId: userId, friendId } },
        update: { memo: memo ?? '' },
        create: { ownerId: userId, friendId, memo: memo ?? '' },
        include: {
            friend: {
                select: {
                    id: true,
                    email: true,
                    dogs: { select: { id: true, name: true, breed: true, iconUrl: true } }
                }
            }
        }
    });
    return NextResponse.json(friend);
}

export async function DELETE(req: NextRequest) {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { friendId } = await req.json();
    await prisma.ownerFriend.deleteMany({ where: { ownerId: userId, friendId } });
    return NextResponse.json({ ok: true });
}
