import 'dotenv/config';
import type { APIRoute } from 'astro';
import { nanoid } from 'nanoid';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

import { db } from '../../../db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '../../../db/schema';
import { checkThreadAccess } from '../../../lib/auth/checkThreadAccess';
import categories from '../../../lib/modes';
import config from '../../../lib/config';

export const POST: APIRoute = async ({ request, locals }) => {
    const requestId = nanoid();

    console.log(`📋 [${requestId}] Starting reference sheet generation request`);

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

        const { userId, sessionClaims } = auth();
        const user_email = userId ? ((sessionClaims?.email as string) || null) : null;

        // Check thread access
        const { isAuthorized, isPublic } = await checkThreadAccess(threadId, user_email, auth);

        if (!isAuthorized && !isPublic) {
            console.error(`❌ [${requestId}] Unauthorized access to thread:`, threadId);
            return new Response(
                JSON.stringify({ status: 'error', error: 'Unauthorized' }),
                {
                    status: 403,
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

        // Get the thread messages
        const threadData = thread?.thread as any;
        const messages = threadData?.messages ?? [];

        if (messages.length === 0) {
            console.error(`❌ [${requestId}] No messages found in thread`);
            return new Response(
                JSON.stringify({ status: 'error', error: 'No messages found in thread' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Get the first user message
        const firstUserMessage = messages.find((msg: any) => msg.role === 'user');

        if (!firstUserMessage) {
            console.error(`❌ [${requestId}] No user messages found in thread`);
            return new Response(
                JSON.stringify({ status: 'error', error: 'No user messages found' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Get the mode object for the thread's category and mode
        const category = thread.category || 'math';
        const mode = thread.mode || 'general';
        const modeObj = categories[category]?.modes?.[mode];

        // Get the base system prompt
        const baseSystemPrompt = modeObj?.prompt ? await modeObj.prompt : config.systemPrompt;

        // Create a reference sheet specific prompt
        const referenceSheetPrompt = `${baseSystemPrompt}

IMPORTANT: Generate ONLY a Reference Sheet based on the user's homework. Do NOT include a Study Guide section.

Your response should be wrapped in HTML like so:
<dialog class="fancy-output"><div class="reference-sheet">Please put full MD/HTML content inside here</div></dialog>

### Reference Sheet
#### Formulas & Theorems
(list with \`$…$\`/\`$$…$$\`, explain variables)

#### Key Definitions
(2-3 concise definitions)

#### Important Concepts
(brief summary of key concepts)

Math formatting: use \`$…$\` for displaying math formulas/equations inline and \`$$…$$\` for displaying them on their own; never use backticks for complex math.`;

        console.log(`🤖 [${requestId}] Generating reference sheet`);
        const result = await generateText({
            model: openai(config.model),
            messages: [
                {
                    role: 'system',
                    content: referenceSheetPrompt
                },
                {
                    role: 'user',
                    content: firstUserMessage.content
                }
            ],
        });

        console.log(`🎉 [${requestId}] Reference sheet generation completed successfully`);

        return new Response(
            JSON.stringify({
                status: 'success',
                content: result.text
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );

    } catch (error) {
        console.error(`❌ [${requestId}] Error generating reference sheet:`, error);
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
