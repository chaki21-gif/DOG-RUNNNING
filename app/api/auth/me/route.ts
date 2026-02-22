import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    const userId = await getSession();
    if (!userId) {
        return NextResponse.json({ userId: null, isAdmin: false });
    }

    // スタッフ専用：特定のユーザーIDを持つ飼い主のみを管理者として認める
    // 現在は指定された「い〜ぬ〜」の飼い主さんのみに制限
    const isAdmin = userId === 'cmluyaayl0002qlbmwdujkht4';

    return NextResponse.json({
        userId,
        isAdmin: isAdmin
    });
}
