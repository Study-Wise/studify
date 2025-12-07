/**
 * Welcome Message Generation
 *
 * This module handles generating the welcome message for the first message in a conversation.
 */

import { generateAIResponse } from './ai-service';
import config from './config';
import type { GenerateWelcomeMessageParams } from './types';

export async function generateWelcomeMessage({
    systemPrompt,
    convoHistory,
    userModel,
    provider,
    tools,
    requestId
}: GenerateWelcomeMessageParams): Promise<string> {
    console.log(`🎯 [${requestId}] Generating welcome message with AI model`);

    const welcomeMessage = await generateAIResponse({
        systemPrompt,
        userPrompt: config.welcomeMessagePrompt,
        convoHistory,
        userModel,
        provider,
        tools,
        maxSteps: 25,
        requestId
    });

    return welcomeMessage;
}
