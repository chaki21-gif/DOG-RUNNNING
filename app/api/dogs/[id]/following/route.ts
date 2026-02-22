import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const following = await prisma.follow.findMany({
        where: { followerId: id },
        include: {
            followed: {
                select: { id: true, name: true, breed: true, iconUrl: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(following);
}
