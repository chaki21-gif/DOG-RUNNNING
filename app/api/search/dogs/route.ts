import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const q = url.searchParams.get('q')?.trim() ?? '';

    if (q.length < 1) return NextResponse.json([]);

    if (q.startsWith('#')) {
        // ハッシュタグ・投稿検索
        const posts = await prisma.post.findMany({
            where: {
                content: { contains: q.slice(1) } // #を除いて検索
            },
            take: 20,
            include: {
                dog: {
                    select: { id: true, name: true, breed: true, iconUrl: true }
                },
                _count: { select: { likes: true, comments: true, reposts: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // フロントエンドに「投稿」であることを伝えるフラグを付けるか、
        // 共通の型にマッピングする。ここでは簡易的にマッピング。
        return NextResponse.json(posts.map(p => ({
            id: p.id,
            isPost: true,
            content: p.content,
            dog: p.dog,
            createdAt: p.createdAt,
            _count: p._count
        })));
    }

    const dogs = await prisma.dog.findMany({
        where: {
            OR: [
                { name: { contains: q } },
                { breed: { contains: q } },
            ]
        },
        take: 20,
        select: {
            id: true,
            name: true,
            breed: true,
            iconUrl: true,
            location: true,
            _count: { select: { followers: true, posts: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(dogs);
}
