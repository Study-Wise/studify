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

        // Extract client-side tool calls (tools that were called but not executed)
        const clientToolCalls: ClientToolCall[] = [];

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
