import type { APIRoute } from 'astro';

import 'dotenv/config';
import { nanoid } from 'nanoid';

import { eq } from 'drizzle-orm';
import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';

import { userFilesUpload } from '@/lib/uploadthing';
import { isValidEmail } from '@/lib/validation';

export const POST: APIRoute = async ({ request, locals }) => {
    const requestId = nanoid();

    try {
        const { threadId } = await request.json();

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

        // Only the owner can delete the thread
        if (thread.email !== user_email) {
            console.error(`❌ [${requestId}] Unauthorized: User does not own this thread`);
            return new Response(
                JSON.stringify({ status: 'error', error: 'Only the thread owner can delete this chat' }),
                {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Remove uploaded files from UploadThing
        const fileKeys = (thread.uploadedFiles || []).map((file) => file.key).filter(Boolean);
        if (fileKeys.length > 0) {
            try {
                await userFilesUpload.deleteFiles(fileKeys);
            } catch (error) {
                console.error(`❌ [${requestId}] UploadThing deletion error:`, error);
                // Continue even if UploadThing deletion fails
            }
        }

        await db.delete(threadsTable).where(eq(threadsTable.id, threadId));

        return new Response(
            JSON.stringify({ status: 'success' }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );

    } catch (error) {
        console.error(`❌ [${requestId}] Error deleting thread:`, error);
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
