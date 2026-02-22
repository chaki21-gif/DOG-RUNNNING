import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dog = await prisma.dog.findFirst({
        where: { ownerId: userId },
        select: {
            id: true,
            name: true,
            breed: true,
            iconUrl: true,
            birthday: true,
        }
    });

    if (!dog) return NextResponse.json({ error: 'No dog found' }, { status: 404 });
    return NextResponse.json(dog);
}
