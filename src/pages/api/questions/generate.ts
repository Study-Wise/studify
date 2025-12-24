import type { APIRoute } from 'astro';
import { nanoid } from 'nanoid';
import { db } from '../../../db/initialize';
import { eq } from 'drizzle-orm';
import { questionsTable } from '../../../db/schema';
import { questionToId } from '../../../lib/question-utils';
import { generateAIResponse } from '../../../lib/ai-service';
import config from '../../../lib/config';

export const POST: APIRoute = async ({ request }) => {
    const requestId = nanoid();
    const startTime = Date.now();

    console.log(`🤔 [${requestId}] Starting question generation request`);

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

        console.log(`📝 [${requestId}] Question request:`, {
            questionLength: question.length,
            questionPreview: question.substring(0, 100),
            category,
            mode
        });

        // Generate ID from question
        const questionId = questionToId(question);
        console.log(`🆔 [${requestId}] Generated question ID:`, questionId);

        // Check if question already exists
        const existingQuestions = await db.select().from(questionsTable).where(eq(questionsTable.id, questionId));

        if (existingQuestions.length > 0) {
            console.log(`✅ [${requestId}] Question already exists, returning existing answer`);
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

        // Generate answer using AI
        console.log(`🤖 [${requestId}] Generating AI answer for question`);
        const systemPrompt = `You are an educational AI assistant specializing in ${category} - ${mode}.
Provide a comprehensive, well-structured answer to the following question.
Your answer should be:
- Clear and easy to understand
- Detailed and informative
- Formatted in Markdown
- Include examples where appropriate
- Suitable for students seeking help

Question: ${question}`;

        const convoHistory = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question }
        ];

        const answer = await generateAIResponse({
            systemPrompt,
            userPrompt: question,
            convoHistory,
            userModel: config.model,
            provider: config.provider as string,
            tools: {},
            maxSteps: 5,
            requestId
        });

        console.log(`✅ [${requestId}] AI answer generated:`, {
            answerLength: answer.length,
            answerPreview: answer.substring(0, 100) + '...'
        });

        // Save to database
        const metadata = {
            generatedAt: new Date().toISOString(),
            modelUsed: config.model,
            providerUsed: config.provider
        };

        await db.insert(questionsTable).values({
            id: questionId,
            question,
            answer,
            category,
            mode,
            metadata,
            viewCount: '0',
            isPublic: true
        });

        console.log(`💾 [${requestId}] Question saved to database`);

        const totalDuration = Date.now() - startTime;
        console.log(`🎉 [${requestId}] Question generation completed in ${totalDuration}ms`);

        return new Response(
            JSON.stringify({
                id: questionId,
                question,
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
