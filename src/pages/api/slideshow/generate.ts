import type { APIRoute } from 'astro';
import { nanoid } from 'nanoid';

import { eq } from 'drizzle-orm';
import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';

import { isValidEmail } from '@/lib/validation';
import { getUserErrorMessage, THREAD_NOT_FOUND_MESSAGE } from '@/lib/user-errors';
import { generateSlideshow } from '@/lib/content/generate/slideshow';

export const POST: APIRoute = async ({ request, locals }) => {
    const requestId = nanoid();

    try {
        const { threadId } = await request.json();

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

        // Authentication
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

        const thread = threads[0];

        // Check if user owns the thread or if it's public
        if (thread.email !== user_email && !thread.isPublic) {
            console.error(`❌ [${requestId}] Unauthorized access to thread:`, threadId);
            return new Response(
                JSON.stringify({ status: 'error', error: 'Unauthorized' }),
                {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Generate the slideshow (saves to DB automatically)
        const result = await generateSlideshow(threadId);

        return new Response(
            JSON.stringify({
                status: 'success',
                content: result.html
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );

    } catch (error) {
        console.error(`❌ [${requestId}] Error generating slideshow:`, error);
        return new Response(
            JSON.stringify({
                status: 'error',
                error: getUserErrorMessage(error, 'generate the slideshow', requestId)
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};
