import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import { isUserAdmin as checkIsUserAdmin } from '@/lib/auth/admin';
import { isDev, getDevUser, isDevUserAdmin } from '@/lib/auth/dev';
import type { User } from 'better-auth';

import { eq } from 'drizzle-orm';

export interface ThreadAccessResult {
    isAuthorized: boolean;
    // Viewer has access only because the thread is public
    isPublic: boolean;
    // Thread is marked public, regardless of who is viewing
    isPublicThread: boolean;
    threadOwner: string | null;
    // A thread with this ID is in the database. Unknown IDs still count as authorized (unclaimed),
    // so pages that only show an existing thread must check this too.
    threadExists: boolean;
}

export async function checkThreadAccess(
    threadId: string,
    user: User | null,
    urlCategory?: string,
    urlMode?: string,
): Promise<ThreadAccessResult> {
    let threadOwner: string | null = null;
    let isPublicThread = false;
    let threadExists = false;

    let effectiveUser = user;
    if (!effectiveUser && isDev()) {
        effectiveUser = await getDevUser();
    }
    const userEmail = effectiveUser?.email || null;

    let isUserAdminFlag = false;
    if (userEmail) {
        try {
            isUserAdminFlag = await checkIsUserAdmin(userEmail);
        } catch (error) {
            console.error('Error checking admin status:', error);
        }
    }
    else if (isDev()) {
        // In dev mode without a user email, check dev user admin status directly
        try {
            isUserAdminFlag = await isDevUserAdmin();
        } catch (error) {
            console.error('Error checking dev admin status:', error);
        }
    }

    if (threadId) {
        try {
            const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));
            if (threads.length > 0) {
                const thread = threads[0];
                threadExists = true;
                threadOwner = thread.email;
                isPublicThread = thread.isPublic;

                if (urlCategory && thread.category !== urlCategory) {
                    console.error(`Category mismatch: URL has '${urlCategory}' but thread has '${thread.category}'`);
                    return {
                        isAuthorized: false,
                        isPublic: false,
                        isPublicThread: false,
                        threadOwner: null,
                        threadExists
                    };
                }
                if (urlMode && thread.mode !== urlMode) {
                    console.error(`Mode mismatch: URL has '${urlMode}' but thread has '${thread.mode}'`);
                    return {
                        isAuthorized: false,
                        isPublic: false,
                        isPublicThread: false,
                        threadOwner: null,
                        threadExists
                    };
                }

                if (!threadOwner && userEmail) {
                    try {
                        await db.update(threadsTable)
                            .set({ email: userEmail, updatedAt: new Date() })
                            .where(eq(threadsTable.id, threadId));
                        threadOwner = userEmail;
                    } catch (e) {
                        console.error('Error claiming thread ownership:', e);
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

    const isPublic = !isAuthorized && isPublicThread;

    return {
        isAuthorized,
        isPublic,
        isPublicThread,
        threadOwner,
        threadExists
    };
}
