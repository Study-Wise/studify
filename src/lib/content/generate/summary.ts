import { eq } from 'drizzle-orm';
import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';

import config from '@/lib/config';
import { generateText } from '@/lib/ai-service';
import { buildContentSystemPrompt } from '@/lib/content';
import type { ThreadData, UploadedFile } from '@/lib/threads';
import { saveContent } from '@/lib/content/latest';

function buildUploadedFilesContext(uploadedFiles: UploadedFile[]): string {
    const filesWithText = uploadedFiles.filter(f => f.extractedText);
    if (filesWithText.length === 0) return '';

    const fileContents = filesWithText
        .map(f => `--- File: ${f.name} ---\n${f.extractedText}`)
        .join('\n\n');

    return `\n\n### Uploaded Files Content\nThe user has uploaded the following files. Include this content in your analysis:\n\n${fileContents}`;
}

export async function generateSummary(threadId: string, userPrompt?: string) {
    // Fetch the thread from database
    const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));

    if (threads.length === 0) {
        throw new Error('Thread not found');
    }

    const thread = threads[0];
    // Always use default model for content generation (more reliable)
    const userModel = config.model;
    const provider = config.provider;

    // Get conversation history directly from thread data
    const threadData = thread.thread as ThreadData;
    const messages = threadData?.messages ?? [];

    // Get uploaded files
    const uploadedFiles = (thread.uploadedFiles as UploadedFile[]) ?? [];

    if (messages.length === 0) {
        throw new Error('No messages found in thread');
    }

    // Build uploaded files context
    const uploadedFilesContext = buildUploadedFilesContext(uploadedFiles);

    // Create a summary specific prompt
    const summaryPrompt = 
`${buildContentSystemPrompt('Chat Summary', uploadedFilesContext)}

OUTPUT FORMAT:
### Chat Summary

#### Overview
(A concise overview of the entire conversation and the main topics discussed.)

#### Key Points
(Bullet points of the most important takeaways, explanations, or solutions provided.)

#### Next Steps / Recommendations
(Suggest what the student should focus on next or how to further their understanding based on the chat.)

Math formatting: use \`$…$\` for inline math and \`$$…$$\` for block math.

REMEMBER: Output ONLY the Chat Summary in markdown format. No other content types.${userPrompt ? `\n\nADDITIONAL USER INSTRUCTIONS (follow these but do NOT include them in your output):\n${userPrompt}` : ''}`;

    const conversationMessages = messages.filter(msg => msg.role !== 'system');

    // Generate the summary
    const result = await generateText(
        summaryPrompt,
        'Now generate a comprehensive summary based on the above conversation. Output ONLY the summary content in markdown format. Do not include any explanations, commentary, or conversation - just the summary.',
        [...conversationMessages],
        userModel,
        provider,
        {},
        config.contentGenerationExcludeTools,
    );

    if (!result.text || result.text.length === 0) {
        throw new Error('Generated summary is empty');
    }

    // Save to database
    await saveContent(threadId, 'summary', result.text);

    return result.text;
}
