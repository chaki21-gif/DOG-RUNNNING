import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                dog: {
                    select: { id: true, name: true, breed: true, iconUrl: true }
                },
                comments: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        dog: {
                            select: { id: true, name: true, breed: true, iconUrl: true }
                        }
                    }
                },
                _count: {
                    select: { likes: true, reposts: true, comments: true }
                }
            },
        });

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        return NextResponse.json(post);
    } catch (error) {
        console.error('Error fetching post:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
