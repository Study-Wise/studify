// Uses USER_ACCESS_TOKEN env variable to authenticate in development

import { account, user as userTable } from '@/db/auth-schema';
import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import appConfig from '@/lib/app.config';
import type { ThreadAccessResult } from '@/lib/auth/thread-access';
import type { User } from '@/lib/auth/types';

import { eq } from 'drizzle-orm';

export const isDev = (import.meta.env.NODE_ENV || process.env.NODE_ENV) === 'development';

const DEV_ACCESS_TOKEN = import.meta.env.USER_ACCESS_TOKEN || process.env.USER_ACCESS_TOKEN || null;

export async function getDevUserId(): Promise<string | null> {
    if (!isDev) return null;
    if (!DEV_ACCESS_TOKEN) return null;

    try {
        return (await db
            .select({ userId: account.userId })
            .from(account)
            .where(eq(account.accessToken, DEV_ACCESS_TOKEN))
            .limit(1))[0]?.userId || null;
    } catch (error) {
        console.error('Error fetching dev user ID from account:', error);
        return null;
    }
}

export async function getDevUser(): Promise<User | null> {
    const _userId = await getDevUserId();
    if (!_userId) return null;

    try {
        const [user] = await db
            .select()
            .from(userTable)
            .where(eq(userTable.id, _userId))
            .limit(1);

        if (!user) return null;

        return {
            ...user,
            role: user.role === appConfig.adminRole || user.role === appConfig.moderatorRole ? user.role : 'user',
        };
    } catch (error) {
        console.error('Error fetching dev user:', error);
        return null;
    }
}

export async function isDevUserModerator(): Promise<boolean> {
    return [appConfig.moderatorRole, appConfig.adminRole].includes((await getDevUser())?.role || '');
}

export async function isDevUserPremium(): Promise<boolean> {
    return [appConfig.premiumRole, appConfig.moderatorRole, appConfig.adminRole].includes((await getDevUser())?.role || '');
}

// Similar to checkThreadAccess but uses the dev access token
export async function checkDevThreadAccess(
    threadId: string,
    urlCategory?: string,
    urlMode?: string
): Promise<ThreadAccessResult> {
    if (!isDev) {
        return {
            isAuthorized: false,
            isPublic: false,
        };
    }

    const devUser = await getDevUser();
    let threadOwner: string | null = null;
    let isPublicThread = false;

    const userEmail = devUser?.email || null;

    if (threadId) {
        try {
            const [thread] = await db
                .select()
                .from(threadsTable)
                .where(eq(threadsTable.id, threadId));

            if (thread) {
                threadOwner = thread.email;
                isPublicThread = thread.isPublic;

                if (urlCategory && thread.category !== urlCategory) {
                    console.error(
                        `Category mismatch: URL has '${urlCategory}' but thread has '${thread.category}'`
                    );
                    return {
                        isAuthorized: false,
                        isPublic: false,
                    };
                }
                if (urlMode && thread.mode !== urlMode) {
                    console.error(
                        `Mode mismatch: URL has '${urlMode}' but thread has '${thread.mode}'`
                    );
                    return {
                        isAuthorized: false,
                        isPublic: false,
                    };
                }

                if (!threadOwner && userEmail) {
                    try {
                        await db
                            .update(threadsTable)
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

    return {
        isAuthorized: !!threadId && (!threadOwner || threadOwner === userEmail || devUser?.role === appConfig.adminRole),
        isPublic: isPublicThread && !(threadId && (!threadOwner || threadOwner === userEmail || devUser?.role === appConfig.adminRole)),
    };
}
