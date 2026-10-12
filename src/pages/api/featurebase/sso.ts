import type { APIRoute } from 'astro';

import { getFeaturebaseEmbedPath } from '@/lib/featurebase';

// Featurebase's "SSO URL" (Settings → Access & Security → Portal Access).
// Clicking "Log in" in the embedded portal sends the browser here with ?return_to=<portal page>.
// We make sure the user is signed in to Studify, then send them back to that page on /support,
// which logs them in to Featurebase in a hidden frame before showing the portal.
export const GET: APIRoute = async ({ url, locals, redirect }) => {
    const path = getFeaturebaseEmbedPath(url.searchParams.get('return_to'));
    const supportUrl = path === '/' ? '/support' : `/support?path=${encodeURIComponent(path)}`;

    if (!locals.user) {
        return redirect(`/user/sign-in?returnBackUrl=${encodeURIComponent(supportUrl)}`);
    }

    return redirect(supportUrl);
};
