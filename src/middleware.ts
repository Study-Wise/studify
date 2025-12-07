import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';

// Define protected routes
const isProtectedRoute = createRouteMatcher(['/[category]/[mode]/chat(.*)', '/settings(.*)', '/admin(.*)']);
const isMFARoute = createRouteMatcher(['/account/manage-mfa(.*)']);
const isSignInRoute = createRouteMatcher(['/user/sign-in(.*)', '/user/sign-up(.*)']);

export const onRequest = clerkMiddleware((auth, context) => {
    const { userId, sessionClaims, redirectToSignIn } = auth();

    // Redirect signed-in users away from auth pages
    if (userId && isSignInRoute(context.request)) {
    return Response.redirect(new URL('/', context.request.url));
    }

    // Protect routes that require authentication
    if (isProtectedRoute(context.request) && !userId) {
    const currentUrl = new URL(context.request.url);
    return redirectToSignIn({ returnBackUrl: currentUrl.pathname + currentUrl.search });
    }

    // Optional: Enforce MFA for protected routes
    // Uncomment the following code to require MFA
    /*
    if (userId && isProtectedRoute(context.request) && !isMFARoute(context.request)) {
    if (sessionClaims?.isMfa === false) {
            return Response.redirect(new URL('/account/manage-mfa/add', context.request.url));
    }
    }
    */
});