// Placeholder origin used only to check where a relative URL resolves
const SAME_SITE_ORIGIN = 'https://same-site.invalid';

/**
 * Where to send the user after signing in or up. Only same-site paths are allowed,
 * so ?returnBackUrl= can't be used to redirect to another site.
 *
 * The value is resolved with the same URL parser browsers use, so tricks that only show up
 * after parsing (tabs/newlines being stripped, backslashes acting as slashes, `//host`, dot segments
 * collapsing to `//host`) are caught. The normalized path is returned, never the raw input.
 */
export function getSafeReturnBackUrl(returnBackUrl: string | null | undefined): string {
    if (!returnBackUrl || !returnBackUrl.startsWith('/')) return '/';

    try {
        const url = new URL(returnBackUrl, SAME_SITE_ORIGIN);
        if (url.origin !== SAME_SITE_ORIGIN) return '/';

        // Check what we actually return too: dot segments can normalize to a protocol-relative
        // path (/.//evil.com → //evil.com) that would leave the site.
        const normalized = `${url.pathname}${url.search}${url.hash}`;
        if (new URL(normalized, SAME_SITE_ORIGIN).origin !== SAME_SITE_ORIGIN) return '/';

        return normalized;
    } catch {
        return '/';
    }
}

/** Adds ?returnBackUrl= to an auth page link, so switching between sign-in and sign-up keeps it. */
export function withReturnBackUrl(path: string, returnBackUrl: string): string {
    return returnBackUrl === '/' ? path : `${path}?returnBackUrl=${encodeURIComponent(returnBackUrl)}`;
}
