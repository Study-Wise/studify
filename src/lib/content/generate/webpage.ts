import type { GatewayProviderOptions } from '@ai-sdk/gateway';
import { generateText, stepCountIs } from 'ai';
import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import config from '@/lib/config';
import { buildContentSystemPrompt } from '@/lib/content';
import { parseThreadData, type Message, type UploadedFile } from '@/lib/threads';
import { modules } from '@/lib/tools';
import { saveContent } from '@/lib/content/latest';

import { eq } from 'drizzle-orm';

function buildUploadedFilesContext(uploadedFiles: UploadedFile[]): string {
    const filesWithText = uploadedFiles.filter(f => f.extractedText);
    if (filesWithText.length === 0) return '';

    const fileContents = filesWithText
        .map(f => `--- File: ${f.name} ---\n${f.extractedText}`)
        .join('\n\n');

    return `\n\n### Uploaded Files Content\nThe user has uploaded the following files. Include this content in your analysis:\n\n${fileContents}`;
}

export async function generateWebpage(threadId: string, userPrompt?: string) {
    const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));

    if (threads.length === 0) {
        throw new Error('Thread not found');
    }

    const thread = threads[0];

    const threadData = parseThreadData(thread.thread);
    const messages = threadData?.messages ?? [];

    const uploadedFiles = thread.uploadedFiles ?? [];

    if (messages.length === 0) {
        throw new Error('No messages found in thread');
    }

    const uploadedFilesContext = buildUploadedFilesContext(uploadedFiles);

    const webpagePrompt =
`${buildContentSystemPrompt('Webpage', uploadedFilesContext)}

This should be a comprehensive resource that presents the concepts discussed in an engaging, visual format.

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

Make it engaging, educational, and visually appealing!

You may remove or modify sections as you see fit based on relevance to the topic.

ONLY INCLUDE THE HTML CONTENT IN YOUR RESPONSE. DO NOT RESPOND WITH ANYTHING ELSE BEFORE OR AFTER THE HTML.${userPrompt ? `\n\nADDITIONAL USER INSTRUCTIONS (follow these but do NOT include them in your output):\n${userPrompt}` : ''}`;

    const conversationMessages = messages.filter(msg => msg.role !== 'system' && msg.content !== '');
    const messagesForAI: Message[] = [
        {
            role: 'system',
            content: webpagePrompt
        },
        ...conversationMessages,
        {
            role: 'user',
            content: 'Now generate the webpage based on the above conversation. Output ONLY the complete HTML document starting with <!DOCTYPE html>. Do not include any explanations, commentary, or conversation - just the HTML content.'
        }
    ];

    // Generate the webpage using Vercel's v0 model (optimized for HTML generation)
    const excludeTools = config.contentGenerationExcludeTools;
    const result = await generateText({
        model: 'anthropic/claude-haiku-4.5',
        messages: messagesForAI,
        tools: Object.fromEntries(
            Object.entries(modules).filter(([key]) => !excludeTools.includes(key))
        ),
        stopWhen: stepCountIs(5),
        temperature: 0.7,
        providerOptions: {
            gateway: {
                models: ['openai/gpt-5.3-codex'],
            } satisfies GatewayProviderOptions
        }
    });

    if (!result.text || result.text.length === 0) {
        throw new Error('Generated webpage is empty');
    }

    // Strip away any text before and after the HTML
    const text = result.text;
    const htmlStart = text.indexOf('<!DOCTYPE html>');
    const htmlEnd = text.lastIndexOf('</html>');

    const content = (htmlStart !== -1 && htmlEnd !== -1)
        ? text.substring(htmlStart, htmlEnd + 7) // +7 for '</html>' length
        : text;

    await saveContent(threadId, 'webpage', content);

    return content;
}
