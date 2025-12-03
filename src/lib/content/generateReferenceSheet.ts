import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getMessages } from '../threads';
import categories from '../modes';
import config from '../config';

export async function generateReferenceSheet(threadId: string, userEmail: string | null, category: string, mode: string) {
    // Get conversation history
    const messages = await getMessages(threadId, userEmail);

    if (messages.length === 0) {
        throw new Error('No messages found in thread');
    }

    // Get the mode object for the thread's category and mode
    const modeObj = categories[category]?.modes?.[mode];

    // Get the base system prompt
    const baseSystemPrompt = modeObj?.prompt ? await modeObj.prompt : config.systemPrompt;

    // Create a reference sheet specific prompt
    const referenceSheetPrompt = `${baseSystemPrompt}

IMPORTANT: Generate ONLY a Reference Sheet based on the conversation history. Do NOT include a Study Guide section.

Output the content directly without any wrapping HTML tags or dialog elements.

### Reference Sheet
#### Formulas & Theorems
(list with \`$…$\`/\`$$…$$\`, explain variables)

#### Key Definitions
(2-3 concise definitions)

#### Important Concepts
(brief summary of key concepts)

Math formatting: use \`$…$\` for displaying math formulas/equations inline and \`$$…$$\` for displaying them on their own; never use backticks for complex math.`;

    // Build messages array with system prompt first, then conversation history
    const conversationMessages = messages.filter(msg => msg.role !== 'system');
    const messagesForAI = [
        {
            role: 'system' as const,
            content: referenceSheetPrompt
        },
        ...conversationMessages
    ];

    // Generate the reference sheet
    const result = await generateText({
        model: openai(config.model),
        messages: messagesForAI,
        temperature: 0.7,
    });

    return result.text;
}
