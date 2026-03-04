import config from '@/lib/config';
import { generateAIResponse } from '@/lib/ai-service';
import { buildContentSystemPrompt } from '@/lib/content';
import { db } from '@/db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '@/db/schema';
import type { ThreadData, UploadedFile } from '@/lib/threads';
import { saveContent } from '../latest';

function buildUploadedFilesContext(uploadedFiles: UploadedFile[]): string {
    const filesWithText = uploadedFiles.filter(f => f.extractedText);
    if (filesWithText.length === 0) return '';

    const fileContents = filesWithText
        .map(f => `--- File: ${f.name} ---\n${f.extractedText}`)
        .join('\n\n');

    return `\n\n### Uploaded Files Content\nThe user has uploaded the following files. Include this content in your analysis:\n\n${fileContents}`;
}

export async function generateReferenceSheet(threadId: string, userPrompt?: string) {
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
    const referenceSheetPrompt = `${buildContentSystemPrompt('Reference Sheet', uploadedFilesContext)}

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

    const conversationMessages = messages.filter(msg => msg.role !== 'system');

    // Generate the reference sheet
    const result = await generateAIResponse({
        systemPrompt: referenceSheetPrompt,
        userPrompt: 'Now generate the reference sheet based on the above conversation. Output ONLY the reference sheet content in markdown format. Do not include any explanations, commentary, or conversation - just the reference sheet.',
        convoHistory: [...conversationMessages],
        userModel,
        provider,
        excludeTools: ['get-content', 'get-content-types', 'open-content'],
    });

    if (!result.text || result.text.length === 0) {
        throw new Error('Generated reference sheet is empty');
    }

    // Save to database
    await saveContent(threadId, 'reference-sheet', result.text);

    return result.text;
}
