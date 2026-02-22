import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    const userId = await getSession();
    if (!userId) {
        return NextResponse.json({ userId: null, isAdmin: false });
    }

    const user = await prisma.ownerUser.findUnique({
        where: { id: userId },
        select: { isAdmin: true }
    });

    return NextResponse.json({
        userId,
        isAdmin: !!user?.isAdmin
    });
}
