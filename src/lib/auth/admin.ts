// Admin role management for Better Auth
// Roles are stored in the database and auto-promoted based on email/domain

import { eq } from 'drizzle-orm';
import { db } from '@/db/initialize';
import { user as userTable } from '@/db/auth-schema';

import type { UserRole } from './types';

// Get user role from database by email
export async function getUserRole(email: string): Promise<UserRole> {
    const users = await db
        .select({ role: userTable.role })
        .from(userTable)
        .where(eq(userTable.email, email))
        .limit(1);

    return users[0]?.role || "user";
}

// Get user role from database by user ID
export async function getUserRoleById(userId: string): Promise<UserRole> {
    const users = await db
        .select({ role: userTable.role })
        .from(userTable)
        .where(eq(userTable.id, userId))
        .limit(1);

    return users[0]?.role || "user";
}

// Check if a user is an admin based on their email
export async function isUserAdmin(email: string): Promise<boolean> {
    const role = await getUserRole(email);
    return role === "admin";
}

// Check if a user is an admin based on their ID
export async function isUserAdminById(userId: string): Promise<boolean> {
    const role = await getUserRoleById(userId);
    return role === "admin";
}

// Check if a user is a moderator or admin
export async function isUserModerator(email: string): Promise<boolean> {
    const role = await getUserRole(email);
    return role === "moderator" || role === "admin";
}

// Check if a user has premium access
export async function isUserPremium(email: string): Promise<boolean> {
    const role = await getUserRole(email);
    return role === "premium" || role === "moderator" || role === "admin";
}

// Update user role in database
export async function updateUserRole(email: string, newRole: UserRole): Promise<void> {
    await db
        .update(userTable)
        .set({ role: newRole })
        .where(eq(userTable.email, email));
}
