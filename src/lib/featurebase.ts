import jwt from 'jsonwebtoken';
import type { User } from '@/lib/auth/types';

// Signing secret from Featurebase: Settings → Access & Security → Security. Server-side only.
const secret = import.meta.env.FEATUREBASE_JWT_SECRET || process.env.FEATUREBASE_JWT_SECRET;

// The workspace's hosted portal, where SSO logins are completed
export const FEATUREBASE_PORTAL_URL = 'https://studify1.featurebase.app';

/**
 * Signs a Featurebase identity JWT for a signed-in user.
 * Returns undefined when there is no user or no secret, so visitors stay anonymous.
 * See https://help.featurebase.app/articles/5257986-creating-and-signing-a-jwt
 */
export function getFeaturebaseJwt(user: User | null): string | undefined {
    if (!user || !secret) return undefined;

    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            name: user.name,
            ...(user.image ? { profilePicture: user.image } : {}),
        },
        secret,
        { algorithm: 'HS256' }
    );
}

/**
 * Only lets SSO send users back to a Featurebase-hosted page, so the endpoint can't be used as an open redirect.
 * Falls back to the portal home.
 */
export function getSafeFeaturebaseReturnTo(returnTo: string | null): string {
    if (returnTo) {
        try {
            const url = new URL(returnTo);
            if (url.protocol === 'https:' && (url.hostname === 'featurebase.app' || url.hostname.endsWith('.featurebase.app'))) {
                return url.toString();
            }
        } catch {
            // Not a valid URL; use the fallback
        }
    }

    return FEATUREBASE_PORTAL_URL;
}

/**
 * URL that signs the user in to the Featurebase portal and sends them on to returnTo.
 * See https://help.featurebase.app/articles/0874531-web-portal-single-sign-on-sso-setup
 */
export function getFeaturebaseSsoUrl(featurebaseJwt: string, returnTo: string): string {
    const url = new URL('/api/v1/auth/access/jwt', FEATUREBASE_PORTAL_URL);
    url.searchParams.set('jwt', featurebaseJwt);
    url.searchParams.set('return_to', returnTo);
    return url.toString();
}
