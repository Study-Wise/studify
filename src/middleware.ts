import { auth } from '@/lib/auth';
import { SENTRY_TUNNEL_PATH } from '@/lib/sentry';
import { getUserRole } from '@/lib/auth/admin';
import { isDev, getDevUser } from '@/lib/auth/dev';
import { getUserDiscord } from '@/lib/auth/discord';
import { getSafeReturnBackUrl } from '@/lib/auth/return-url';
import { getContentTypesList } from '@/lib/content/get-types';

import type { MiddlewareHandler } from 'astro';

const protectedRoutes = [
    /^\/[^/]+\/[^/]+\/chat\/.*/,
    // Material pages require sign-in even for public threads, like the chat page (#342).
    // Signed-in non-owners still get the read-only public view via checkThreadAccess.
    new RegExp(`^/[^/]+/[^/]+/(${getContentTypesList().filter(type => type !== 'index').join('|')})/.*`),
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
    if (context.request.method === 'HEAD') {
        return new Response(null, {
            status: 200,
            headers: {
                'Content-Type': 'text/html',
            },
        });
    }

    // Error reports don't need a session, and must still go through when the database is down
    if (context.url.pathname === SENTRY_TUNNEL_PATH) {
        context.locals.user = null;
        context.locals.session = null;
        return next();
    }

    context.locals.user = null;
    context.locals.session = null;

    const { user, session } = (await auth.api.getSession({ headers: context.request.headers })) || { user: null, session: null };
    if (user && session) {
        context.locals.user = user;
        context.locals.session = session;

        if (!context.locals.user.role && user.email) context.locals.user.role = await getUserRole(user.email);

        if (context.locals.user.role === 'banned') return new Response(`Access Denied: Your account has been ${context.locals.user.role}.`, { status: 403 });

        if (context.locals.user.discord === undefined && context.locals.user.email) context.locals.user.discord = await getUserDiscord(context.locals.user.email);
    }
    else if (isDev()) {
        // In dev mode, try to authenticate using USER_ACCESS_TOKEN
        const devUser = await getDevUser();
        context.locals.session = null; // No actual session, but user is authenticated via token
        if (devUser) context.locals.user = devUser;
    }

    if (context.locals.user && authRoutes.some(route => route.test(context.url.pathname))) return context.redirect(getSafeReturnBackUrl(context.url.searchParams.get('returnBackUrl')));

    if (protectedRoutes.some(route => route.test(context.url.pathname)) && !context.locals.user) return context.redirect(`/user/sign-in?returnBackUrl=${encodeURIComponent(context.url.pathname + context.url.search)}`);

    return next();
};
