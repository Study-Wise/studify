import { createAuthClient } from '@neondatabase/neon-js/auth';

// Create the Neon Auth client for client-side use
export const authClient = createAuthClient(import.meta.env.PUBLIC_NEON_AUTH_URL);

// Export auth methods for convenience
export const {
    signIn,
    signUp,
    signOut,
    getSession,
} = authClient;
