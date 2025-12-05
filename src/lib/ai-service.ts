import { generateText, type LanguageModelV1 } from 'ai';

import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { xai } from '@ai-sdk/xai';
import { vercel } from '@ai-sdk/vercel';

import config from './config';
import { providers } from './models';
import { nanoid } from 'nanoid';

export const provider_maps = {
    openai: [
        'openai',
        'chatgpt',
        'gpt',
        'copilot',
        'mscopilot',
        'microsoftcopilot',
        'ghcopilot',
        'githubcopilot',
    ],
    anthropic: [
        'anthropic',
        'claude',
    ],
    google: [
        'google',
        'gemini',
    ],
    xai: [
        'xai',
        'x',
        'grok',
    ],
    vercel: [
        'vercel',
        'v0',
    ],
};

export interface AIGenerationOptions {
    systemPrompt: string;
    userPrompt: string;
    convoHistory: any[];
    userModel: string;
    provider: string;
    tools?: Record<string, any>;
    maxSteps?: number;
    requestId?: string;
}

export interface TitleGenerationOptions {
    convoHistory: any[];
    userModel: string;
    provider: string;
}

/**
 * Validates and returns a proper model-provider pair
 */
export async function getValidModelAndProvider(requestedModel: string | null, requestId?: string): Promise<{ model: string, provider: string, providerFunction: any }> {
    let modelToUse = requestedModel || config.model;

    // Find which provider has this model
    let providerName =
        (Object.keys(providers) as Array<keyof typeof providers>).find(
            (provider: keyof typeof providers) => (providers[provider].models as Record<string, { name: string }>)[modelToUse]
        ) || config.provider;

    let providerFunction;
    try {
        providerFunction = await import(`@ai-sdk/${providerName}`);
        // Validate provider exists in provider_maps
        if (!providerFunction[providerName]) {
            if (requestId) {
                console.log(`⚠️ [${requestId}] Provider ${providerName} not found in provider_maps, falling back to config`);
            }
            providerName = config.provider;
            providerFunction = await import(`@ai-sdk/${providerName}`);
            modelToUse = config.model;
        }
    }
    catch (error) {
        if (requestId) {
            console.log(`⚠️ [${requestId}] Error importing provider ${providerName}, falling back to config`, error);
        }
        providerName = config.provider;
        providerFunction = await import(`@ai-sdk/${providerName}`);
        modelToUse = config.model;
    }

    return { model: modelToUse, provider: providerName, providerFunction };
}

/**
 * Generates AI response for a conversation
 */
export async function generateAIResponse(options: AIGenerationOptions): Promise<string> {
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

    console.log(`🛠️ [${requestId}] AI generation setup:`, {
        toolsCount: Object.keys(tools).length,
        toolsList: Object.keys(tools),
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
    const providerFunction = await import(`@ai-sdk/${provider}`);
    const aiModel = providerFunction[provider](userModel) as LanguageModelV1;

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
            maxSteps: maxSteps,
        });

        const aiEndTime = Date.now();
        const aiDuration = aiEndTime - aiStartTime;

        console.log(`✅ [${requestId}] AI generation completed:`, {
            duration: `${aiDuration}ms`,
            generatedTextLength: result.text.length,
            generatedTextPreview: result.text.substring(0, 200) + (result.text.length > 200 ? '...' : ''),
            hasUsage: !!result.usage,
            usageTokens: result.usage ? {
                promptTokens: result.usage.promptTokens,
                completionTokens: result.usage.completionTokens,
                totalTokens: result.usage.totalTokens
            } : 'none'
        });

        return result.text;
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
        const providerFunction = await import(`@ai-sdk/${provider}`);
        const { text: generatedText } = await generateText({
            model: providerFunction[provider](userModel) as LanguageModelV1,
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
