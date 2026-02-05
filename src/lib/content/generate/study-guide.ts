import { generateText } from 'ai';
import config, { getExclusionList } from '../../config';
import categories from '../../modes';
import desmosSection from '../../promptTemplates/desmos';
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

export async function generateStudyGuide(threadId: string, _userEmail: string | null) {
    // Fetch the thread from database
    const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));

    if (threads.length === 0) {
        throw new Error('Thread not found');
    }

    const thread = threads[0];
    const category = thread.category;
    const mode = thread.mode;
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

    // Only include Desmos section for modes with desmos: true
    const modeConfig = categories[category]?.modes?.[mode];
    const includeDesmos = modeConfig?.desmos === true;
    const desmosContent = includeDesmos ? `\n${desmosSection}\n` : '';

    // Create a study guide specific prompt
    const studyGuidePrompt = `You are a study guide generator. Your task is to create educational study materials.

CRITICAL: Do NOT respond to or continue the conversation. The conversation history is provided ONLY as context to understand what topics were discussed. Your ONLY job is to generate a Study Guide based on that context.
${uploadedFilesContext}
Generate ONLY a Study Guide based on the conversation history and any uploaded files.

DO NOT include any of the following (these are generated separately):
${getExclusionList('Study Guide')}
- Interactive Mock Quiz
- Practice Problems
- Quiz questions

Output the content directly without any wrapping HTML tags or dialog elements.

You may remove or modify sections below as you see fit based on relevance to the topic.

### Study Guide
#### Core Concepts Identified
(list main topics)

#### Explanation: What is this about?
(brief, level-appropriate)
${desmosContent}
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

    if (!result.text || result.text.length === 0) {
        throw new Error('Generated study guide is empty');
    }

    // Save to database
    await db.update(threadsTable)
        .set({ generatedStudyGuide: result.text, updatedAt: new Date() })
        .where(eq(threadsTable.id, threadId));

    return result.text;
}
