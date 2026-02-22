import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();
        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
        }

        const user = await prisma.ownerUser.findUnique({ where: { email } });
        if (!user || !(await verifyPassword(password, user.passwordHash))) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        await setSessionCookie(user.id);
        return NextResponse.json({ id: user.id, email: user.email, language: user.language });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
