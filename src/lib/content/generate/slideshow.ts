import { createRequire } from 'module';
import { dirname, join } from 'path';

import jade from 'jade';
import fm from 'front-matter';
import cheerio from 'cheerio';
import highlight from 'highlight.js';
import CryptoJS from 'crypto-js';
import _ from 'lodash';

import config from '@/lib/config';
import { generateAIResponse } from '@/lib/ai-service';
import { buildContentSystemPrompt } from '@/lib/content';

import { db } from '@/db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '@/db/schema';
import type { ThreadData, UploadedFile } from '@/lib/types';

// Use createRequire for marked only - project has marked v15 but slideshow-generator needs v0.3
const require_ = createRequire(import.meta.url);
const oldMarked = require_('slideshow-generator/node_modules/marked');

function buildUploadedFilesContext(uploadedFiles: UploadedFile[]): string {
    const filesWithText = uploadedFiles.filter(f => f.extractedText);
    if (filesWithText.length === 0) return '';

    const fileContents = filesWithText
        .map(f => `--- File: ${f.name} ---\n${f.extractedText}`)
        .join('\n\n');

    return `\n\n### Uploaded Files Content\nThe user has uploaded the following files. Include this content in your analysis:\n\n${fileContents}`;
}

function markdownToSlideshowHTML(markdown: string): string {
    const content = fm(markdown);
    const tokens = oldMarked.lexer(content.body, {
        gfm: true, tables: true, breaks: true,
        pedantic: true, sanitize: true, smartLists: true, smartypants: true
    });

    let title: string | undefined;
    const pages: { tokens?: any[]; html?: string }[] = [];

    tokens.forEach((token: any) => {
        if (token.type === 'heading' || pages.length === 0) {
            pages.push({ tokens: [] });
        }
        if (!title) {
            const t: any = [token]; t.links = {};
            const h = oldMarked.parser(t);
            const $ = cheerio.load(h);
            title = $('*').text();
        }
        pages[pages.length - 1].tokens!.push(token);
    });

    pages.forEach((page) => {
        const renderer = new oldMarked.Renderer();
        renderer.heading = (text: string, level: number) => `<h${level}>${text}</h${level}>`;
        const pt: any = _.cloneDeep(page.tokens);
        pt.links = {};
        page.html = oldMarked.parser(pt, {
            renderer,
            highlight: (code: string) => highlight.highlightAuto(code).value
        });
        delete page.tokens;
    });

    const data = { attributes: content.attributes, title, pages };
    const jadePath = join(dirname(require_.resolve('slideshow-generator/package.json')), 'src', 'index.jade');
    const fn = jade.compileFile(jadePath);
    const jsonContent = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonContent, '-').toString();

    return fn({ data: encrypted, process });
}

export async function generateSlideshow(threadId: string, _userEmail: string | null, userPrompt?: string) {
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

    // Create a slideshow specific prompt - uses standard markdown with headings as slide separators
    const slideshowPrompt = `${buildContentSystemPrompt('Slideshow', uploadedFilesContext)}

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

    const conversationMessages = messages.filter(msg => msg.role !== 'system');

    // Generate the slideshow markdown
    const result = await generateAIResponse({
        systemPrompt: slideshowPrompt,
        userPrompt: 'Now generate the markdown slideshow based on the above conversation. Output ONLY the raw markdown. Do not include any explanations, commentary, or conversation - just the slideshow markdown content.',
        convoHistory: [...conversationMessages],
        userModel,
        provider,
        excludeTools: ['get-content', 'get-content-types', 'open-content'],
    });

    if (!result.text || result.text.length === 0) {
        throw new Error('Generated slideshow is empty');
    }

    // Convert markdown to self-contained HTML slideshow
    const html = markdownToSlideshowHTML(result.text);

    // Save to database with both markdown content and generated HTML
    await db.update(threadsTable)
        .set({ generatedSlideshow: { content: result.text, html }, updatedAt: new Date() })
        .where(eq(threadsTable.id, threadId));

    return { content: result.text, html };
}
