import type { APIRoute } from 'astro';

import { getFeaturebaseEmbedPath } from '@/lib/featurebase';

// Featurebase's "SSO URL" (Settings → Access & Security → Portal Access).
// Featurebase sends logged-out portal visitors here with ?return_to=<portal page>.
// Instead of finishing the login on Featurebase's hosted portal, we keep users in Studify:
// sign them in here, then open that page in the embedded portal on /support,
// which identifies them with the JWT from src/components/Featurebase.astro.
export const GET: APIRoute = async ({ url, locals, redirect }) => {
    const path = getFeaturebaseEmbedPath(url.searchParams.get('return_to'));
    const supportUrl = path === '/' ? '/support' : `/support?path=${encodeURIComponent(path)}`;

    if (!locals.user) {
        return redirect(`/user/sign-in?returnBackUrl=${encodeURIComponent(supportUrl)}`);
    }

    return redirect(supportUrl);
};
