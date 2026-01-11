import { auth } from './lib/auth';
import { getUserRole } from './lib/auth/admin';
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

    // Get session using Better Auth
    const session = await auth.api.getSession({ headers: request.headers });

    if (session) {
        // Ensure role is populated (fetch from DB if not in session)
        if (!session.user.role && session.user.email) {
            const role = await getUserRole(session.user.email);
            session.user.role = role;
        }

        locals.user = session.user;
        locals.session = session.session;
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
