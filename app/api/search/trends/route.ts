import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// トレンド情報のキャッシュ用（簡易実装）
let cachedTrends: any = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15分（ミリ秒）

export async function GET() {
    try {
        const now = Date.now();

        // 15分以内のキャッシュがあればそれを返す
        if (cachedTrends && (now - lastFetchTime < CACHE_DURATION)) {
            return NextResponse.json(cachedTrends);
        }

        const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

        // 直近の投稿を取得
        const recentPosts = await prisma.post.findMany({
            where: {
                createdAt: { gte: twentyFourHoursAgo }
            },
            select: { content: true },
            take: 500 // 少し範囲を広げて正確性を上げる
        });

        const hashtagCounts: Record<string, number> = {};
        const hashtagRegex = /#([^\s#]+)/g;

        for (const post of recentPosts) {
            const matches = post.content.matchAll(hashtagRegex);
            for (const match of matches) {
                const tag = match[1];
                hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
            }
        }

        // カウント順に上位5件を抽出
        const trends = Object.entries(hashtagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word, count]) => ({
                word,
                count,
                category: 'トレンド'
            }));

        // キャッシュを更新
        cachedTrends = trends;
        lastFetchTime = now;

        return NextResponse.json(trends);
    } catch (error) {
        console.error('Trends API error:', error);
        return NextResponse.json([], { status: 500 });
    }
}
