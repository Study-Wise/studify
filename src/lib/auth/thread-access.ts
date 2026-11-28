import type { User } from 'better-auth';
import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import appConfig from '@/lib/app.config';
import { getUserRole } from '@/lib/auth/admin';
import { isDev, getDevUser } from '@/lib/auth/dev';

import { eq } from 'drizzle-orm';

export interface ThreadAccessResult {
    isAuthorized: boolean;
    isPublic: boolean;
}

export async function getThreadAccess(
    threadId: string,
    user: User | null,
    urlCategory?: string,
    urlMode?: string,
): Promise<ThreadAccessResult> {
    let threadOwner: string | null = null;
    let isPublicThread = false;
    let isUserAdminFlag = false;

    const userEmail = (user ?? (isDev ? await getDevUser() : null))?.email;

    if (userEmail) {
        try {
            isUserAdminFlag = (await getUserRole(userEmail)) === appConfig.adminRole;
        } catch (error) {
            console.error('Error checking admin status:', error);
        }
    }
    else if (isDev) {
        try {
            isUserAdminFlag = (await getDevUser())?.role === appConfig.adminRole;
        } catch (error) {
            console.error('Error checking dev admin status:', error);
        }
    }

    if (threadId) {
        try {
            const [thread] = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));
            if (thread) {
                threadOwner = thread.email;
                isPublicThread = thread.isPublic;

                if (urlCategory && thread.category !== urlCategory) {
                    console.error(`Category mismatch: URL has '${urlCategory}' but thread has '${thread.category}'`);
                    return {
                        isAuthorized: false,
                        isPublic: false
                    };
                }
                if (urlMode && thread.mode !== urlMode) {
                    console.error(`Mode mismatch: URL has '${urlMode}' but thread has '${thread.mode}'`);
                    return {
                        isAuthorized: false,
                        isPublic: false
                    };
                }

                if (!threadOwner && userEmail) {
                    try {
                        await db.update(threadsTable)
                            .set({ email: userEmail, updatedAt: new Date() })
                            .where(eq(threadsTable.id, threadId));
                        threadOwner = userEmail;
                    } catch (error) {
                        console.error('Error claiming thread ownership:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching thread:', error);
        }
    }

    const isAuthorized = Boolean(
        threadId &&
        ((threadOwner && threadOwner === userEmail) || !threadOwner || isUserAdminFlag)
    );

    return {
        isAuthorized: isAuthorized,
        isPublic: !isAuthorized && isPublicThread
    };
}

export async function checkThreadAccess(threadId: string, user: User | null): Promise<boolean> {
    const access = await getThreadAccess(threadId, user);
    return access.isAuthorized || access.isPublic;
}
