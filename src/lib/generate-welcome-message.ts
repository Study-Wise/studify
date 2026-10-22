import { generateText } from '@/lib/ai-service';
import config from '@/lib/ai.config';
import type { Message } from '@/lib/threads';
import type { ToolRecord, ToolContext } from '@/lib/tools';

export interface GenerateWelcomeMessageParams {
    systemPrompt: string;
    convoHistory: Message[];
    userModel: string;
    provider: string;
    tools: ToolRecord;
    requestId: string;
    toolContext?: ToolContext;
}

export async function generateWelcomeMessage({
    systemPrompt,
    convoHistory,
    userModel,
    provider,
    tools,
    requestId,
    toolContext
}: GenerateWelcomeMessageParams): Promise<string> {
    // Create a copy of convoHistory to avoid polluting the original with the welcome prompt
    const convoHistoryCopy = structuredClone(convoHistory);

    const result = await generateText(
        systemPrompt,
        config.welcomeMessagePrompt,
        convoHistoryCopy,
        userModel,
        provider,
        tools,
        undefined,
        25,
        requestId,
        toolContext
    );

    // Note: Client tool calls from welcome message are currently ignored since the welcome message flow handles things differently
    return result.text;
}
