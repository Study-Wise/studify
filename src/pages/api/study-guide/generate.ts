import 'dotenv/config';
import type { APIRoute } from 'astro';
import { nanoid } from 'nanoid';

import { db } from '../../../db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '../../../db/schema';
import { isValidEmail } from '../../../lib/validation';
import { generateStudyGuide } from '../../../lib/content/generate/study-guide';

export const POST: APIRoute = async ({ request, locals }) => {
    const requestId = nanoid();

    console.log(`📚 [${requestId}] Starting study guide generation request`);

    try {
        console.log(`📥 [${requestId}] Parsing request body`);
        const { threadId } = await request.json();

        console.log(`📝 [${requestId}] Request payload:`, {
            threadId: threadId || 'none'
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
        const { userId, sessionClaims } = auth();
        const user_email = userId ? ((sessionClaims?.email as string) || null) : null;

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

        // Generate the study guide
        console.log(`🤖 [${requestId}] Generating study guide`);
        const content = await generateStudyGuide(threadId, user_email);

        // Save the generated study guide to the database
        console.log(`💾 [${requestId}] Saving study guide to database`);
        await db.update(threadsTable)
            .set({
                generatedStudyGuide: content,
                updatedAt: new Date()
            })
            .where(eq(threadsTable.id, threadId));

        console.log(`🎉 [${requestId}] Study guide generation completed successfully`);

        return new Response(
            JSON.stringify({
                status: 'success',
                content: content
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );

    } catch (error) {
        console.error(`❌ [${requestId}] Error generating study guide:`, error);
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
