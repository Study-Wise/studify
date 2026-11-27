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

export async function updateUserRole(email: string, newRole: UserRole): Promise<void> {
    await db
        .update(userTable)
        .set({ role: newRole })
        .where(eq(userTable.email, email));
}
