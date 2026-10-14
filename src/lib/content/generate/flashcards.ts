import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import { generateObject } from '@/lib/ai-service';
import config from '@/lib/config';
import { buildContentSystemPrompt } from '@/lib/content';
import { saveContent } from '@/lib/content/latest';
import type { FlashcardData } from '@/lib/content/latest/flashcards';
import { parseThreadData, type UploadedFile } from '@/lib/threads';
import { z } from 'zod';

import { eq } from 'drizzle-orm';

const flashcardSchema = z.object({
    text: z.string().describe('A brief markdown summary/introduction about the flashcards topic'),
    questions: z.array(z.object({
        front: z.string().describe('The question or prompt on the front of the flashcard'),
        back: z.string().describe('The answer or explanation on the back of the flashcard'),
    })).describe('Array of flashcards with front (question) and back (answer)')
});

function buildUploadedFilesContext(uploadedFiles: UploadedFile[]): string {
    const filesWithText = uploadedFiles.filter(f => f.extractedText);
    if (filesWithText.length === 0) return '';

    const fileContents = filesWithText
        .map(f => `--- File: ${f.name} ---\n${f.extractedText}`)
        .join('\n\n');

    return `\n\n### Uploaded Files Content\nThe user has uploaded the following files. Include this content in your analysis:\n\n${fileContents}`;
}

export async function generateFlashcards(threadId: string, userPrompt?: string): Promise<FlashcardData> {
    const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));

    if (threads.length === 0) {
        throw new Error('Thread not found');
    }

    const thread = threads[0];
    // Always use default model for content generation (more reliable)
    const userModel = config.model;
    const provider = config.provider;

    const threadData = parseThreadData(thread.thread);
    const messages = threadData?.messages ?? [];

    const uploadedFiles = thread.uploadedFiles ?? [];

    if (messages.length === 0) {
        throw new Error('No messages found in thread');
    }

    const uploadedFilesContext = buildUploadedFilesContext(uploadedFiles);

    const flashcardPrompt = `${buildContentSystemPrompt('Flashcards', uploadedFilesContext)}

The flashcards should help the student review and memorize key concepts, formulas, definitions, and problem-solving techniques.

You must return:
1. A "text" field with a brief markdown introduction/summary about what these flashcards cover (2-3 sentences)
2. A "questions" array with 10-15 flashcards

Guidelines for questions:
- Questions should be clear and specific
- Answers should be concise but complete
- Include a mix of:
    - Definition cards (What is...?)
    - Concept cards (Explain...)
    - Formula cards (What is the formula for...?)
    - Application cards (When do you use...?)
    - Problem-solving cards (How do you solve...?)
- Use active recall techniques (questions that make students retrieve information)
- For math/science: include relevant formulas and their applications
- For other subjects: focus on key terms, concepts, and relationships

Math formatting: use $…$ for displaying math formulas/equations inline and $$…$$ for displaying them on their own.${userPrompt ? `\n\nADDITIONAL USER INSTRUCTIONS (follow these but do NOT include them in your output):\n${userPrompt}` : ''}`;

    const generated = await generateObject(
        flashcardPrompt,
        'Now generate the flashcards based on the above conversation. Return ONLY the structured flashcard data with the text summary and questions array. Do not include any explanations or commentary.',
        messages,
        userModel,
        provider,
        flashcardSchema,
    );

    if (!generated.questions || generated.questions.length === 0) {
        throw new Error('Generated flashcards are empty');
    }

    const flashcardData: FlashcardData = {
        text: generated.text,
        questions: generated.questions
    };

    await saveContent(threadId, 'flashcards', flashcardData);

    return flashcardData;
}
