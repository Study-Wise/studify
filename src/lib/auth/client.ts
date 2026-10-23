declare const window: typeof globalThis;
import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient({
    baseURL: resolveBaseURL(),
});
