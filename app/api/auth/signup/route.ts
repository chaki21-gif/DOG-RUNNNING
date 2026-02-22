import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();
        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
        }

        const existing = await prisma.ownerUser.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
        }

        const passwordHash = await hashPassword(password);
        const user = await prisma.ownerUser.create({
            data: { email, passwordHash },
        });

        return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
