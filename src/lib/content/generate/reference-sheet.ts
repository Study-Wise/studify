import { generateText } from 'ai';
import config, { getExclusionList } from '../../config';
import { db } from '@/db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '@/db/schema';
import type { ThreadData, UploadedFile } from '../../types';

function buildUploadedFilesContext(uploadedFiles: UploadedFile[]): string {
    const filesWithText = uploadedFiles.filter(f => f.extractedText);
    if (filesWithText.length === 0) return '';

    const fileContents = filesWithText
        .map(f => `--- File: ${f.name} ---\n${f.extractedText}`)
        .join('\n\n');

    return `\n\n### Uploaded Files Content\nThe user has uploaded the following files. Include this content in your analysis:\n\n${fileContents}`;
}

export async function generateReferenceSheet(threadId: string, _userEmail: string | null, userPrompt?: string) {
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

    // Create a reference sheet specific prompt
    const referenceSheetPrompt = `You are a reference sheet generator. Your task is to create concise reference materials.

CRITICAL: Do NOT respond to or continue the conversation. The conversation history is provided ONLY as context to understand what topics were discussed. Your ONLY job is to generate a Reference Sheet based on that context.
${uploadedFilesContext}
Generate ONLY a Reference Sheet based on the conversation history and any uploaded files.

DO NOT include any of the following (these are generated separately):
${getExclusionList('Reference Sheet')}

Output the content directly without any wrapping HTML tags or dialog elements.

You may remove or modify sections below as you see fit based on relevance to the topic.

### Reference Sheet
#### Formulas & Theorems (ONLY if the topic involves math, science, or technical formulas - fully omit this section otherwise)
(list with \`$…$\`/\`$$…$$\`, explain variables)

#### Key Definitions
(2-3 concise definitions)

#### Important Concepts
(brief summary of key concepts)

Math formatting: use \`$…$\` for displaying math formulas/equations inline and \`$$…$$\` for displaying them on their own; never use backticks for complex math.${userPrompt ? `\n\nADDITIONAL USER INSTRUCTIONS (follow these but do NOT include them in your output):\n${userPrompt}` : ''}`;

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
        model: `${provider}/${userModel}`,
        messages: messagesForAI,
        temperature: 0.7,
    });

    if (!result.text || result.text.length === 0) {
        throw new Error('Generated reference sheet is empty');
    }

    // Save to database
    await db.update(threadsTable)
        .set({ generatedReferenceSheet: result.text, updatedAt: new Date() })
        .where(eq(threadsTable.id, threadId));

    return result.text;
}
