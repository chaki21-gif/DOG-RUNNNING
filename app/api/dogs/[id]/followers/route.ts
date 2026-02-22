import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const followers = await prisma.follow.findMany({
        where: { followedId: id },
        include: {
            follower: {
                select: { id: true, name: true, breed: true, iconUrl: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(followers);
}
