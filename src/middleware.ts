import { auth } from './lib/auth';
import type { MiddlewareHandler } from 'astro';

// Define protected routes (same as before)
const protectedRoutes = [
    /^\/[^\/]+\/[^\/]+\/chat\/.*/,
    /^\/settings.*/,
    /^\/admin.*/,
    /^\/user\/profile.*/,
    /^\/user\/my-chats.*/,
];

const authRoutes = [
    /^\/user\/sign-in.*/,
    /^\/user\/sign-up.*/,
];

function isProtectedRoute(pathname: string): boolean {
    return protectedRoutes.some(route => route.test(pathname));
}

function isAuthRoute(pathname: string): boolean {
    return authRoutes.some(route => route.test(pathname));
}

export const onRequest: MiddlewareHandler = async (context, next) => {
    const { request, locals, redirect } = context;
    const pathname = new URL(request.url).pathname;

    // Check for session cookie (Neon Auth uses __neon_auth.session_token)
    const cookies = request.headers.get('cookie') || '';
    const hasSessionCookie = cookies.includes('__neon_auth.session_token');

    // Only try to get session if cookie exists
    if (hasSessionCookie) {
        try {
            const session = await auth.getSession({
                headers: request.headers,
            });

            // Attach user and session to locals for downstream access
            if (session && session.user) {
                locals.user = session.user;
                locals.session = session.session;
            } else {
                locals.user = null;
                locals.session = null;
            }
        } catch (error) {
            console.error('Error getting session:', error);
            locals.user = null;
            locals.session = null;
        }
    } else {
        // No session cookie, user is not authenticated
        locals.user = null;
        locals.session = null;
    }

    // Redirect authenticated users away from auth pages
    if (locals.user && isAuthRoute(pathname)) {
        return redirect('/');
    }

    // Protect routes requiring authentication
    if (isProtectedRoute(pathname) && !locals.user) {
        const currentUrl = new URL(request.url);
        const returnBackUrl = currentUrl.pathname + currentUrl.search;
        return redirect(`/user/sign-in?returnBackUrl=${encodeURIComponent(returnBackUrl)}`);
    }

    return next();
};
