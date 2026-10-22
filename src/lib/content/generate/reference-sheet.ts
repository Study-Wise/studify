import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import { generateText } from '@/lib/ai-service';
import config from '@/lib/ai.config';
import { buildContentSystemPrompt } from '@/lib/content';
import { parseThreadData, type UploadedFile } from '@/lib/threads';
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

export async function generateReferenceSheet(threadId: string, userPrompt?: string) {
    const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));

    if (threads.length === 0) throw new Error('Thread not found');

    const thread = threads[0];
    // Always use default model for content generation (more reliable)
    const userModel = config.model;
    const provider = config.provider;

    const threadData = parseThreadData(thread.thread);
    const messages = threadData?.messages ?? [];

    const uploadedFiles = thread.uploadedFiles ?? [];

    if (messages.length === 0) throw new Error('No messages found in thread');

    const uploadedFilesContext = buildUploadedFilesContext(uploadedFiles);

    const referenceSheetPrompt =
`${buildContentSystemPrompt('Reference Sheet', uploadedFilesContext)}

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

    const result = await generateText(
        referenceSheetPrompt,
        'Now generate the reference sheet based on the above conversation. Output ONLY the reference sheet content in markdown format. Do not include any explanations, commentary, or conversation - just the reference sheet.',
        messages,
        userModel,
        provider,
        {},
        config.contentGenerationExcludeTools,
    );

    if (!result.text || result.text.length === 0) {
        throw new Error('Generated reference sheet is empty');
    }

    await saveContent(threadId, 'reference-sheet', result.text);

    return result.text;
}
