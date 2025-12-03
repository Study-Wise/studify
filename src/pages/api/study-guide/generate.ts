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
import desmosSection from '../../../lib/promptTemplates/desmos';
import stepByStepHTML from '../../../lib/promptTemplates/stepByStepHTML';

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

        // Create a study guide specific prompt
        const studyGuidePrompt = `${baseSystemPrompt}

IMPORTANT: Generate ONLY a Study Guide based on the user's homework. Do NOT include a Reference Sheet section.

Your response should be wrapped in HTML like so:
<dialog class="fancy-output"><div class="study-guide">Please put full MD/HTML content inside here</div></dialog>

IMPORTANT USER NOTIFICATION (immediately under ### Study Guide):

NOTE This guide focuses on the concepts from your homework and provides related practice. It will NOT solve your specific submitted problems directly, EXCEPT for the interactive step-by-step breakdown below, which WILL guide you through solving ONE of your problems.

### Study Guide
#### Core Concepts Identified
(list main topics)

#### Explanation: What is this about?
(brief, level-appropriate)

${desmosSection}

#### Interactive Mock Quiz
Create a 3-question quiz based on the homework concepts:
${stepByStepHTML}

#### Practice Problems (Solve These!)
(3 new problems at the same level)

#### Key Skills to Practice
(list)

#### Vocabulary
(define 3-5 relevant terms)

#### Quick Tip / Common Pitfall
(one tip)

Math formatting: use \`$…$\` for displaying math formulas/equations inline and \`$$…$$\` for displaying them on their own; never use backticks for complex math.`;

        console.log(`🤖 [${requestId}] Generating study guide`);
        const result = await generateText({
            model: openai(config.model),
            messages: [
                {
                    role: 'system',
                    content: studyGuidePrompt
                },
                {
                    role: 'user',
                    content: firstUserMessage.content
                }
            ],
        });

        console.log(`🎉 [${requestId}] Study guide generation completed successfully`);

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
