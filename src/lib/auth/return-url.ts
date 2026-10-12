/**
 * Where to send the user after signing in or up. Only same-site paths are allowed,
 * so ?returnBackUrl= can't be used to redirect to another site.
 */
export function getSafeReturnBackUrl(returnBackUrl: string | null | undefined): string {
    if (!returnBackUrl || !returnBackUrl.startsWith('/') || returnBackUrl.startsWith('//') || returnBackUrl.startsWith('/\\')) {
        return '/';
    }

    return returnBackUrl;
}

/** Adds ?returnBackUrl= to an auth page link, so switching between sign-in and sign-up keeps it. */
export function withReturnBackUrl(path: string, returnBackUrl: string): string {
    return returnBackUrl === '/' ? path : `${path}?returnBackUrl=${encodeURIComponent(returnBackUrl)}`;
}
