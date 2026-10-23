import { nanoid } from 'nanoid';
import { db } from '@/db/initialize';
import { questionTable } from '@/db/schema';
import { generateText, paraphraseQuestion } from '@/lib/ai-service';
import config from '@/lib/ai.config';
import { questionToId } from '@/lib/question-utils';
import type { Message } from '@/lib/threads';
import { getUserErrorMessage } from '@/lib/user-errors';

import { eq } from 'drizzle-orm';

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
    const requestId = nanoid();
    const startTime = Date.now();

    try {
        const { question, category, mode } = await request.json();

        if (!question || !category || !mode) {
            console.error(`❌ [${requestId}] Missing required fields:`, { question: !!question, category: !!category, mode: !!mode });
            return new Response(
                JSON.stringify({ error: 'Missing required fields: question, category, mode' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        const paraphrasedQuestion = await paraphraseQuestion(question, category, mode);

        const questionId = questionToId(paraphrasedQuestion);

        const existingQuestions = await db.select().from(questionTable).where(eq(questionTable.id, questionId));

        if (existingQuestions.length > 0) {
            return new Response(
                JSON.stringify({
                    id: questionId,
                    question: existingQuestions[0].question,
                    answer: existingQuestions[0].answer,
                    category: existingQuestions[0].category,
                    mode: existingQuestions[0].mode,
                    exists: true
                }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        const systemPrompt = `You are an educational AI assistant specializing in ${category} - ${mode}.
Provide a comprehensive, well-structured answer to the following question.
Your answer should be:
- Clear and easy to understand
- Detailed and informative
- Formatted in Markdown
- Include examples where appropriate
- Suitable for students seeking help`;

        const convoHistory: Message[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: paraphrasedQuestion }
        ];

        const aiResult = await generateText(
            systemPrompt,
            paraphrasedQuestion,
            convoHistory,
            config.model,
            config.provider,
            {},
            undefined,
            5,
            requestId
        );

        const metadata = {
            generatedAt: new Date().toISOString(),
            modelUsed: config.model,
            providerUsed: config.provider
        };

        await db.insert(questionTable).values({
            id: questionId,
            question: paraphrasedQuestion,
            answer,
            category,
            mode,
            metadata,
            viewCount: '0',
            isPublic: true
        });

        return new Response(
            JSON.stringify({
                id: questionId,
                question: paraphrasedQuestion,
                answer,
                category,
                mode,
                exists: false
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        const totalDuration = Date.now() - startTime;
        console.error(`💥 [${requestId}] Error in question generation after ${totalDuration}ms:`, error);
        return new Response(
            JSON.stringify({ error: getUserErrorMessage(error, 'answer this question', requestId) }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};

export const prerender = false;
