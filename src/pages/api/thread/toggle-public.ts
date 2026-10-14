import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import { isValidEmail } from '@/lib/validation';
import 'dotenv/config';
import { nanoid } from 'nanoid';

import { eq } from 'drizzle-orm';

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
    const requestId = nanoid();

    try {
        const { threadId, isPublic } = await request.json();

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

        const user = locals.user;
        if (!user) {
            console.error(`❌ [${requestId}] Authentication required but not provided`);
            return new Response(
                JSON.stringify({ status: 'error', error: 'Authentication required' }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        const user_email = user.email;

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

        await db.update(threadsTable)
            .set({
                isPublic: isPublic,
                updatedAt: new Date()
            })
            .where(eq(threadsTable.id, threadId));

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
