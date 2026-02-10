import { generateText } from 'ai';
import config from '@/lib/config';
import { buildContentSystemPrompt } from '@/lib/content';
import categories from '@/lib/modes';
import desmosSection from '@/lib/prompt-templates/desmos';
import { db } from '@/db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '@/db/schema';
import type { ThreadData, UploadedFile } from '@/lib/types';

function buildUploadedFilesContext(uploadedFiles: UploadedFile[]): string {
    const filesWithText = uploadedFiles.filter(f => f.extractedText);
    if (filesWithText.length === 0) return '';

    const fileContents = filesWithText
        .map(f => `--- File: ${f.name} ---\n${f.extractedText}`)
        .join('\n\n');

    return `\n\n### Uploaded Files Content\nThe user has uploaded the following files. Include this content in your analysis:\n\n${fileContents}`;
}

export async function generateStudyGuide(threadId: string, _userEmail: string | null, userPrompt?: string) {
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
    const studyGuidePrompt = `${buildContentSystemPrompt('Study Guide', uploadedFilesContext)}
You should also not generate any if these things as well: 
    - Interactive Mock Quiz
   - Practice Problems
   - Quiz questions
   - Multiple choice questions
   - True/false questions
   - Fill in the blank
   - Any quiz or test content

OUTPUT FORMAT - Use ONLY these sections (you may omit irrelevant ones):

### Study Guide

#### Core Concepts Identified
(list main topics from the conversation)

#### Explanation: What is this about?
(brief, level-appropriate explanation)
${desmosContent}
#### Key Skills to Practice
(list skills - NOT practice problems or questions)

#### Vocabulary
(define 3-5 relevant terms)

#### Quick Tip / Common Pitfall
(one tip)

Math formatting: use \`$…$\` for inline math and \`$$…$$\` for block math.

REMEMBER: Output ONLY the Study Guide. No quizzes, no practice questions, no flashcards, no other content types.${userPrompt ? `\n\nADDITIONAL USER INSTRUCTIONS (follow these but do NOT include them in your output):\n${userPrompt}` : ''}`;

    // Build messages array with system prompt first, then conversation history
    const conversationMessages = messages.filter(msg => msg.role !== 'system');
    const messagesForAI = [
        {
            role: 'system' as const,
            content: studyGuidePrompt
        },
        ...conversationMessages,
        {
            role: 'user' as const,
            content: 'Now generate the study guide based on the above conversation. Output ONLY the study guide content in markdown format. Do not include any explanations, commentary, or conversation - just the study guide.'
        }
    ];

    // Generate the study guide
    const result = await generateText({
        model: `${provider}/${userModel}`,
        messages: messagesForAI,
        tools: {},
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
