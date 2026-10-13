import type { MiddlewareHandler } from 'astro';

import { auth } from '@/lib/auth';
import { getUserRole } from '@/lib/auth/admin';
import { isDev, getDevUser } from '@/lib/auth/dev';
import type { User } from '@/lib/auth/types';
import { getSafeReturnBackUrl } from '@/lib/auth/return-url';
import { getContentTypesList } from '@/lib/content/get-types';
import { SENTRY_TUNNEL_PATH } from '@/lib/sentry';

// Material pages (study guide, flashcards, ...) live at /[category]/[mode]/[content-type]/[id]
const materialRouteSegments = getContentTypesList().filter(type => type !== 'index');

// Define protected routes
const protectedRoutes = [
    /^\/[^/]+\/[^/]+\/chat\/.*/,
    // Material pages require sign-in even for public threads, like the chat page (#342).
    // Signed-in non-owners still get the read-only public view via checkThreadAccess.
    new RegExp(`^/[^/]+/[^/]+/(${materialRouteSegments.join('|')})/.*`),
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

    // Error reports don't need a session, and must still go through when the database is down
    if (pathname === SENTRY_TUNNEL_PATH) {
        locals.user = null;
        locals.session = null;
        return next();
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

    // Redirect authenticated users away from auth pages, to where they were headed
    if (locals.user && isAuthRoute(pathname)) {
        return redirect(getSafeReturnBackUrl(new URL(request.url).searchParams.get('returnBackUrl')));
    }

    // Protect routes requiring authentication
    if (isProtectedRoute(pathname) && !locals.user) {
        const currentUrl = new URL(request.url);
        const returnBackUrl = currentUrl.pathname + currentUrl.search;
        return redirect(`/user/sign-in?returnBackUrl=${encodeURIComponent(returnBackUrl)}`);
    }

    return next();
};
