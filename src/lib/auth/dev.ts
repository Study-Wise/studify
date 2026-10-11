// Dev environment authentication helper
// Uses USER_ACCESS_TOKEN env variable to authenticate in development

import { eq } from 'drizzle-orm';
import { db } from '@/db/initialize';
import { account, user as userTable } from '@/db/auth-schema';
import { threadsTable } from '@/db/schema';

import type { UserRole, User } from '@/lib/auth/types';
import type { ThreadAccessResult } from '@/lib/auth/checkThreadAccess';

// Check if we're in development environment
export function isDev(): boolean {
    return (import.meta.env.NODE_ENV || process.env.NODE_ENV) === "development";
}

// Get the USER_ACCESS_TOKEN from environment
function getDevAccessToken(): string | null {
    if (!isDev()) {
        return null;
    }
    return import.meta.env.USER_ACCESS_TOKEN || process.env.USER_ACCESS_TOKEN || null;
}

// Get the user ID from the account table using the access token
export async function getDevUserId(): Promise<string | null> {
    const accessToken = getDevAccessToken();
    if (!accessToken) {
        return null;
    }

    try {
        const accounts = await db
            .select({ userId: account.userId })
            .from(account)
            .where(eq(account.accessToken, accessToken))
            .limit(1);

        return accounts[0]?.userId || null;
    } catch (error) {
        console.error("Error fetching dev user ID from account:", error);
        return null;
    }
}

// Get the full user record from the user table using the dev access token
export async function getDevUser(): Promise<User | null> {
    const userId = await getDevUserId();
    if (!userId) {
        return null;
    }

    try {
        const users = await db
            .select()
            .from(userTable)
            .where(eq(userTable.id, userId))
            .limit(1);

        if (users.length === 0) {
            return null;
        }

        const user = users[0];
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            image: user.image,
            role: user.role as UserRole,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    } catch (error) {
        console.error("Error fetching dev user:", error);
        return null;
    }
}

// Get the dev user's role
export async function getDevUserRole(): Promise<UserRole | null> {
    const user = await getDevUser();
    return user?.role || null;
}

// Check if the dev user is an admin
export async function isDevUserAdmin(): Promise<boolean> {
    const role = await getDevUserRole();
    return role === "admin";
}

// Check if the dev user is a moderator or admin
export async function isDevUserModerator(): Promise<boolean> {
    const role = await getDevUserRole();
    return role === "moderator" || role === "admin";
}

// Check if the dev user has premium access
export async function isDevUserPremium(): Promise<boolean> {
    const role = await getDevUserRole();
    return role === "premium" || role === "moderator" || role === "admin";
}

// Check thread access for the dev user
// Similar to checkThreadAccess but uses the dev access token
export async function checkDevThreadAccess(
    threadId: string,
    urlCategory?: string,
    urlMode?: string
): Promise<ThreadAccessResult> {
    // Only works in dev environment
    if (!isDev()) {
        return {
            isAuthorized: false,
            isPublic: false,
            threadOwner: null,
            threadExists: false
        };
    }

    const devUser = await getDevUser();
    let threadOwner: string | null = null;
    let isPublicThread = false;
    let threadExists = false;

    // Get dev user email
    const userEmail = devUser?.email || null;

    // Check if dev user is admin
    const isUserAdminFlag = devUser?.role === "admin";

    // Fetch thread from database
    if (threadId) {
        try {
            const threads = await db
                .select()
                .from(threadsTable)
                .where(eq(threadsTable.id, threadId));

            if (threads.length > 0) {
                const thread = threads[0];
                threadExists = true;
                threadOwner = thread.email;
                isPublicThread = thread.isPublic;

                // Validate that the thread's category and mode match the URL
                if (urlCategory && thread.category !== urlCategory) {
                    console.error(
                        `Category mismatch: URL has '${urlCategory}' but thread has '${thread.category}'`
                    );
                    return {
                        isAuthorized: false,
                        isPublic: false,
                        threadOwner: null,
                        threadExists: true
                    };
                }
                if (urlMode && thread.mode !== urlMode) {
                    console.error(
                        `Mode mismatch: URL has '${urlMode}' but thread has '${thread.mode}'`
                    );
                    return {
                        isAuthorized: false,
                        isPublic: false,
                        threadOwner: null,
                        threadExists: true
                    };
                }

                // If unclaimed and dev user is authenticated, claim ownership
                if (!threadOwner && userEmail) {
                    try {
                        await db
                            .update(threadsTable)
                            .set({ email: userEmail, updatedAt: new Date() })
                            .where(eq(threadsTable.id, threadId));
                        threadOwner = userEmail;
                    } catch (e) {
                        console.error("Error claiming thread ownership:", e);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching thread:", error);
        }
    }

    // Check if user is authorized
    // User is authorized if the thread exists and:
    // 1. They own the thread (email matches)
    // 2. Thread is unclaimed
    // 3. They are an admin
    const isAuthorized = Boolean(
        threadExists &&
            ((threadOwner && threadOwner === userEmail) ||
                !threadOwner ||
                isUserAdminFlag)
    );

    // Thread is public if it's marked public AND user is not already authorized
    const isPublic = !isAuthorized && isPublicThread;

    return {
        isAuthorized,
        isPublic,
        threadOwner,
        threadExists,
    };
}
