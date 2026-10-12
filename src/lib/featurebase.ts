import jwt from 'jsonwebtoken';
import type { User } from '@/lib/auth/types';

// Signing secret from Featurebase: Settings → Access & Security → Security. Server-side only.
const secret = import.meta.env.FEATUREBASE_JWT_SECRET || process.env.FEATUREBASE_JWT_SECRET;

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
