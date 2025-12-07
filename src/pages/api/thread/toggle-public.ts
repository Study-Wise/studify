import 'dotenv/config';
import type { APIRoute } from 'astro';
import { nanoid } from 'nanoid';

import { db } from '../../../db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '../../../db/schema';
import { isValidEmail } from '../../../lib/validation';
import { clerkClient } from '@clerk/astro/server';

export const POST: APIRoute = async ({ request, locals, ...context }) => {
    const requestId = nanoid();

    console.log(`🔄 [${requestId}] Starting toggle public request`);

    try {
        console.log(`📥 [${requestId}] Parsing request body`);
        const { threadId, isPublic } = await request.json();

        console.log(`📝 [${requestId}] Request payload:`, {
            threadId: threadId || 'none',
            isPublic
        });

        if (!threadId) {
            console.error(`❌ [${requestId}] No thread ID provided`);
            return new Response(
                JSON.stringify({ status: 'error', error: 'Thread ID is required' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        if (typeof isPublic !== 'boolean') {
            console.error(`❌ [${requestId}] Invalid isPublic value provided`);
            return new Response(
                JSON.stringify({ status: 'error', error: 'isPublic must be a boolean' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Authentication
        const auth = locals?.auth;
        if (!auth) {
            console.error(`❌ [${requestId}] Authentication required but not provided`);
            return new Response(
                JSON.stringify({ status: 'error', error: 'Authentication required' }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        console.log(`🔐 [${requestId}] Authentication found, extracting user info`);
        const { userId } = auth();

        // Fetch user from Clerk to get email properly
        let user_email: string | null = null;
        if (userId) {
            try {
                const client = clerkClient({ request, locals, ...context });
                const user = await client.users.getUser(userId);
                user_email = user.emailAddresses?.[0]?.emailAddress || null;
                console.log(`✅ [${requestId}] Successfully fetched user email from Clerk`);
            } catch (error) {
                console.error(`❌ [${requestId}] Error fetching user from Clerk:`, error);
            }
        }

        console.log(`👤 [${requestId}] User info:`, {
            userId: userId || 'none',
            userEmail: user_email || 'none'
        });

        // Validate email
        if (!isValidEmail(user_email)) {
            console.error(`❌ [${requestId}] Invalid email format:`, user_email);
            return new Response(
                JSON.stringify({ status: 'error', error: 'Invalid email' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Fetch the thread
        console.log(`🔍 [${requestId}] Fetching thread from database`);
        const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));

        if (threads.length === 0) {
            console.error(`❌ [${requestId}] Thread not found:`, threadId);
            return new Response(
                JSON.stringify({ status: 'error', error: 'Thread not found' }),
                {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        const thread = threads[0];

        // Check if user owns the thread - only owner can toggle public status
        if (thread.email !== user_email) {
            console.error(`❌ [${requestId}] Unauthorized: User does not own this thread`);
            return new Response(
                JSON.stringify({ status: 'error', error: 'Only the thread owner can change sharing settings' }),
                {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Update the isPublic field
        console.log(`💾 [${requestId}] Updating isPublic to ${isPublic}`);
        await db.update(threadsTable)
            .set({
                isPublic: isPublic,
                updatedAt: new Date()
            })
            .where(eq(threadsTable.id, threadId));

        console.log(`🎉 [${requestId}] Successfully toggled isPublic to ${isPublic}`);

        return new Response(
            JSON.stringify({
                status: 'success',
                isPublic: isPublic
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );

    } catch (error) {
        console.error(`❌ [${requestId}] Error toggling public status:`, error);
        return new Response(
            JSON.stringify({
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};
