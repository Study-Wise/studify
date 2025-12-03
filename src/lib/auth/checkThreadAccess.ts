import { db } from '../../db/initialize';
import { eq, and } from 'drizzle-orm';
import { threadsTable } from '../../db/schema';
import { getUserRole } from '../auth-utils';
import type { ThreadAccessResult } from '../types';

export async function checkThreadAccess(
    threadId: string,
    userEmail: string | null,
    auth: any,
    urlCategory?: string,
    urlAgent?: string
): Promise<ThreadAccessResult> {
    let threadOwner: string | null = null;
    let isPublicThread = false;

    // Get user role
    const userRole = getUserRole(auth);
    const isUserAdmin = userRole === 'admin';

    // Fetch thread from database
    if (threadId) {
        try {
            const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));
            if (threads.length > 0) {
                const thread = threads[0];
                threadOwner = thread.email;
                isPublicThread = thread.isPublic;

                // Validate that the thread's category and agent match the URL
                if (urlCategory && thread.category !== urlCategory) {
                    console.error(`Category mismatch: URL has '${urlCategory}' but thread has '${thread.category}'`);
                    return {
                        isAuthorized: false,
                        isPublic: false,
                        threadOwner: null
                    };
                }
                if (urlAgent && thread.agent !== urlAgent) {
                    console.error(`Agent mismatch: URL has '${urlAgent}' but thread has '${thread.agent}'`);
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
        ((threadOwner && threadOwner === userEmail) || !threadOwner || isUserAdmin)
    );

    // Thread is public if it's marked public AND user is not already authorized
    const isPublic = !isAuthorized && isPublicThread;

    return {
        isAuthorized,
        isPublic,
        threadOwner
    };
}
