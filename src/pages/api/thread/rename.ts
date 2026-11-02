import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import isValidEmail from '@/lib/validation';
import 'dotenv/config';
import { nanoid } from 'nanoid';

import { eq } from 'drizzle-orm';

import type { APIRoute } from 'astro';

// Matches the length of the title column in threadsTable
const MAX_TITLE_LENGTH = 255;

export const POST: APIRoute = async ({ request, locals }) => {
    const requestId = nanoid();

    try {
        const { threadId, title } = await request.json();

        if (!threadId || typeof threadId !== 'string') {
            console.error(`❌ [${requestId}] No thread ID provided`);
            return new Response(
                JSON.stringify({ status: 'error', error: 'Thread ID is required' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Collapse whitespace so pasted line breaks don't end up in the title
        const newTitle = typeof title === 'string' ? title.replace(/\s+/g, ' ').trim() : '';

        if (!newTitle) {
            console.error(`❌ [${requestId}] No title provided`);
            return new Response(
                JSON.stringify({ status: 'error', error: 'Title cannot be empty' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Matches the length of the title column in threadsTable
        if (newTitle.length > MAX_TITLE_LENGTH) {
            console.error(`❌ [${requestId}] Title too long:`, newTitle.length);
            return new Response(
                JSON.stringify({ status: 'error', error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer` }),
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

        if (!isValidEmail(locals.user.email)) {
            console.error(`❌ [${requestId}] Invalid email format:`, locals.user.email);
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

        // Check if user owns the thread - only owner can rename it
        if (threads[0].email !== locals.user.email) {
            console.error(`❌ [${requestId}] Unauthorized: User does not own this thread`);
            return new Response(
                JSON.stringify({ status: 'error', error: 'Only the thread owner can rename this chat' }),
                {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        await db.update(threadsTable)
            .set({
                title: newTitle,
                updatedAt: new Date()
            })
            .where(eq(threadsTable.id, threadId));

        return new Response(
            JSON.stringify({
                status: 'success',
                title: newTitle
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );

    } catch (error) {
        console.error(`❌ [${requestId}] Error renaming thread:`, error);
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
