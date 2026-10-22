import 'dotenv/config';
import { nanoid } from 'nanoid';
import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import { getUserErrorMessage, THREAD_NOT_FOUND_MESSAGE } from '@/lib/user-errors';
import isValidEmail from '@/lib/validation';
import { generateWebpage } from '@/lib/content/generate/webpage';

import { eq } from 'drizzle-orm';

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
    const requestId = nanoid();

    try {
        const { threadId, userPrompt } = await request.json();

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

        if (!locals.user) {
            console.error(`❌ [${requestId}] Authentication required but not provided`);
            return new Response(
                JSON.stringify({ status: 'error', error: 'Authentication required' }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        const user_email = locals.user.email;

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
                JSON.stringify({ status: 'error', error: THREAD_NOT_FOUND_MESSAGE }),
                {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        if (threads[0].email !== user_email && !threads[0].isPublic) {
            console.error(`❌ [${requestId}] Unauthorized access to thread:`, threadId);
            return new Response(
                JSON.stringify({ status: 'error', error: 'Unauthorized' }),
                {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        return new Response(
            JSON.stringify({
                status: 'success',
                content: await generateWebpage(threadId, userPrompt)
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );

    } catch (error) {
        console.error(`❌ [${requestId}] Error generating webpage:`, error);
        return new Response(
            JSON.stringify({
                status: 'error',
                error: getUserErrorMessage(error, 'generate the webpage', requestId)
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};
