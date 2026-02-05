// Client-side Better Auth utilities
import { createAuthClient } from "better-auth/client";

const resolveBaseURL = (): string => {
    if (typeof import.meta !== "undefined" && import.meta.env?.BETTER_AUTH_URL) {
        return import.meta.env.BETTER_AUTH_URL;
    }

    if (typeof process !== "undefined" && typeof process.env !== "undefined" && process.env.BETTER_AUTH_URL) {
        return process.env.BETTER_AUTH_URL;
    }

    if (typeof window !== "undefined" && window.location && window.location.origin) {
        return window.location.origin;
    }

    // Fallback to localhost for development environments
    return "http://localhost:4321";
};

const baseURL = resolveBaseURL();

export const authClient = createAuthClient({
    baseURL,
});

// Export convenience methods for backward compatibility
export const { signIn, signUp, signOut } = authClient;

// Export getSession for direct session access
export const getSession = () => authClient.getSession();
