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

export async function generateSlideshow(threadId: string, _userEmail: string | null, userPrompt?: string) {
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

    // Create a slideshow specific prompt
    const slideshowPrompt = `You are a slideshow generator. Generate ONLY a Slidev-format markdown slideshow - nothing else.
${uploadedFilesContext}

STRICT RULES - FOLLOW EXACTLY:
1. Generate ONLY Slidev-format markdown for the slideshow
2. Use BOTH the conversation history AND any uploaded files content (if any) provided above as source material for the slides, unless the user's additional instructions say otherwise
3. Do NOT respond to or continue any conversation
4. Do NOT generate ANY of the following content types (they are generated separately by other systems):
${getExclusionList('Slideshow')}

OUTPUT FORMAT - Slidev Markdown:

Your output MUST be valid Slidev markdown with:

1. **Frontmatter** at the very beginning:
\`\`\`
---
theme: default
title: [Topic Title]
transition: slide-left
mdc: true
---
\`\`\`

2. **Slides separated by \`---\`** (three dashes on their own line)

3. **Slide structure guidelines:**
   - First slide: Title slide with the main topic and a brief subtitle
   - Content slides: Use clear headings (#, ##), bullet points, and concise text
   - Use layouts where appropriate (e.g., \`layout: two-cols\`, \`layout: center\`, \`layout: image-right\`)
   - Keep each slide focused on ONE key concept
   - Use code blocks with syntax highlighting for any code examples
   - Use bullet points with \`v-click\` for progressive reveal where it aids understanding
   - Final slide: Summary or key takeaways

4. **Content guidelines:**
   - Create 6-12 slides covering the key topics from the conversation
   - Each slide should have a clear heading
   - Use concise bullet points (not paragraphs)
   - Include relevant examples, diagrams (mermaid), or code snippets where helpful
   - Use $...$ for inline math and $$...$$ for block math where appropriate
   - Keep text minimal - slides should be visual aids, not essays

5. **Do NOT use:**
   - Vue components like <Counter>, <Tweet>, <Youtube>
   - External image URLs
   - Monaco editor blocks
   - Draggable elements
   - External file imports (<<< @/...)

Math formatting: use \`$…$\` for inline math and \`$$…$$\` for block math.

REMEMBER: Output ONLY the Slidev markdown. No quizzes, no practice questions, no flashcards, no other content types.${userPrompt ? `\n\nADDITIONAL USER INSTRUCTIONS (follow these but do NOT include them in your output):\n${userPrompt}` : ''}`;

    // Build messages array with system prompt first, then conversation history
    const conversationMessages = messages.filter(msg => msg.role !== 'system');
    const messagesForAI = [
        {
            role: 'system' as const,
            content: slideshowPrompt
        },
        ...conversationMessages
    ];

    // Generate the slideshow
    const result = await generateText({
        model: `${provider}/${userModel}`,
        messages: messagesForAI,
        temperature: 0.7,
    });

    if (!result.text || result.text.length === 0) {
        throw new Error('Generated slideshow is empty');
    }

    // Save to database as JSONB object with content key and needsGeneration flag
    await db.update(threadsTable)
        .set({ generatedSlideshow: { content: result.text, needsGeneration: true }, updatedAt: new Date() })
        .where(eq(threadsTable.id, threadId));

    return result.text;
}
