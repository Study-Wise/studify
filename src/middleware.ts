import { auth } from '@/lib/auth';
import { SENTRY_TUNNEL_PATH } from '@/lib/sentry';
import { getUserRole } from '@/lib/auth/admin';
import { isDev, getDevUser } from '@/lib/auth/dev';
import { getSafeReturnBackUrl } from '@/lib/auth/return-url';
import type { User } from '@/lib/auth/types';
import { getContentTypesList } from '@/lib/content/get-types';

import type { MiddlewareHandler } from 'astro';

// Material pages (study guide, flashcards, ...) live at /[category]/[mode]/[content-type]/[id]
const materialRouteSegments = getContentTypesList().filter(type => type !== 'index');

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

export const onRequest: MiddlewareHandler = async function onRequest(context, next) {
    const { request, locals, redirect } = context;
    const pathname = new URL(request.url).pathname;

    // Handle HEAD requests early to avoid rendering issues
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

    const session = await auth.api.getSession({ headers: request.headers });

    if (session) {
        const user: User = session.user;

        // Ensure role is populated (fetch from DB if not in session)
        if (!user.role && user.email) {
            const role = await getUserRole(user.email);
            user.role = role;
        }

        if (user.role === 'banned') {
            return new Response(`Access Denied: Your account has been ${user.role}.`, { status: 403 });
        }

        locals.user = session.user;
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
    if (locals.user && authRoutes.some(route => route.test(pathname))) {
        return redirect(getSafeReturnBackUrl(new URL(request.url).searchParams.get('returnBackUrl')));
    }

    // Protect routes requiring authentication
    if (protectedRoutes.some(route => route.test(pathname)) && !locals.user) {
        const currentUrl = new URL(request.url);
        return redirect(`/user/sign-in?returnBackUrl=${encodeURIComponent(currentUrl.pathname + currentUrl.search)}`);
    }

    return next();
};
