import 'dotenv/config';

import { generateText, stepCountIs } from 'ai';

import config from './config';
import { providers } from './models';
import { nanoid } from 'nanoid';
import type { AIGenerationOptions, TitleGenerationOptions, AIGenerationResult, ClientToolCall } from './types';

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
function getClientSideToolNames(tools: Record<string, any>): Set<string> {
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
        maxSteps = 25,
        requestId = nanoid()
    } = options;

    // Identify client-side tools
    const clientSideToolNames = getClientSideToolNames(tools);

    console.log(`🛠️ [${requestId}] AI generation setup:`, {
        toolsCount: Object.keys(tools).length,
        toolsList: Object.keys(tools),
        clientSideTools: Array.from(clientSideToolNames),
        conversationHistoryLength: convoHistory.length,
        systemMessageIncluded: convoHistory[0]?.role === 'system'
    });

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
    console.log(`🧠 [${requestId}] Starting AI text generation with pre-built conversation history`);
    const aiStartTime = Date.now();

    try {
        console.log(`📤 [${requestId}] Sending to AI model:`, {
            model: userModel,
            provider: provider,
            messageCount: convoHistory.length,
            firstMessageRole: convoHistory[0]?.role,
            lastMessageRole: convoHistory[convoHistory.length - 1]?.role,
            toolsEnabled: Object.keys(tools).length > 0,
            maxSteps
        });

        const result = await generateText({
            model: aiModel,
            messages: convoHistory,
            tools: tools,
            stopWhen: stepCountIs(maxSteps),
        });

        const aiEndTime = Date.now();
        const aiDuration = aiEndTime - aiStartTime;

        // Extract client-side actions from tool results
        const clientToolCalls: ClientToolCall[] = [];

        console.log(`🔧 [${requestId}] Tool execution results:`, {
            hasToolResults: !!result.toolResults,
            toolResultsLength: result.toolResults?.length || 0,
            hasToolCalls: !!result.toolCalls,
            toolCallsLength: result.toolCalls?.length || 0,
            hasSteps: !!result.steps,
            stepsLength: result.steps?.length || 0,
        });

        // Check tool results for actions that need client-side handling
        if (result.toolResults && result.toolResults.length > 0) {
            console.log(`🔧 [${requestId}] Processing ${result.toolResults.length} tool results`);
            for (const toolResult of result.toolResults) {
                try {
                    // Tool results are JSON strings, so we need to parse them
                    // Cast to access the result property which varies by type
                    const rawResult = (toolResult as unknown as { result?: unknown }).result;
                    console.log(`🔧 [${requestId}] Raw tool result:`, {
                        toolCallId: toolResult.toolCallId,
                        toolName: (toolResult as any).toolName,
                        rawResultType: typeof rawResult,
                        rawResultPreview: typeof rawResult === 'string' ? rawResult.substring(0, 200) : JSON.stringify(rawResult)?.substring(0, 200),
                    });
                    const resultString = rawResult as string;
                    const resultValue = typeof resultString === 'string' ? JSON.parse(resultString) : resultString;

                    if (resultValue && resultValue.action === 'open-content') {
                        console.log(`✅ [${requestId}] Found open-content action in tool result`);
                        clientToolCalls.push({
                            toolName: 'open-content',
                            toolCallId: toolResult.toolCallId,
                            args: {
                                type: resultValue.type,
                                threadId: resultValue.threadId,
                                category: resultValue.category,
                                mode: resultValue.mode,
                                url: resultValue.url,
                            },
                        });
                    }
                } catch (parseError) {
                    console.log(`⚠️ [${requestId}] Failed to parse tool result:`, parseError);
                    // Not a JSON result or not an open-content action, skip
                }
            }
        }

        // Also check steps for tool results (multi-step scenarios)
        if (result.steps && result.steps.length > 0) {
            console.log(`🔧 [${requestId}] Processing ${result.steps.length} steps for tool results`);
            for (const step of result.steps) {
                if (step.toolResults && step.toolResults.length > 0) {
                    for (const toolResult of step.toolResults) {
                        try {
                            const rawResult = (toolResult as any).result;
                            console.log(`🔧 [${requestId}] Step tool result:`, {
                                toolName: (toolResult as any).toolName,
                                rawResultType: typeof rawResult,
                                rawResultPreview: typeof rawResult === 'string' ? rawResult.substring(0, 200) : JSON.stringify(rawResult)?.substring(0, 200),
                            });
                            const resultValue = typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;
                            if (resultValue && resultValue.action === 'open-content') {
                                console.log(`✅ [${requestId}] Found open-content action in step tool result`);
                                clientToolCalls.push({
                                    toolName: 'open-content',
                                    toolCallId: (toolResult as any).toolCallId,
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
                    // Cast to any to access args since the type varies between TypedToolCall and DynamicToolCall
                    const args = (toolCall as unknown as { args?: Record<string, unknown> }).args ?? {};
                    clientToolCalls.push({
                        toolName: toolCall.toolName,
                        toolCallId: toolCall.toolCallId,
                        args,
                    });
                }
            }
        }

        console.log(`✅ [${requestId}] AI generation completed:`, {
            duration: `${aiDuration}ms`,
            generatedTextLength: result.text.length,
            generatedTextPreview: result.text.substring(0, 200) + (result.text.length > 200 ? '...' : ''),
            clientToolCalls: clientToolCalls.length,
            hasUsage: !!result.usage,
            usageTokens: result.usage ? {
                inputTokens: result.usage.inputTokens,
                outputTokens: result.usage.outputTokens,
                totalTokens: result.usage.totalTokens
            } : 'none'
        });

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

    console.log(`🏷️ [${titleRequestId}] Starting title generation:`, {
        conversationLength: convoHistory.length,
        model: userModel,
        provider: provider
    });

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

        const titleEndTime = Date.now();
        const titleDuration = titleEndTime - titleStartTime;

        console.log(`✅ [${titleRequestId}] Title generation completed:`, {
            duration: `${titleDuration}ms`,
            generatedTitle: generatedText,
            titleLength: generatedText.length
        });

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

    console.log(`✍️ [${paraphraseRequestId}] Starting question paraphrasing:`, {
        originalQuestion: question,
        questionLength: question.length,
        category,
        mode
    });

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

        const paraphraseEndTime = Date.now();
        const paraphraseDuration = paraphraseEndTime - paraphraseStartTime;

        console.log(`✅ [${paraphraseRequestId}] Question paraphrasing completed:`, {
            duration: `${paraphraseDuration}ms`,
            originalQuestion: question,
            paraphrasedQuestion: paraphrasedQuestion,
            paraphrasedLength: paraphrasedQuestion.length
        });

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
        console.log(`⚠️ [${paraphraseRequestId}] Falling back to original question`);
        return question;
    }
}
