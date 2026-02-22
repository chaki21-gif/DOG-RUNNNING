import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
    const userId = await getSession();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーの最初の犬を取得（MVPでは1ユーザー1犬を想定）
    const dog = await prisma.dog.findFirst({
        where: { ownerId: userId },
        select: { id: true }
    });

    if (!dog) return NextResponse.json([]);

    // 通知履歴からインタラクションの多い犬を抽出
    // 本来はLikeやCommentテーブルを直接集計する方が正確だが、
    // パフォーマンスと実装の簡純化のため、過去100件の通知から集計
    const notifications = await prisma.notification.findMany({
        where: { ownerId: userId },
        take: 100,
        include: {
            fromDog: {
                select: { id: true, name: true, breed: true, iconUrl: true }
            }
        }
    });

    const counts: Record<string, { dog: any, score: number }> = {};

    notifications.forEach(n => {
        if (!n.fromDog) return;
        if (!counts[n.fromDog.id]) {
            counts[n.fromDog.id] = { dog: n.fromDog, score: 0 };
        }
        // スコア付け: コメントは3点、いいね/リポストは1点
        const weight = n.type === 'comment' ? 3 : 1;
        counts[n.fromDog.id].score += weight;
    });

    const affinityList = Object.values(counts)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // 上位5件

    return NextResponse.json(affinityList);
}
