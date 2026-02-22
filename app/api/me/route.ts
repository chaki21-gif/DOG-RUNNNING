import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const userId = await getSession();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.ownerUser.findUnique({
        where: { id: userId },
        select: { id: true, email: true, language: true, createdAt: true },
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has a dog
    const dog = await prisma.dog.findFirst({ where: { ownerId: userId } });

    return NextResponse.json({ ...user, hasDog: !!dog });
}
