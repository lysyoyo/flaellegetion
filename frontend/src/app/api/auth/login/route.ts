import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        // Hardcoded credentials as requested
        const VALID_USER = process.env.ADMIN_USER || 'Nodia2026';
        const VALID_PASS = process.env.ADMIN_PASSWORD || 'Flaellenodia2026';

        if (username === VALID_USER && password === VALID_PASS) {
            // Create response
            const response = NextResponse.json({ success: true });

            // Set a simple auth cookie
            // In a real app we would use a signed JWT, but for this simple request a secret value works
            response.cookies.set('auth_session', 'valid_session_token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7, // 1 week
                path: '/',
            });

            return response;
        }

        return NextResponse.json(
            { success: false, message: 'Identifiants incorrects' },
            { status: 401 }
        );
    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Internal Error' },
            { status: 500 }
        );
    }
}
