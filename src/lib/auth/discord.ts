import { user as userTable } from '@/db/auth-schema';
import { db } from '@/db/initialize';
import type { UserDiscord } from '@/lib/auth/types';

import { eq } from 'drizzle-orm';

export async function getUserDiscord(email: string): Promise<UserDiscord | null> {
    return (await db
        .select({ discord: userTable.discord })
        .from(userTable)
        .where(eq(userTable.email, email))
        .limit(1))[0]?.discord ?? null;
}
