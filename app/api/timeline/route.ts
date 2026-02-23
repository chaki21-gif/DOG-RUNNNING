import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        console.log('[DEBUG] タイムラインGETリクエスト受信');
        let userId = await Promise.race([
            getSession(),
            new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Session timeout')), 10000))
        ]).catch(e => {
            console.error('[DEBUG] セッション取得エラー:', e);
            return null;
        });

        if (!userId) {
            console.warn('[DEBUG] 認証エラー: 投稿を表示するにはログインが必要です');
            return NextResponse.json({ posts: [], error: 'Session required' }, { status: 401 });
        }

        const url = new URL(req.url);
        const cursor = url.searchParams.get('cursor');
        const type = url.searchParams.get('type') ?? 'all'; // 'following' | 'recommended' | 'all'
        const limit = 20;

        // 自分の犬を取得
        const myDog = await prisma.dog.findFirst({ where: { owner: { id: userId } }, select: { id: true } });

        let posts;

        if (type === 'following' && myDog) {
            // フォロー中の犬の投稿のみ
            const following = await prisma.follow.findMany({
                where: { followerId: myDog.id },
                select: { followedId: true }
            });
            const followedIds = following.map(f => f.followedId);

            posts = await prisma.post.findMany({
                take: limit,
                ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
                where: followedIds.length > 0 ? { dogId: { in: followedIds } } : { id: 'none' },
                orderBy: { createdAt: 'desc' },
                include: {
                    dog: {
                        select: {
                            id: true,
                            name: true,
                            breed: true,
                            iconUrl: true,
                            persona: { select: { toneStyle: true } }
                        }
                    },
                    _count: { select: { likes: true, comments: true, reposts: true } },
                },
            });
        } else if (type === 'recommended' && myDog) {
            // 自分がフォローしていない犬の投稿（おすすめ）
            const following = await prisma.follow.findMany({
                where: { followerId: myDog.id },
                select: { followedId: true }
            });
            const followedIds = [...following.map(f => f.followedId), myDog.id];

            posts = await prisma.post.findMany({
                take: limit,
                ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
                where: { dogId: { notIn: followedIds } },
                orderBy: { createdAt: 'desc' },
                include: {
                    dog: {
                        select: {
                            id: true,
                            name: true,
                            breed: true,
                            iconUrl: true,
                            persona: { select: { toneStyle: true } }
                        }
                    },
                    _count: { select: { likes: true, comments: true, reposts: true } },
                },
            });
        } else {
            // デフォルト：全投稿
            posts = await prisma.post.findMany({
                take: limit,
                ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
                orderBy: { createdAt: 'desc' },
                include: {
                    dog: {
                        select: {
                            id: true,
                            name: true,
                            breed: true,
                            iconUrl: true,
                            persona: { select: { toneStyle: true } }
                        }
                    },
                    _count: { select: { likes: true, comments: true, reposts: true } },
                },
            });
        }

        const nextCursor = posts.length === limit ? posts[posts.length - 1].id : null;
        console.log('[DEBUG] レスポンス送信準備完了: 投稿数', posts.length);

        return NextResponse.json({ posts, nextCursor });
    } catch (error: any) {
        console.error('[DEBUG] タイムラインAPI重大エラー:', {
            message: error.message,
            stack: error.stack,
            cause: error.cause
        });
        return NextResponse.json({
            posts: [],
            error: 'タイムラインの取得に失敗しました',
            details: error.message
        }, { status: 500 });
    }
}

