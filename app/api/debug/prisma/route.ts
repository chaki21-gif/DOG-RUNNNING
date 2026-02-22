import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    return NextResponse.json({
        models: Object.keys(prisma),
        env: process.env.NODE_ENV,
    });
}
