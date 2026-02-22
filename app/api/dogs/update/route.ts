import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
    const userId = await getSession();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { iconUrl } = body;

        const dog = await prisma.dog.findFirst({
            where: { ownerId: userId }
        });

        if (!dog) {
            return NextResponse.json({ error: 'Dog not found' }, { status: 404 });
        }

        const updatedDog = await prisma.dog.update({
            where: { id: dog.id },
            data: {
                iconUrl: iconUrl || null
            }
        });

        return NextResponse.json(updatedDog);
    } catch (error: any) {
        console.error('[API] Dog update error:', error);
        return NextResponse.json({ error: 'Failed to update dog profile' }, { status: 500 });
    }
}
