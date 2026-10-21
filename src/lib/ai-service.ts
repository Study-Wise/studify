import * as ai from 'ai';
import { stepCountIs } from 'ai';
import config from '@/lib/config';
import { providers } from '@/lib/models';
import type { Message, ToolCallLogEntry } from '@/lib/threads';
import type { ToolContext, ToolRecord } from '@/lib/tools';
import { VendorError } from '@/lib/user-errors';
import 'dotenv/config';
import { nanoid } from 'nanoid';
import type { ZodSchema } from 'zod';

// Client-side tool call that needs to be executed in the browser
export interface ClientToolCall {
    toolName: string;
    toolCallId: string;
    args: Record<string, string | number | boolean | undefined>;
}

// AI generation result with potential client-side tool calls
export interface AIGenerationResult {
    text: string;
    clientToolCalls: ClientToolCall[];
    toolCallLog: ToolCallLogEntry[];
}

export interface TitleGenerationOptions {
    convoHistory: Message[];
    userModel: string;
    provider: string;
}

// Generates AI response for a conversation
export async function generateText(
    systemPrompt: string,
    userPrompt: string,
    convoHistory: Message[],
    userModel: string,
    provider: string,
    tools: ToolRecord = {},
    excludeTools?: string[],
    maxSteps: number = 25,
    requestId: string = nanoid(),
    toolContext?: ToolContext
): Promise<AIGenerationResult> {

    const resolvedTools = excludeTools
        ? Object.fromEntries(
            Object.entries(tools).filter(([key]) => !excludeTools.includes(key))
        )
        : tools;

    convoHistory = convoHistory.filter(msg => msg.role !== 'system' && msg.content !== '');

    if (convoHistory[0]?.role !== 'system') {
        convoHistory.unshift({
            role: 'system',
            content: systemPrompt
        });
    }

    const lastMessage = convoHistory[convoHistory.length - 1];
    if (lastMessage?.role !== 'user' || lastMessage?.content !== userPrompt) {
        convoHistory.push({
            role: 'user',
            content: userPrompt
        });
    }

    const aiModel = `${provider}/${userModel}`;

    const aiStartTime = Date.now();
    console.log(`[${requestId}] AI request: model=${aiModel}, messages=${convoHistory.length}, tools=${Object.keys(resolvedTools).length}`);

    try {
        const result = await ai.generateText({
            model: aiModel,
            messages: convoHistory,
            tools: resolvedTools,
            stopWhen: stepCountIs(maxSteps),
            experimental_context: toolContext,
        });

        console.log(`[${requestId}] AI response received in ${Date.now() - aiStartTime}ms`);

        const clientToolCalls: ClientToolCall[] = [];
        const toolCallLog: ToolCallLogEntry[] = [];

        if (result.steps && result.steps.length > 0) {
            for (const step of result.steps) {
                const stepToolCalls = step.toolCalls ?? [];
                const stepToolResults = step.toolResults ?? [];

                for (const tc of stepToolCalls) {
                    const matchingResult = stepToolResults.find(tr => tr.toolCallId === tc.toolCallId);

                    let resultStr = '';
                    let status: 'success' | 'error' = 'success';

                    if (matchingResult?.output) {
                        const raw = matchingResult.output;
                        resultStr = typeof raw === 'string' ? raw : JSON.stringify(raw);
                        try {
                            const parsed = JSON.parse(resultStr);
                            if (parsed?.status === 'error') status = 'error';
                        } catch {
                            // JSON parse error ignored, status remains as initial value
                        }
                    }

                    toolCallLog.push({
                        toolName: tc.toolName,
                        args: tc.input ?? {},
                        status,
                        result: resultStr,
                    });
                }
            }
        }

        if (result.toolResults && result.toolResults.length > 0) {
            for (const toolResult of result.toolResults) {
                try {
                    // Tool results are JSON strings, so we need to parse them
                    // Cast to access the result property which varies by type
                    const resultValue = typeof toolResult.output === 'string' ? JSON.parse(toolResult.output) : toolResult.output;

                    if (resultValue && typeof resultValue === 'object' && resultValue !== null && 'action' in resultValue && resultValue.action === 'open-content' && 'type' in resultValue && typeof resultValue.type === 'string' && 'threadId' in resultValue && typeof resultValue.threadId === 'string' && 'category' in resultValue && typeof resultValue.category === 'string' && 'mode' in resultValue && typeof resultValue.mode === 'string') {
                        clientToolCalls.push({
                            toolName: 'open-content',
                            toolCallId: toolResult.toolCallId,
                            args: {
                                type: resultValue.type,
                                threadId: resultValue.threadId,
                                category: resultValue.category,
                                mode: resultValue.mode,
                                url: 'url' in resultValue && typeof resultValue.url === 'string' ? resultValue.url : undefined,
                            },
                        });
                    }
                } catch {
                    // JSON parse error ignored, client tool call skipped
                }
            }
        }

        // Also check steps for tool results (multi-step scenarios)
        if (result.steps && result.steps.length > 0) {
            for (const step of result.steps) {
                if (step.toolResults && step.toolResults.length > 0) {
                    for (const toolResult of step.toolResults) {
                        try {
                            const resultValue = typeof toolResult.output === 'string' ? JSON.parse(toolResult.output) : toolResult.output;

                            if (resultValue && typeof resultValue === 'object' && resultValue !== null && 'action' in resultValue && resultValue.action === 'open-content' && 'type' in resultValue && typeof resultValue.type === 'string' && 'threadId' in resultValue && typeof resultValue.threadId === 'string' && 'category' in resultValue && typeof resultValue.category === 'string' && 'mode' in resultValue && typeof resultValue.mode === 'string') {
                                clientToolCalls.push({
                                    toolName: 'open-content',
                                    toolCallId: toolResult.toolCallId,
                                    args: {
                                        type: resultValue.type,
                                        threadId: resultValue.threadId,
                                        category: resultValue.category,
                                        mode: resultValue.mode,
                                        url: 'url' in resultValue && typeof resultValue.url === 'string' ? resultValue.url : undefined,
                                    },
                                });
                            }
                        } catch {
                            // JSON parse error ignored, client tool call skipped
                        }
                    }
                }
            }
        }

        return {
            text: result.text,
            clientToolCalls,
            toolCallLog,
        };
    } catch (error) {
        const aiEndTime = Date.now();
        const aiDuration = aiEndTime - aiStartTime;
        console.error(`❌ [${requestId}] AI generation failed after ${aiDuration}ms:`, error);
        console.error(`❌ [${requestId}] AI error details:`, {
            errorName: error instanceof Error ? error.name : 'Unknown',
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : 'No stack trace'
        });
        throw new VendorError(providers[provider]?.name ?? provider, 'AI generation failed', { cause: error });
    }
}

// Streams AI response for a conversation, returning the streamText result for the caller to pipe
export async function streamText(
    systemPrompt: string,
    userPrompt: string,
    convoHistory: Message[],
    userModel: string,
    provider: string,
    tools: ToolRecord = {},
    excludeTools?: string[],
    maxSteps: number = 25,
    requestId: string = nanoid(),
    toolContext?: ToolContext
): Promise<ReturnType<typeof ai.streamText>> {

    const resolvedTools = excludeTools
        ? Object.fromEntries(
            Object.entries(tools).filter(([key]) => !excludeTools.includes(key))
        )
        : tools;

    convoHistory = convoHistory.filter(msg => msg.role !== 'system' && msg.content !== '');

    if (convoHistory[0]?.role !== 'system') {
        convoHistory.unshift({ role: 'system', content: systemPrompt });
    }

    const lastMessage = convoHistory[convoHistory.length - 1];
    if (lastMessage?.role !== 'user' || lastMessage?.content !== userPrompt) {
        convoHistory.push({ role: 'user', content: userPrompt });
    }

    const aiModel = `${provider}/${userModel}`;
    console.log(`[${requestId}] AI stream request: model=${aiModel}, messages=${convoHistory.length}, tools=${Object.keys(resolvedTools).length}`);

    return ai.streamText({
        model: aiModel,
        messages: convoHistory,
        tools: resolvedTools,
        stopWhen: stepCountIs(maxSteps),
        experimental_context: toolContext,
    });
}

// Extracts clientToolCalls and toolCallLog from a completed streamText result's steps
export function extractToolData(steps: Awaited<Awaited<ReturnType<typeof ai.streamText>>['steps']>): {
    clientToolCalls: ClientToolCall[];
    toolCallLog: ToolCallLogEntry[];
} {
    const clientToolCalls: ClientToolCall[] = [];
    const toolCallLog: ToolCallLogEntry[] = [];

    if (!steps || !Array.isArray(steps)) return { clientToolCalls, toolCallLog };

    for (const step of steps) {
        const stepToolCalls = step.toolCalls ?? [];
        const stepToolResults = step.toolResults ?? [];

        for (const tc of stepToolCalls) {
            const matchingResult = stepToolResults.find(tr => tr.toolCallId === tc.toolCallId);

            let resultStr = '';
            let status: 'success' | 'error' = 'success';

            if (matchingResult?.output) {
                const raw = matchingResult.output;
                resultStr = typeof raw === 'string' ? raw : JSON.stringify(raw);
                try {
                    const parsed = JSON.parse(resultStr);
                    if (parsed?.status === 'error') status = 'error';
                } catch {
                    // JSON parse error ignored, status remains as initial value
                }
            }

            toolCallLog.push({ toolName: tc.toolName, args: tc.input ?? {}, status, result: resultStr });

            try {
                const resultValue = typeof resultStr === 'string' ? JSON.parse(resultStr) : resultStr;
                if (resultValue?.action === 'open-content') {
                    clientToolCalls.push({
                        toolName: 'open-content',
                        toolCallId: tc.toolCallId,
                        args: {
                            type: resultValue.type,
                            threadId: resultValue.threadId,
                            category: resultValue.category,
                            mode: resultValue.mode,
                            url: resultValue.url,
                        },
                    });
                }
            } catch {
                // JSON parse error ignored, client tool call skipped
            }
        }
    }

    return { clientToolCalls, toolCallLog };
}

// Generates a title for a conversation
export async function generateTitle(options: TitleGenerationOptions): Promise<string> {
    const { convoHistory, userModel, provider } = options;
    const titleRequestId = nanoid();

    try {
        const titleStartTime = Date.now();
        const { text: generatedText } = await ai.generateText({
            model: `${provider}/${userModel}`,
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that generates concise, descriptive titles for conversations.',
                },
                ...convoHistory,
                {
                    role: 'user',
                    content: 'Please generate a concise title for this conversation.',
                },
            ],
        });

        console.log(`[${titleRequestId}] Title generated in ${Date.now() - titleStartTime}ms`);
        return generatedText;
    } catch (error) {
        console.error(`❌ [${titleRequestId}] Error in generateTitle:`, error);
        console.error(`❌ [${titleRequestId}] Title generation error details:`, {
            errorName: error instanceof Error ? error.name : 'Unknown',
            errorMessage: error instanceof Error ? error.message : String(error),
            conversationLength: convoHistory.length,
            model: userModel,
            provider: provider
        });
        throw error;
    }
}

// Paraphrases a user's question to make it clearer and more concise
export async function paraphraseQuestion(question: string, category: string, mode: string): Promise<string> {
    const requestId = nanoid();

    try {
        const paraphraseStartTime = Date.now();
        const { text } = await ai.generateText({
            model: `${config.provider}/${config.model}`,
            messages: [
                {
                    role: 'system',
                    content:
`You are a helpful assistant that paraphrases student questions to make them clearer and more concise while preserving their original meaning. The question is in the context of ${category} - ${mode}.

IMPORTANT: Only output the paraphrased question, nothing else. Do not add any explanations, quotation marks, or additional text.`,
                },
                {
                    role: 'user',
                    content: question,
                },
            ],
        });

        console.log(`[${requestId}] Question paraphrased in ${Date.now() - paraphraseStartTime}ms`);
        return text;
    } catch (error) {
        console.error(`❌ [${requestId}] Error in paraphraseQuestion:`, error);
        console.error(`❌ [${requestId}] Paraphrase error details:`, {
            errorName: error instanceof Error ? error.name : 'Unknown',
            errorMessage: error instanceof Error ? error.message : String(error),
            originalQuestion: question,
            category,
            mode
        });
        console.warn(`⚠️ [${requestId}] Falling back to original question`);
        return question;
    }
}

// Generates a structured object using AI
export async function generateObject<T>(
    systemPrompt: string,
    userPrompt: string,
    convoHistory: Message[],
    userModel: string,
    provider: string,
    schema: ZodSchema<T>,
    requestId: string = nanoid()
): Promise<T> {
    convoHistory = convoHistory.filter(msg => msg.role !== 'system' && msg.content !== '');

    if (convoHistory[0]?.role !== 'system') {
        convoHistory.unshift({
            role: 'system',
            content: systemPrompt
        });
    }

    const lastMessage = convoHistory[convoHistory.length - 1];
    if (lastMessage?.role !== 'user' || lastMessage?.content !== userPrompt) {
        convoHistory.push({
            role: 'user',
            content: userPrompt
        });
    }

    const aiModel = `${provider}/${userModel}`;
    const aiStartTime = Date.now();
    console.log(`[${requestId}] AI generateObject request: model=${aiModel}, messages=${convoHistory.length}`);

    try {
        const result = await ai.generateObject({
            model: aiModel,
            messages: convoHistory,
            schema,
        });

        console.log(`[${requestId}] AI generateObject response received in ${Date.now() - aiStartTime}ms`);
        return result.object;
    } catch (error) {
        console.error(`❌ [${requestId}] AI generateObject failed after ${Date.now() - aiStartTime}ms:`, error);
        throw error;
    }
}
