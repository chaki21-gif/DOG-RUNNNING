import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // 直近の投稿を取得
        const recentPosts = await prisma.post.findMany({
            where: {
                createdAt: { gte: twentyFourHoursAgo }
            },
            select: { content: true },
            take: 200 // 負荷軽減のため上限設定
        });

        const hashtagCounts: Record<string, number> = {};

        // ハッシュタグの抽出 (#に続く、スペースや改行、別の#までの文字列)
        const hashtagRegex = /#([^\s#]+)/g;

        for (const post of recentPosts) {
            const matches = post.content.matchAll(hashtagRegex);
            for (const match of matches) {
                const tag = match[1];
                hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
            }
        }

        // カウント順にソートして上位5件を返す
        const trends = Object.entries(hashtagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word, count]) => ({
                word,
                count,
                category: 'トレンド'
            }));

        return NextResponse.json(trends);
    } catch (error) {
        console.error('Trends API error:', error);
        return NextResponse.json([], { status: 500 });
    }
}
