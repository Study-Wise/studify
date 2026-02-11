import type { APIRoute } from 'astro';
import { nanoid } from 'nanoid';
import { db } from '@/db/initialize';
import { eq } from 'drizzle-orm';
import { questionTable } from '@/db/schema';
import { questionToId } from '@/lib/question-utils';
import { generateAIResponse, paraphraseQuestion } from '@/lib/ai-service';
import config from '@/lib/config';

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

        // Paraphrase the question to make it clearer and more concise
        const paraphrasedQuestion = await paraphraseQuestion(question, category, mode);

        // Generate ID from paraphrased question
        const questionId = questionToId(paraphrasedQuestion);

        // Check if question already exists
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

        // Generate answer using AI with paraphrased question
        const systemPrompt = `You are an educational AI assistant specializing in ${category} - ${mode}.
Provide a comprehensive, well-structured answer to the following question.
Your answer should be:
- Clear and easy to understand
- Detailed and informative
- Formatted in Markdown
- Include examples where appropriate
- Suitable for students seeking help`;

        const convoHistory = [
            { role: 'system' as const, content: systemPrompt },
            { role: 'user' as const, content: paraphrasedQuestion }
        ];

        const aiResult = await generateAIResponse({
            systemPrompt,
            userPrompt: paraphrasedQuestion,
            convoHistory,
            userModel: config.model,
            provider: config.provider,
            tools: {},
            maxSteps: 5,
            requestId
        });
        const answer = aiResult.text;

        // Save to database
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
            JSON.stringify({ error: `Failed to generate question: ${error}` }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};

export const prerender = false;
