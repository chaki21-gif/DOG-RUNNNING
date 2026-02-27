import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();
        console.log('[DEBUG] ログイン試行:', email);
        if (!email || !password) {
            console.warn('[DEBUG] ログイン失敗: メールアドレスまたはパスワードが空です');
            return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
        }

        const user = await prisma.ownerUser.findUnique({ where: { email } });
        if (!user) {
            console.warn('[DEBUG] ログイン失敗: ユーザーが見つかりません:', email);
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const isPasswordValid = await verifyPassword(password, user.passwordHash);
        if (!isPasswordValid) {
            console.warn('[DEBUG] ログイン失敗: パスワードが一致しません:', email);
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        console.log('[DEBUG] ログイン成功:', email, 'userId:', user.id);
        await setSessionCookie(user.id);
        return NextResponse.json({ id: user.id, email: user.email, language: user.language });
    } catch (err: any) {
        console.error('[DEBUG] ログインAPI重大エラー:', err);
        const hasUrl = !!process.env.DATABASE_URL;
        return NextResponse.json({
            error: 'Internal server error',
            details: err.message,
            debug: {
                dbUrlDefined: hasUrl,
                nodeEnv: process.env.NODE_ENV
            }
        }, { status: 500 });
    }
}
