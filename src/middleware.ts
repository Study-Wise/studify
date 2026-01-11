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

    // Check for session cookie (rewritten from __Secure-neon-auth.session_token for localhost)
    const cookies = request.headers.get('cookie') || '';
    const hasSessionCookie = cookies.includes('neon-auth.session_token');

    // Fetch session data from proxy
    if (hasSessionCookie) {
        try {
            const sessionResponse = await fetch('http://localhost:4321/api/auth/get-session', {
                headers: {
                    'Cookie': cookies,
                },
            });

            if (sessionResponse.ok) {
                const sessionData = await sessionResponse.json();
                if (sessionData && sessionData.user) {
                    locals.user = sessionData.user;
                    locals.session = sessionData.session;
                } else {
                    locals.user = null;
                    locals.session = null;
                }
            } else {
                locals.user = null;
                locals.session = null;
            }
        } catch (error) {
            console.error('Error fetching session:', error);
            locals.user = null;
            locals.session = null;
        }
    } else {
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
