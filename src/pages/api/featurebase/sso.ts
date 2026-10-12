import type { APIRoute } from 'astro';

import { getFeaturebaseJwt, getFeaturebaseSsoUrl, getSafeFeaturebaseReturnTo } from '@/lib/featurebase';

// Featurebase's "SSO URL" (Settings → Access & Security → Portal Access).
// Featurebase sends logged-out portal visitors here with ?return_to=<portal page>;
// we make sure they're signed in to Studify, then send them back signed in to Featurebase.
export const GET: APIRoute = async ({ url, locals, redirect }) => {
    const returnTo = getSafeFeaturebaseReturnTo(url.searchParams.get('return_to'));

    if (!locals.user) {
        // Sign in to Studify first, then come back here to finish the Featurebase login
        const returnBackUrl = `${url.pathname}?return_to=${encodeURIComponent(returnTo)}`;
        return redirect(`/user/sign-in?returnBackUrl=${encodeURIComponent(returnBackUrl)}`);
    }

    const featurebaseJwt = getFeaturebaseJwt(locals.user);
    if (!featurebaseJwt) {
        console.error('❌ Featurebase SSO requested but FEATUREBASE_JWT_SECRET is not set');
        return new Response('Featurebase sign-in is not configured.', { status: 500 });
    }

    return redirect(getFeaturebaseSsoUrl(featurebaseJwt, returnTo));
};
