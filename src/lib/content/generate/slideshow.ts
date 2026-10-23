import cheerio from 'cheerio';
import CryptoJS from 'crypto-js';
import fm from 'front-matter';
import lodash from 'lodash';
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import { generateText } from '@/lib/ai-service';
import config from '@/lib/ai.config';
import { buildContentSystemPrompt } from '@/lib/content';
import { parseThreadData, type UploadedFile, type JSONValue } from '@/lib/threads';
import { saveContent } from '@/lib/content/latest';
import { buildUploadedFilesContext } from '@/lib/content/generate/uploaded-files-context';

import { eq } from 'drizzle-orm';

import highlight from 'highlight.js';

export interface MarkedToken {
    type: string;
    [key: string]: string | number | boolean | undefined | object | JSONValue;
}

// Use createRequire for certain ones only - project has marked v15 but slideshow-generator needs v0.3
const node_require = createRequire(import.meta.url);
const marked = node_require('slideshow-generator/node_modules/marked');
const jade = node_require('jade');

export async function generateSlideshow(threadId: string, userPrompt?: string) {
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

    // Create a slideshow specific prompt - uses standard markdown with headings as slide separators
    const slideshowPrompt =
`${buildContentSystemPrompt('Slideshow', uploadedFilesContext)}

OUTPUT FORMAT - Markdown Slideshow:

Your output MUST be standard markdown where each heading (# or ##) starts a new slide.

1. **Slide structure guidelines:**
   - First heading: Title slide with the main topic
   - Each subsequent heading starts a new slide
   - Keep each slide focused on ONE key concept
   - Use concise bullet points (not paragraphs)
   - Use code blocks with syntax highlighting for any code examples
   - Final slide: Summary or key takeaways

2. **Content guidelines:**
   - Create 6-12 slides covering the key topics from the conversation
   - Each slide MUST start with a heading (# or ##)
   - Use bullet points and short text under each heading
   - Include relevant examples or code snippets where helpful
   - Keep text minimal - slides should be visual aids, not essays

3. **Do NOT use:**
   - External image URLs
   - HTML tags
   - Framework-specific syntax (Vue, React, Svelte, etc.)

REMEMBER: Output ONLY the markdown content. No quizzes, no practice questions, no flashcards, no other content types.${userPrompt ? `\n\nADDITIONAL USER INSTRUCTIONS (follow these but do NOT include them in your output):\n${userPrompt}` : ''}`;

    const result = await generateText(
        slideshowPrompt,
        'Now generate the markdown slideshow based on the above conversation. Output ONLY the raw markdown. Do not include any explanations, commentary, or conversation - just the slideshow markdown content.',
        messages,
        userModel,
        provider,
        {},
        config.contentGenerationExcludeTools,
    );

    if (!result.text || result.text.length === 0) throw new Error('Generated slideshow is empty');

    const html = markdownToSlideshowHTML(result.text);

    const slideshowData = { content: result.text, html };

    await saveContent(threadId, 'slideshow', slideshowData);

    return slideshowData;
}
