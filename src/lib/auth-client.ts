// Client-side Better Auth utilities
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: "http://localhost:4321",
});

// Export convenience methods for backward compatibility
export const { signIn, signUp, signOut } = authClient;

// Export getSession for direct session access
export const getSession = () => authClient.getSession();
