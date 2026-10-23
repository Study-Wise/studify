declare const window: typeof globalThis;
import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient({
    baseURL: typeof import.meta !== 'undefined' && import.meta.env?.BETTER_AUTH_URL
        ? import.meta.env.BETTER_AUTH_URL
        : (typeof process !== 'undefined' && typeof process.env !== 'undefined' && process.env.BETTER_AUTH_URL
            ? process.env.BETTER_AUTH_URL
            : (typeof window !== 'undefined' && window.location && window.location.origin
                ? window.location.origin
                : 'http://localhost:4321'))
});
