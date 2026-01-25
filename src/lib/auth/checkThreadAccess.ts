import { db } from '@/db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '@/db/schema';
import { isUserAdmin as checkIsUserAdmin } from './admin';
import { isDev, getDevUser, isDevUserAdmin } from './dev';
import type { ThreadAccessResult } from '../types';
import type { User } from "better-auth";

export async function checkThreadAccess(
    threadId: string,
    user: User | null,
    urlCategory?: string,
    urlMode?: string,
): Promise<ThreadAccessResult> {
    let threadOwner: string | null = null;
    let isPublicThread = false;

    // Get user email - fallback to dev user if in dev mode and no user provided
    let effectiveUser = user;
    if (!effectiveUser && isDev()) {
        effectiveUser = await getDevUser();
    }
    const userEmail = effectiveUser?.email || null;

    // Check if user is admin
    let isUserAdminFlag = false;
    if (userEmail) {
        try {
            isUserAdminFlag = await checkIsUserAdmin(userEmail);
        } catch (error) {
            console.error('Error checking admin status:', error);
        }
    } else if (isDev()) {
        // In dev mode without a user email, check dev user admin status directly
        try {
            isUserAdminFlag = await isDevUserAdmin();
        } catch (error) {
            console.error('Error checking dev admin status:', error);
        }
    }

    // Fetch thread from database
    if (threadId) {
        try {
            const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));
            if (threads.length > 0) {
                const thread = threads[0];
                threadOwner = thread.email;
                isPublicThread = thread.isPublic;

                // Validate that the thread's category and mode match the URL
                if (urlCategory && thread.category !== urlCategory) {
                    console.error(`Category mismatch: URL has '${urlCategory}' but thread has '${thread.category}'`);
                    return {
                        isAuthorized: false,
                        isPublic: false,
                        threadOwner: null
                    };
                }
                if (urlMode && thread.mode !== urlMode) {
                    console.error(`Mode mismatch: URL has '${urlMode}' but thread has '${thread.mode}'`);
                    return {
                        isAuthorized: false,
                        isPublic: false,
                        threadOwner: null
                    };
                }

                // If unclaimed and user is authenticated, claim ownership
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

    // Check if user is authorized
    // User is authorized if:
    // 1. They own the thread (email matches)
    // 2. Thread is unclaimed
    // 3. They are an admin
    const isAuthorized = Boolean(
        threadId &&
        ((threadOwner && threadOwner === userEmail) || !threadOwner || isUserAdminFlag)
    );

    // Thread is public if it's marked public AND user is not already authorized
    const isPublic = !isAuthorized && isPublicThread;

    return {
        isAuthorized,
        isPublic,
        threadOwner
    };
}
