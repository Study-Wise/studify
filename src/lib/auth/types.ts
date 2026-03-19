import { z } from 'zod';
import { pgEnum } from 'drizzle-orm/pg-core';

// User role schema and enum
export const userRoleSchema = z.enum(["user", "premium", "moderator", "admin", "banned"]);
export const userRoleEnum = pgEnum("user_role", userRoleSchema.options);
export type UserRole = z.infer<typeof userRoleSchema>;
