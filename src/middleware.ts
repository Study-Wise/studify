import type { MiddlewareHandler } from 'astro';

import { auth } from '@/lib/auth';
import { getUserRole } from '@/lib/auth/admin';
import { isDev, getDevUser } from '@/lib/auth/dev';
import type { User } from '@/lib/auth/types';

// Define protected routes (same as before)
const protectedRoutes = [
    /^\/[^/]+\/[^/]+\/chat\/.*/,
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

    // Handle HEAD requests early to avoid rendering issues
    // HEAD requests should return 200 OK without body
    if (request.method === 'HEAD') {
        return new Response(null, {
            status: 200,
            headers: {
                'Content-Type': 'text/html',
            },
        });
    }

    // Get session using Better Auth
    const session = await auth.api.getSession({ headers: request.headers });

    if (session) {
        // Cast to User to include role field
        const user: User = session.user;

        // Ensure role is populated (fetch from DB if not in session)
        if (!user.role && user.email) {
            const role = await getUserRole(user.email);
            user.role = role;
        }

        // Check if user is banned
        if (user.role === 'banned') {
            return new Response(`Access Denied: Your account has been ${user.role}.`, { status: 403 });
        }

        locals.user = user;
        locals.session = session.session;
    }
    else if (isDev()) {
        // In dev mode, try to authenticate using USER_ACCESS_TOKEN
        const devUser = await getDevUser();
        if (devUser) {
            locals.user = devUser;
            locals.session = null; // No actual session, but user is authenticated via token
        }
        else {
            locals.user = null;
            locals.session = null;
        }
    }
    else {
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
