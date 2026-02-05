import { generateText } from 'ai';
import categories from '../../modes';
import config from '../../config';
import desmosSection from '../../promptTemplates/desmos';
import stepByStepHTML from '../../promptTemplates/stepByStepHTML';
import { db } from '@/db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '@/db/schema';
import type { ThreadData } from '../../types';

export async function generateStudyGuide(threadId: string, _userEmail: string | null) {
    // Fetch the thread from database
    const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));

    if (threads.length === 0) {
        throw new Error('Thread not found');
    }

    const thread = threads[0];
    const category = thread.category;
    const mode = thread.mode;
    const userModel = thread.model || config.model;
    const provider = thread.provider || config.provider;

    // Get conversation history directly from thread data
    const threadData = thread.thread as ThreadData;
    const messages = threadData?.messages ?? [];

    if (messages.length === 0) {
        throw new Error('No messages found in thread');
    }

    // Get the mode object for the thread's category and mode
    const modeObj = categories[category]?.modes?.[mode];

    // Get the base system prompt
    const baseSystemPrompt = modeObj?.prompt ? await modeObj.prompt : config.systemPrompt;

    // Create a study guide specific prompt
    const studyGuidePrompt = `${baseSystemPrompt}

IMPORTANT: Generate ONLY a Study Guide based on the conversation history. Do NOT include a Reference Sheet section.

Output the content directly without any wrapping HTML tags or dialog elements.

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

    // Build messages array with system prompt first, then conversation history
    const conversationMessages = messages.filter(msg => msg.role !== 'system');
    const messagesForAI = [
        {
            role: 'system' as const,
            content: studyGuidePrompt
        },
        ...conversationMessages
    ];

    // Generate the study guide
    const result = await generateText({
        model: `${provider}/${userModel}`,
        messages: messagesForAI,
        temperature: 0.7,
    });

    // Save to database
    await db.update(threadsTable)
        .set({ generatedStudyGuide: result.text, updatedAt: new Date() })
        .where(eq(threadsTable.id, threadId));

    return result.text;
}
