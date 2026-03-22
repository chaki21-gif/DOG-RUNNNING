import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = body;

        console.log('[DEBUG] ログイン試行:', email);
        if (!email || !password) {
            console.warn('[DEBUG] ログイン失敗: メールアドレスまたはパスワードが空です');
            return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
        }

        // Test DB connection with a simple count to see if the database is reachable
        try {
            await prisma.$connect();
        } catch (dbErr: any) {
            console.error('[DEBUG] データベース接続エラー:', dbErr);
            return NextResponse.json({
                error: 'Database connection failed',
                details: dbErr.message,
                code: dbErr.code
            }, { status: 503 });
        }

        const user = await prisma.ownerUser.findUnique({ where: { email } });
        if (!user) {
            console.warn('[DEBUG] ログイン失敗: ユーザーが見てかりません:', email);
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        const isPasswordValid = await verifyPassword(password, user.passwordHash);
        if (!isPasswordValid) {
            console.warn('[DEBUG] ログイン失敗: パスワードが一致しません:', email);
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        console.log('[DEBUG] ログイン成功:', email, 'userId:', user.id);
        await setSessionCookie(user.id);
        return NextResponse.json({
            id: user.id,
            email: user.email,
            language: user.language || 'ja',
            message: 'Login successful'
        });
    } catch (err: any) {
        console.error('[DEBUG] ログインAPI重大エラー:', err);
        return NextResponse.json({
            error: 'Internal server error',
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }, { status: 500 });
    }
}
