import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const count = await prisma.ownerUser.count();
        return NextResponse.json({
            status: 'success',
            message: 'Database is CONNECTED! 🐾',
            userCount: count,
            envCheck: {
                hasDbUrl: !!process.env.DATABASE_URL,
                dbUrlLength: process.env.DATABASE_URL?.length || 0,
            }
        });
    } catch (err: any) {
        return NextResponse.json({
            status: 'error',
            message: 'Database connection failed 😢',
            details: err.message,
            envCheck: {
                hasDbUrl: !!process.env.DATABASE_URL,
                dbUrlLength: process.env.DATABASE_URL?.length || 0,
            }
        }, { status: 500 });
    }
}
