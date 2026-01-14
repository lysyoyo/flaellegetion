import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Check for the auth cookie
    const authSession = request.cookies.get('auth_session');

    // Define protected paths
    // We want to protect everything EXCEPT public files, next internals, and the login page/api
    const { pathname } = request.nextUrl;

    // Allow: /login
    if (pathname.startsWith('/login')) {
        // If user is already logged in, redirect to /stock
        if (authSession) {
            return NextResponse.redirect(new URL('/stock', request.url));
        }
        return NextResponse.next();
    }

    // Allow: /api (except maybe we want to protect API too? For now, let's protect critical API or assume API is called by frontend which is protected)
    // Actually, protecting APIs is good, but let's stick to protecting PAGES first to avoid API key complexity unless using cookies. 
    // Since we use cookies, we CAN protect API routes too easily.
    // Allow: /api/auth (Login endpoint must be public)
    if (pathname.startsWith('/api/auth')) {
        return NextResponse.next();
    }

    // Allow: Next.js internals and static files
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.includes('.') // Files like favicon.ico, images
    ) {
        return NextResponse.next();
    }

    // Check if authenticated
    if (!authSession) {
        // Redirect to login if not authenticated
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Allow request if authenticated
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (auth routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
    ],
};
