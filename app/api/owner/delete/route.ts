import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, clearSessionCookie } from '@/lib/auth';

export async function DELETE(req: NextRequest) {
    try {
        const userId = await getSession();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // ユーザーを削除（スキーマのonDelete: Cascadeにより、関連データも削除される）
        await prisma.ownerUser.delete({
            where: { id: userId }
        });

        // セッションをクリア
        await clearSessionCookie();

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('Account deletion failed:', error);
        return NextResponse.json({ error: '削除に失敗しました', details: error.message }, { status: 500 });
    }
}
