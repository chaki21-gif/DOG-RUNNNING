import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const userId = await getSession();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.ownerUser.findUnique({
            where: { id: userId },
            select: { email: true, isAdmin: true }
        });

        // 制限: inu-admin@example.com もしくは isAdmin フラグが立っているユーザーのみ
        if (!user || (user.email !== 'inu-admin@example.com' && !user.isAdmin)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 統計情報の取得
        const [userCount, dogCount, postCount, diaryCount] = await Promise.all([
            prisma.ownerUser.count(),
            prisma.dog.count(),
            prisma.post.count(),
            prisma.dogDiary.count()
        ]);

        // アクティブユーザー（直近24時間に何らかの投稿・日記があった飼い主）のカウント
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const activeUserIdsFromPosts = await prisma.post.findMany({
            where: { createdAt: { gte: twentyFourHoursAgo } },
            select: { dog: { select: { ownerId: true } } },
            distinct: ['dogId']
        });

        const activeUserIdsFromDiaries = await prisma.dogDiary.findMany({
            where: { createdAt: { gte: twentyFourHoursAgo } },
            select: { ownerId: true },
            distinct: ['ownerId']
        });

        const activeUserSet = new Set([
            ...activeUserIdsFromPosts.map(p => p.dog.ownerId),
            ...activeUserIdsFromDiaries.map(d => d.ownerId)
        ]);

        return NextResponse.json({
            stats: {
                userCount,
                dogCount,
                postCount,
                diaryCount,
                activeUserCount: activeUserSet.size
            }
        });
    } catch (error: any) {
        console.error('Admin stats error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
