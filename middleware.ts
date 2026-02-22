import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';

// Protected routes that require auth
const protectedRoutes = ['/app', '/diary', '/settings', '/onboarding'];

// System-only mutation routes blocked for owner sessions
const systemOnlyRoutes = ['/api/posts', '/api/likes', '/api/comments', '/api/reposts'];

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Block SNS mutation routes from owner sessions (allow GET)
    if (req.method !== 'GET' && systemOnlyRoutes.some((r) => pathname.startsWith(r))) {
        return NextResponse.json(
            { error: 'This action is performed by your dog autonomously. Owners cannot post directly.' },
            { status: 403 }
        );
    }

    // Auth check for protected pages
    if (protectedRoutes.some((r) => pathname.startsWith(r))) {
        const token = req.cookies.get('session')?.value;
        if (!token) {
            return NextResponse.redirect(new URL('/login', req.url));
        }
        const payload = await verifyJWT(token);
        if (!payload) {
            return NextResponse.redirect(new URL('/login', req.url));
        }
    }

    // Handle locale cookie for API routes that set language
    const response = NextResponse.next();
    return response;
}

export const config = {
    matcher: [
        '/app/:path*',
        '/diary/:path*',
        '/settings/:path*',
        '/onboarding/:path*',
        '/api/posts/:path*',
        '/api/likes/:path*',
        '/api/comments/:path*',
        '/api/reposts/:path*',
    ],
};
