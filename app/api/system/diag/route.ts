import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const userId = await getSession();
        const dogCount = await prisma.dog.count();
        const postCount = await prisma.post.count();
        const myDog = userId ? await prisma.dog.findFirst({ where: { ownerId: userId } }) : null;

        return NextResponse.json({
            status: 'ok',
            userId,
            dogCount,
            postCount,
            myDog: myDog ? { id: myDog.id, name: myDog.name } : null,
            env: {
                nodeEnv: process.env.NODE_ENV,
                hasDbUrl: !!process.env.DATABASE_URL,
            }
        });
    } catch (err: any) {
        return NextResponse.json({
            status: 'error',
            message: err.message,
            stack: err.stack
        }, { status: 500 });
    }
}
