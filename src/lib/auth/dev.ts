// Uses USER_ACCESS_TOKEN env variable to authenticate in development

import { account, user as userTable } from '@/db/auth-schema';
import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import type { ThreadAccessResult } from '@/lib/auth/check-thread-access';
import type { UserRole, User } from '@/lib/auth/types';

import { eq } from 'drizzle-orm';

export function isDev(): boolean {
    return (import.meta.env.NODE_ENV || process.env.NODE_ENV) === 'development';
}

const DEV_ACCESS_TOKEN = import.meta.env.USER_ACCESS_TOKEN || process.env.USER_ACCESS_TOKEN || null;

export async function getDevUserId(): Promise<string | null> {
    if (!isDev()) return null;
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
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            image: user.image,
            role: user.role === 'admin' || user.role === 'moderator' ? user.role : 'user',
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    } catch (error) {
        console.error('Error fetching dev user:', error);
        return null;
    }
}

export async function getDevUserRole(): Promise<UserRole | ''> {
    return (await getDevUser())?.role || '';
}

export async function isDevUserAdmin(): Promise<boolean> {
    return (await getDevUserRole()) === 'admin';
}

export async function isDevUserModerator(): Promise<boolean> {
    return ['moderator', 'admin'].includes(await getDevUserRole());
}

export async function isDevUserPremium(): Promise<boolean> {
    return ['premium', 'moderator', 'admin'].includes(await getDevUserRole());
}

// Similar to checkThreadAccess but uses the dev access token
export async function checkDevThreadAccess(
    threadId: string,
    urlCategory?: string,
    urlMode?: string
): Promise<ThreadAccessResult> {
    if (!isDev()) {
        return {
            isAuthorized: false,
            isPublic: false,
            isPublicThread: false,
            threadOwner: null,
            threadExists: false,
        };
    }

    const devUser = await getDevUser();
    let threadOwner: string | null = null;
    let isPublicThread = false;
    let threadExists = false;

    const userEmail = devUser?.email || null;

    if (threadId) {
        try {
            const [thread] = await db
                .select()
                .from(threadsTable)
                .where(eq(threadsTable.id, threadId));

            if (thread) {
                threadExists = true;
                threadOwner = thread.email;
                isPublicThread = thread.isPublic;

                if (urlCategory && thread.category !== urlCategory) {
                    console.error(
                        `Category mismatch: URL has '${urlCategory}' but thread has '${thread.category}'`
                    );
                    return {
                        isAuthorized: false,
                        isPublic: false,
                        isPublicThread: false,
                        threadOwner: null,
                        threadExists,
                    };
                }
                if (urlMode && thread.mode !== urlMode) {
                    console.error(
                        `Mode mismatch: URL has '${urlMode}' but thread has '${thread.mode}'`
                    );
                    return {
                        isAuthorized: false,
                        isPublic: false,
                        isPublicThread: false,
                        threadOwner: null,
                        threadExists,
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

    const isAuthorized = Boolean(
        threadId &&
            ((threadOwner && threadOwner === userEmail) ||
                !threadOwner ||
                devUser?.role === 'admin')
    );

    return {
        isAuthorized: isAuthorized,
        isPublic: !isAuthorized && isPublicThread,
        isPublicThread: isPublicThread,
        threadOwner,
        threadExists,
    };
}
