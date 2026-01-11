// Server-side Neon Auth utilities
import { createAuthClient } from '@neondatabase/neon-js/auth';

// Server-side auth client
// Note: For server-side, we'll use the PUBLIC_NEON_AUTH_URL from process.env
export const auth = createAuthClient(process.env.PUBLIC_NEON_AUTH_URL!);
