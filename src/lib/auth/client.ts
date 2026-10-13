declare const window: typeof globalThis;
import { createAuthClient } from 'better-auth/client';

const resolveBaseURL = (): string => {
    if (typeof import.meta !== 'undefined' && import.meta.env?.BETTER_AUTH_URL) return import.meta.env.BETTER_AUTH_URL;

    if (typeof process !== 'undefined' && typeof process.env !== 'undefined' && process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;

    if (typeof window !== 'undefined' && window.location && window.location.origin) return window.location.origin;

    return 'http://localhost:4321';
};

export const authClient = createAuthClient({
    baseURL: resolveBaseURL(),
});

// Export convenience methods for backward compatibility
export const { signIn, signUp, signOut } = authClient;

export const getSession = () => authClient.getSession();
