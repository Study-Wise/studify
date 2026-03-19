import { pgEnum } from 'drizzle-orm/pg-core';
import type { User as BetterAuthUser } from 'better-auth';
import { z } from 'zod';

// User role schema and enum
export const userRoleSchema = z.enum(["user", "premium", "moderator", "admin", "banned"]);
export const userRoleEnum = pgEnum("user_role", userRoleSchema.options);
export type UserRole = z.infer<typeof userRoleSchema>;

// Better Auth's User type with our custom role field
export interface User extends BetterAuthUser {
    role?: UserRole;
}

export interface AuthUtils {
    showError: (message: string) => void;
    hideError: () => void;
    getRedirectUrl: () => void;
    callbackURL: string;
}

// Build social providers configuration
// Each provider is only added if both clientId and clientSecret are available
export type SocialProviderConfig = {
    google?: { clientId: string; clientSecret: string };
    github?: { clientId: string; clientSecret: string };
};
