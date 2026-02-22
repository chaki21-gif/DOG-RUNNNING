import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'dog-sns-jwt-secret-change-in-production'
);

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export async function createJWT(userId: string): Promise<string> {
    return new SignJWT({ sub: userId })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<{ sub: string } | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as { sub: string };
    } catch {
        return null;
    }
}

export async function getSession(): Promise<string | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return null;
    const payload = await verifyJWT(token);
    return payload?.sub || null;
}

export async function setSessionCookie(userId: string): Promise<void> {
    const token = await createJWT(userId);
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
    });
}

export async function clearSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete('session');
}
