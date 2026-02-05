import { generateText } from 'ai';
import categories from '../../modes';
import config from '../../config';
import { db } from '@/db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '@/db/schema';
import type { ThreadData } from '../../types';

export async function generateFlashcards(threadId: string, _userEmail: string | null) {
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

    // Create a flashcard specific prompt
    const flashcardPrompt = `${baseSystemPrompt}

IMPORTANT: Generate a comprehensive set of flashcards based on the conversation history. The flashcards should help the student review and memorize key concepts, formulas, definitions, and problem-solving techniques.

Output the content in the following format:

### Flashcards

Each flashcard should be formatted as:

#### [Card Number]. [Front of Card - Question/Prompt]

**Answer:**
[Back of Card - Answer/Explanation]

---

Guidelines:
- Create 10-15 flashcards covering the main topics discussed
- Questions should be clear and specific
- Answers should be concise but complete
- Include a mix of:
  - Definition cards (What is...?)
  - Concept cards (Explain...)
  - Formula cards (What is the formula for...?)
  - Application cards (When do you use...?)
  - Problem-solving cards (How do you solve...?)
- Use active recall techniques (questions that make students retrieve information)
- For math/science: include relevant formulas and their applications
- For other subjects: focus on key terms, concepts, and relationships

Math formatting: use \`$…$\` for displaying math formulas/equations inline and \`$$…$$\` for displaying them on their own; never use backticks for complex math.

Output should be clean markdown without any wrapping HTML tags or dialog elements.`;

    // Build messages array with system prompt first, then conversation history
    const conversationMessages = messages.filter(msg => msg.role !== 'system');
    const messagesForAI = [
        {
            role: 'system' as const,
            content: flashcardPrompt
        },
        ...conversationMessages
    ];

    // Generate the flashcards
    const result = await generateText({
        model: `${provider}/${userModel}`,
        messages: messagesForAI,
        temperature: 0.7,
    });

    // Save to database
    await db.update(threadsTable)
        .set({ generatedFlashcards: result.text, updatedAt: new Date() })
        .where(eq(threadsTable.id, threadId));

    return result.text;
}
