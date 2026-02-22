import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let setting = await prisma.notificationSetting.findUnique({ where: { ownerId: userId } });
    if (!setting) {
        // デフォルト設定を作成
        setting = await prisma.notificationSetting.create({
            data: { ownerId: userId }
        });
    }
    return NextResponse.json(setting);
}

export async function PATCH(req: NextRequest) {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { notifyLike, notifyComment, notifyFollow, notifyFriend } = body;

    const setting = await prisma.notificationSetting.upsert({
        where: { ownerId: userId },
        update: {
            ...(notifyLike !== undefined && { notifyLike }),
            ...(notifyComment !== undefined && { notifyComment }),
            ...(notifyFollow !== undefined && { notifyFollow }),
            ...(notifyFriend !== undefined && { notifyFriend }),
        },
        create: {
            ownerId: userId,
            notifyLike: notifyLike ?? true,
            notifyComment: notifyComment ?? true,
            notifyFollow: notifyFollow ?? true,
            notifyFriend: notifyFriend ?? true,
        }
    });
    return NextResponse.json(setting);
}
