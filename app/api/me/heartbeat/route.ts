import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
    const userId = await getSession();
    if (!userId) {
        return NextResponse.json({ ok: false }, { status: 401 });
    }

    try {
        await (prisma.ownerUser as any).update({
            where: { id: userId },
            data: { lastActiveAt: new Date() }
        });
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('[Heartbeat Error]:', error.message);
        return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
    }
}
