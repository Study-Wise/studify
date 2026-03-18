import { eq } from 'drizzle-orm';
import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';

import config from '@/lib/config';
import { generateText } from '@/lib/ai-service';
import { buildContentSystemPrompt } from '@/lib/content';
import categories from '@/lib/modes';
import desmosSection from '@/lib/prompt-templates/desmos';
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

export async function generateStudyGuide(threadId: string, userPrompt?: string) {
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
    const studyGuidePrompt = 
`${buildContentSystemPrompt('Study Guide', uploadedFilesContext)}
You should also not generate any if these things as well: 
    - Interactive Mock Quiz
   - Practice Problems
   - Quiz questions
   - Multiple choice questions
   - True/false questions
   - Fill in the blank
   - Any quiz or test content

Generate a DETAILED and COMPREHENSIVE study guide. Be thorough — cover every major topic and subtopic discussed in the conversation. Do not summarize briefly; expand on each concept with clear explanations, examples, and connections between ideas.

OUTPUT FORMAT - Use ONLY these sections (you may omit irrelevant relevant sections):

### Study Guide

#### Core Concepts Identified
(list ALL main topics and subtopics from the conversation — be exhaustive)

#### Detailed Explanations
(for EACH core concept, provide a thorough explanation with examples, context, and why it matters — this should be the longest section)
${desmosContent}
#### Key Relationships & Connections
(explain how the concepts relate to each other, cause-and-effect chains, and broader themes)

#### Key Skills to Practice
(list specific skills with brief guidance on how to practice each one — NOT practice problems or questions)

#### Real-World Applications & Examples
(provide concrete examples and real-world scenarios where these concepts apply)

#### Common Misconceptions & Pitfalls
(list multiple common mistakes and how to avoid them)

#### Historical Context & Background
(if applicable, provide relevant historical context, key figures, or origin of the concepts)

#### Comparison & Contrast
(if applicable, compare and contrast similar or related concepts to clarify distinctions)

Math formatting: use \`$…$\` for inline math and \`$$…$$\` for block math.

REMEMBER: Output ONLY the Study Guide. No quizzes, no practice questions, no flashcards, no other content types. Be DETAILED and THOROUGH — a student should be able to study for an exam using only this guide.${userPrompt ? `\n\nADDITIONAL USER INSTRUCTIONS (follow these but do NOT include them in your output):\n${userPrompt}` : ''}`;


    // Generate the study guide
    const result = await generateText(
        studyGuidePrompt,
        'Now generate the study guide based on the above conversation. Output ONLY the study guide content in markdown format. Do not include any explanations, commentary, or conversation - just the study guide.',
        messages,
        userModel,
        provider,
        {},
        config.contentGenerationExcludeTools,
    );

    if (!result.text || result.text.length === 0) {
        throw new Error('Generated study guide is empty');
    }

    // Save to database
    await saveContent(threadId, 'study-guide', result.text);

    return result.text;
}
