import type { APIRoute } from 'astro';

import { getFeaturebaseEmbedPath, getFeaturebaseJwt, getFeaturebaseLoginUrl } from '@/lib/featurebase';

// Featurebase's "SSO URL" (Settings → Access & Security → Portal Access).
// Clicking "Log in" in the embedded portal sends the browser here with ?return_to=<portal page>.
// 1. Make sure the user is signed in to Studify (sign-in returns here afterwards).
// 2. Log them in to Featurebase through its login link,
// 3. which sends them back to that page in the embedded portal on /support, now logged in.
export const GET: APIRoute = async ({ url, locals, redirect }) => {
    const path = getFeaturebaseEmbedPath(url.searchParams.get('return_to'));
    const supportUrl = path === '/' ? '/support' : `/support?path=${encodeURIComponent(path)}`;

    if (!locals.user) {
        return redirect(`/user/sign-in?returnBackUrl=${encodeURIComponent(`${url.pathname}${url.search}`)}`);
    }

    const featurebaseJwt = getFeaturebaseJwt(locals.user);
    if (!featurebaseJwt) {
        console.error('❌ Featurebase login requested but FEATUREBASE_JWT_SECRET is not set');
        return redirect(supportUrl);
    }

    return redirect(getFeaturebaseLoginUrl(featurebaseJwt, new URL(supportUrl, url.origin).toString()));
};
