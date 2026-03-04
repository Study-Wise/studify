import 'dotenv/config';

import { generateText, stepCountIs, type Tool } from 'ai';

import config from '@/lib/config';
import { providers } from '@/lib/models';
import allTools from '@/lib/tools';
import { nanoid } from 'nanoid';
import type { JSONValue, Message } from '@/lib/threads';

// Tool related types
export type ToolRecord = Record<string, Tool & { clientSide?: boolean }>;

export interface ToolModule {
    default: Tool & { ready?: boolean; clientSide?: boolean };
}

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
}

export interface AIGenerationOptions {
    systemPrompt: string;
    userPrompt: string;
    convoHistory: Message[];
    userModel: string;
    provider: string;
    tools?: ToolRecord;
    excludeTools?: string[];
    maxSteps?: number;
    requestId?: string;
}

export interface TitleGenerationOptions {
    convoHistory: Message[];
    userModel: string;
    provider: string;
}

/**
 * Validates and returns a proper model-provider pair
 */
export async function getValidModelAndProvider(requestedModel: string | null): Promise<{ model: string, provider: string }> {
    let modelToUse = requestedModel || config.model;

    // Find which provider has this model
    let providerName =
        (Object.keys(providers) as Array<keyof typeof providers>).find(
            (provider: keyof typeof providers) => (providers[provider].models as Record<string, { name: string }>)[modelToUse]
        ) || config.provider;


    return { model: modelToUse, provider: providerName };
}

/**
 * Identifies which tools are client-side (no execute function or marked as clientSide)
 */
function getClientSideToolNames(tools: ToolRecord): Set<string> {
    const clientTools = new Set<string>();
    for (const [name, tool] of Object.entries(tools)) {
        // A tool is client-side if it has clientSide: true or has no execute function
        if (tool.clientSide === true || !tool.execute) {
            clientTools.add(name);
        }
    }
    return clientTools;
}

/**
 * Generates AI response for a conversation
 */
export async function generateAIResponse(options: AIGenerationOptions): Promise<AIGenerationResult> {
    const {
        systemPrompt,
        userPrompt,
        convoHistory,
        userModel,
        provider,
        tools = {},
        excludeTools,
        maxSteps = 25,
        requestId = nanoid()
    } = options;

    // Filter out excluded tools from the global tools
    const resolvedTools = excludeTools
        ? Object.fromEntries(
            Object.entries(allTools).filter(([key]) => !excludeTools.includes(key))
        )
        : tools;

    // Identify client-side tools
    const clientSideToolNames = getClientSideToolNames(resolvedTools);

    // Add system prompt to beginning of conversation history if not already present
    if (convoHistory[0]?.role !== 'system') {
        convoHistory.unshift({
            role: 'system',
            content: systemPrompt
        });
    }

    // Add user prompt to conversation history if not already present
    const lastMessage = convoHistory[convoHistory.length - 1];
    if (lastMessage?.role !== 'user' || lastMessage?.content !== userPrompt) {
        convoHistory.push({
            role: 'user',
            content: userPrompt
        });
    }

    // Initialize AI Model
    const aiModel = `${provider}/${userModel}`;

    // AI Generation
    const aiStartTime = Date.now();
    console.log(`[${requestId}] AI request: model=${aiModel}, messages=${convoHistory.length}, tools=${Object.keys(resolvedTools).length}`);

    try {
        const result = await generateText({
            model: aiModel,
            messages: convoHistory,
            tools: resolvedTools,
            stopWhen: stepCountIs(maxSteps),
        });

        console.log(`[${requestId}] AI response received in ${Date.now() - aiStartTime}ms`);

        // Extract client-side actions from tool results
        const clientToolCalls: ClientToolCall[] = [];

        // Check tool results for actions that need client-side handling
        if (result.toolResults && result.toolResults.length > 0) {
            for (const toolResult of result.toolResults) {
                try {
                    // Tool results are JSON strings, so we need to parse them
                    // Cast to access the result property which varies by type
                    const typedToolResult = toolResult as { result?: JSONValue, toolCallId: string };
                    const rawResult = typedToolResult.result;
                    const resultString = rawResult as string;
                    const resultValue = typeof resultString === 'string' ? JSON.parse(resultString) : resultString;

                    if (resultValue && typeof resultValue === 'object' && resultValue !== null && 'action' in resultValue && resultValue.action === 'open-content') {
                        const openContentResult = resultValue as { type: string, threadId: string, category: string, mode: string, url?: string };
                        clientToolCalls.push({
                            toolName: 'open-content',
                            toolCallId: typedToolResult.toolCallId,
                            args: {
                                type: openContentResult.type,
                                threadId: openContentResult.threadId,
                                category: openContentResult.category,
                                mode: openContentResult.mode,
                                url: openContentResult.url,
                            },
                        });
                    }
                } catch (parseError) {
                    // Not a JSON result or not an open-content action, skip
                }
            }
        }

        // Also check steps for tool results (multi-step scenarios)
        if (result.steps && result.steps.length > 0) {
            for (const step of result.steps) {
                if (step.toolResults && step.toolResults.length > 0) {
                    for (const toolResult of step.toolResults) {
                        try {
                            const typedToolResult = toolResult as { result?: JSONValue, toolCallId: string };
                            const rawResult = typedToolResult.result;
                            const resultValue = typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;
                            
                            if (resultValue && typeof resultValue === 'object' && resultValue !== null && 'action' in resultValue && resultValue.action === 'open-content') {
                                const openContentResult = resultValue as { type: string, threadId: string, category: string, mode: string, url?: string };
                                clientToolCalls.push({
                                    toolName: 'open-content',
                                    toolCallId: typedToolResult.toolCallId,
                                    args: {
                                        type: openContentResult.type,
                                        threadId: openContentResult.threadId,
                                        category: openContentResult.category,
                                        mode: openContentResult.mode,
                                        url: openContentResult.url,
                                    },
                                });
                            }
                        } catch {
                            // Not a JSON result or not an open-content action, skip
                        }
                    }
                }
            }
        }

        // Also check for client-side tools that weren't executed (fallback)
        if (result.toolCalls && result.toolCalls.length > 0) {
            for (const toolCall of result.toolCalls) {
                if (clientSideToolNames.has(toolCall.toolName)) {
                    // Extract args safely
                    const untypedArgs = (toolCall as { args?: Record<string, JSONValue> }).args ?? {};
                    const args: Record<string, string | number | boolean | undefined> = {};
                    
                    for (const [key, value] of Object.entries(untypedArgs)) {
                        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === undefined) {
                            args[key] = value;
                        }
                    }

                    clientToolCalls.push({
                        toolName: toolCall.toolName,
                        toolCallId: toolCall.toolCallId,
                        args,
                    });
                }
            }
        }

        return {
            text: result.text,
            clientToolCalls,
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
        throw error;
    }
}

/**
 * Generates a title for a conversation
 */
export async function generateTitle(options: TitleGenerationOptions): Promise<string> {
    const { convoHistory, userModel, provider } = options;
    const titleRequestId = nanoid();

    try {
        const titleStartTime = Date.now();
        const { text: generatedText } = await generateText({
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

/**
 * Paraphrases a user's question to make it clearer and more concise
 */
export async function paraphraseQuestion(question: string, category: string, mode: string): Promise<string> {
    const paraphraseRequestId = nanoid();

    try {
        const paraphraseStartTime = Date.now();
        const { text: paraphrasedQuestion } = await generateText({
            model: `${config.provider}/${config.model}`,
            messages: [
                {
                    role: 'system',
                    content: `You are a helpful assistant that paraphrases student questions to make them clearer and more concise while preserving their original meaning. The question is in the context of ${category} - ${mode}.

IMPORTANT: Only output the paraphrased question, nothing else. Do not add any explanations, quotation marks, or additional text.`,
                },
                {
                    role: 'user',
                    content: question,
                },
            ],
        });

        console.log(`[${paraphraseRequestId}] Question paraphrased in ${Date.now() - paraphraseStartTime}ms`);
        return paraphrasedQuestion;
    } catch (error) {
        console.error(`❌ [${paraphraseRequestId}] Error in paraphraseQuestion:`, error);
        console.error(`❌ [${paraphraseRequestId}] Paraphrase error details:`, {
            errorName: error instanceof Error ? error.name : 'Unknown',
            errorMessage: error instanceof Error ? error.message : String(error),
            originalQuestion: question,
            category,
            mode
        });
        // Return original question as fallback
        console.warn(`⚠️ [${paraphraseRequestId}] Falling back to original question`);
        return question;
    }
}
