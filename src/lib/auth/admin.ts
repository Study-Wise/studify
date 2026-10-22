// Roles are stored in the database and auto-promoted based on email/domain

import { user as userTable } from '@/db/auth-schema';
import { db } from '@/db/initialize';
import type { UserRole } from '@/lib/auth/types';

import { eq } from 'drizzle-orm';

export async function getUserRole(email: string): Promise<UserRole> {
    return (await db
        .select({ role: userTable.role })
        .from(userTable)
        .where(eq(userTable.email, email))
        .limit(1))[0]?.role || 'user';
}

export async function getUserRoleById(userId: string): Promise<UserRole> {
    return (await db
        .select({ role: userTable.role })
        .from(userTable)
        .where(eq(userTable.id, userId))
        .limit(1))[0]?.role || 'user';
}

export async function isUserAdmin(email: string): Promise<boolean> {
    return (await getUserRole(email)) === 'admin';
}

export async function isUserAdminById(userId: string): Promise<boolean> {
    return (await getUserRoleById(userId)) === 'admin';
}

export async function isUserModerator(email: string): Promise<boolean> {
    return ['moderator', 'admin'].includes(await getUserRole(email));
}

export async function isUserPremium(email: string): Promise<boolean> {
    return ['premium', 'moderator', 'admin'].includes(await getUserRole(email));
}

export async function updateUserRole(email: string, newRole: UserRole): Promise<void> {
    await db
        .update(userTable)
        .set({ role: newRole })
        .where(eq(userTable.email, email));
}
