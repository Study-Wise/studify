// Roles are stored in the database and auto-promoted based on email/domain

import { user as userTable } from '@/db/auth-schema';
import { db } from '@/db/initialize';
import type { UserRole } from '@/lib/auth/types';

import { eq } from 'drizzle-orm';

export async function getUserRole(email: string): Promise<UserRole> {
    const users = await db
        .select({ role: userTable.role })
        .from(userTable)
        .where(eq(userTable.email, email))
        .limit(1);

    return users[0]?.role || 'user';
}

export async function getUserRoleById(userId: string): Promise<UserRole> {
    const users = await db
        .select({ role: userTable.role })
        .from(userTable)
        .where(eq(userTable.id, userId))
        .limit(1);

    return users[0]?.role || 'user';
}

export async function isUserAdmin(email: string): Promise<boolean> {
    return (await getUserRole(email)) === 'admin';
}

export async function isUserAdminById(userId: string): Promise<boolean> {
    return (await getUserRoleById(userId)) === 'admin';
}

export async function isUserModerator(email: string): Promise<boolean> {
    const role = await getUserRole(email);
    return role === 'moderator' || role === 'admin';
}

export async function isUserPremium(email: string): Promise<boolean> {
    const role = await getUserRole(email);
    return role === 'premium' || role === 'moderator' || role === 'admin';
}

export async function updateUserRole(email: string, newRole: UserRole): Promise<void> {
    await db
        .update(userTable)
        .set({ role: newRole })
        .where(eq(userTable.email, email));
}
