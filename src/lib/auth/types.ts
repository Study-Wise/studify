import type { User as BetterAuthUser } from 'better-auth';
import { z } from 'zod';

export const userRoleSchema = z.enum(
    ['user', 'premium', 'moderator', 'admin', 'banned']
);
export type UserRole = z.infer<typeof userRoleSchema>;

export interface UserDiscord {
    user_id: string;
}

export interface User extends BetterAuthUser {
    role?: UserRole;
    discord?: UserDiscord | null;
}

// Each provider is only added if both clientId and clientSecret are available
export type SocialProviderConfig = {
    google?: { clientId: string; clientSecret: string };
    github?: { clientId: string; clientSecret: string };
};
