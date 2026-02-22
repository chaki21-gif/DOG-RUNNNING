import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, verifyPassword, hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { currentPassword, newEmail, newPassword } = body;

        if (!currentPassword) {
            return NextResponse.json({ error: 'Current password required' }, { status: 400 });
        }

        const user = await prisma.ownerUser.findUnique({ where: { id: userId } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Verify current password
        const isValid = await verifyPassword(currentPassword, user.passwordHash);
        if (!isValid) {
            return NextResponse.json({ error: 'Incorrect password' }, { status: 403 });
        }

        const data: any = {};
        if (newEmail && newEmail !== user.email) {
            const existing = await prisma.ownerUser.findUnique({ where: { email: newEmail } });
            if (existing) return NextResponse.json({ error: 'Email already taken' }, { status: 409 });
            data.email = newEmail;
        }
        if (newPassword) {
            data.passwordHash = await hashPassword(newPassword);
        }

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
        }

        await prisma.ownerUser.update({
            where: { id: userId },
            data,
        });

        return NextResponse.json({ message: 'Success' });
    } catch (error) {
        console.error('Account update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
