import jwt from 'jsonwebtoken';
import type { User } from '@/lib/auth/types';

// Signing secret from Featurebase: Settings → Access & Security → Security. Server-side only.
const secret = import.meta.env.FEATUREBASE_JWT_SECRET || process.env.FEATUREBASE_JWT_SECRET;

// Domain the Featurebase portal is served from
const FEATUREBASE_PORTAL_HOST = 'support.studywise.adarshrkumar.app';

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
 * Turns the portal page Featurebase wants to return to (e.g. https://support.studywise.adarshrkumar.app/p/some-post)
 * into a path for the embedded portal on /support (e.g. /p/some-post). Falls back to the portal home.
 */
export function getFeaturebaseEmbedPath(returnTo: string | null): string {
    if (returnTo) {
        try {
            const url = new URL(returnTo);
            if (url.hostname === FEATUREBASE_PORTAL_HOST) {
                return `${url.pathname}${url.search}`;
            }
        } catch {
            // Not a valid URL; use the fallback
        }
    }

    return '/';
}
