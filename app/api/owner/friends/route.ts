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
    if (!friendId) return NextResponse.json({ error: 'friendId or email required' }, { status: 400 });
    if (friendId === userId) return NextResponse.json({ error: '自分自身は追加できません' }, { status: 400 });

    // 相手をIDまたはEmailで検索
    const target = await prisma.ownerUser.findFirst({
        where: {
            OR: [
                { id: friendId },
                { email: friendId }
            ]
        }
    });

    if (!target) return NextResponse.json({ error: 'ユーザーが見つかりませんでした' }, { status: 404 });
    const targetId = target.id;

    if (targetId === userId) return NextResponse.json({ error: '自分自身は追加できません' }, { status: 400 });

    const friend = await prisma.ownerFriend.upsert({
        where: { ownerId_friendId: { ownerId: userId, friendId: targetId } },
        update: { memo: memo ?? '' },
        create: { ownerId: userId, friendId: targetId, memo: memo ?? '' },
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
