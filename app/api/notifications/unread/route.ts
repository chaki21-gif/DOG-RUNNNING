import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
    const userId = await getSession();
    if (!userId) {
        return NextResponse.json({ count: 0 }, { status: 401 });
    }

    // 通知設定を取得
    const setting = await prisma.notificationSetting.findUnique({
        where: { ownerId: userId }
    });

    // すべての通知がオフならバッジを出さない
    const allOff = setting && !setting.notifyLike && !setting.notifyComment &&
        !setting.notifyFollow && !setting.notifyFriend;
    if (allOff) return NextResponse.json({ count: 0 });

    // 有効な通知タイプのみカウント
    const enabledTypes: string[] = [];
    if (!setting || setting.notifyLike) enabledTypes.push('like');
    if (!setting || setting.notifyComment) enabledTypes.push('comment');
    if (!setting || setting.notifyFollow) enabledTypes.push('follow');
    if (!setting || setting.notifyFriend) enabledTypes.push('friend_request', 'friend_accept');

    const count = await prisma.notification.count({
        where: {
            ownerId: userId,
            readAt: null,
            type: { in: enabledTypes }
        }
    });

    return NextResponse.json({ count });
}

