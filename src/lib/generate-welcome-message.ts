/**
 * Welcome Message Generation
 *
 * This module handles generating the welcome message for the first message in a conversation.
 */

import { generateAIResponse } from '@/lib/ai-service';
import config from '@/lib/config';
import type { Message } from '@/lib/threads';
import type { ToolRecord } from '@/lib/ai-service';

export interface GenerateWelcomeMessageParams {
    systemPrompt: string;
    convoHistory: Message[];
    userModel: string;
    provider: string;
    tools: ToolRecord;
    requestId: string;
}

export async function generateWelcomeMessage({
    systemPrompt,
    convoHistory,
    userModel,
    provider,
    tools,
    requestId
}: GenerateWelcomeMessageParams): Promise<string> {
    // Create a copy of convoHistory to avoid polluting the original with the welcome prompt
    const convoHistoryCopy = JSON.parse(JSON.stringify(convoHistory));

    const result = await generateAIResponse({
        systemPrompt,
        userPrompt: config.welcomeMessagePrompt,
        convoHistory: convoHistoryCopy,
        userModel,
        provider,
        tools,
        maxSteps: 25,
        requestId
    });

    // Note: Client tool calls from welcome message are currently ignored
    // since the welcome message flow handles things differently
    return result.text;
}
