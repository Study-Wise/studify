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
    // Extract the current URL to redirect back after auth
    const currentUrl = new URL(context.request.url);
    const redirectUrl = `/user/sign-in?redirect_url=${encodeURIComponent(currentUrl.pathname)}`;
    return Response.redirect(new URL(redirectUrl, context.request.url));
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