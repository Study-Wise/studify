import { generateText } from 'ai';
import { getMessages } from '../threads';
import categories from '../modes';
import config from '../config';
import { db } from '../../db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '../../db/schema';

export async function generateWebpage(threadId: string, userEmail: string | null) {
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

    // Get conversation history
    const messages = await getMessages(threadId, userEmail);

    if (messages.length === 0) {
        throw new Error('No messages found in thread');
    }

    // Get the mode object for the thread's category and mode
    const modeObj = categories[category]?.modes?.[mode];

    // Get the base system prompt
    const baseSystemPrompt = modeObj?.prompt ? await modeObj.prompt : config.systemPrompt;

    // Create a webpage specific prompt
    const webpagePrompt = `${baseSystemPrompt}

IMPORTANT: Generate a complete, interactive webpage based on the conversation history. This should be a comprehensive resource that presents the concepts discussed in an engaging, visual format.

Output the content as complete HTML (including <!DOCTYPE html>, <html>, <head>, and <body> tags) with embedded CSS and JavaScript. Make it visually appealing and interactive.

Requirements:
1. Include a proper HTML structure with meta tags, viewport settings, and a descriptive title
2. Use modern, responsive CSS with a clean, professional design
3. Include interactive elements where appropriate (collapsible sections, animations, etc.)
4. Use proper semantic HTML (header, main, section, article, etc.)
5. Include all the key concepts, formulas, and examples from the conversation
6. Make it mobile-friendly and accessible
7. Use a cohesive color scheme that's easy on the eyes
8. Include smooth transitions and hover effects for better UX

Content to include:
- A clear title and introduction
- Main concepts with explanations
- Visual representations of formulas (use proper mathematical notation)
- Example problems with solutions
- Interactive elements (like expandable sections for step-by-step solutions)
- Summary or key takeaways section

Math formatting: Use MathJax or KaTeX (include the CDN) to render mathematical formulas properly. Use \\(...\\) for inline math and \\[...\\] for display math.

Make it engaging, educational, and visually appealing!`;

    // Build messages array with system prompt first, then conversation history
    const conversationMessages = messages.filter(msg => msg.role !== 'system');
    const messagesForAI = [
        {
            role: 'system' as const,
            content: webpagePrompt
        },
        ...conversationMessages
    ];

    // Generate the webpage
    const result = await generateText({
        model: `${provider}/${userModel}`,
        messages: messagesForAI,
        temperature: 0.7,
    });

    return result.text;
}
