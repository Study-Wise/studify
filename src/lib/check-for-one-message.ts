// This module checks if a thread has only one message and generates a welcome message if needed.

import { eq } from 'drizzle-orm';
import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';

import { generateWelcomeMessage } from '@/lib/generate-welcome-message';
import categories from '@/lib/modes';
import config from '@/lib/config';
import type { Message } from '@/lib/threads';

export interface CheckForOneMessageParams {
    messages: Message[];
    threadId: string;
    category: string;
    mode: string;
    isAuthorized: boolean;
}

export async function checkForOneMessage({
    messages,
    threadId,
    category,
    mode,
    isAuthorized
}: CheckForOneMessageParams): Promise<Message[]> {
    // Check if there's only one message (user or AI, not system) and generate welcome message if needed
    const nonSystemMessages = messages.filter(msg => msg.role !== 'system');

    if (nonSystemMessages.length === 1 && threadId && isAuthorized) {
        try {
            const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));

            if (threads.length > 0) {
                const thread = threads[0];
                const modeObj = categories[category || '']?.modes?.[mode || ''];

                const systemPrompt = await (modeObj?.prompt || Promise.resolve('')) as string;

                const convoHistory: Message[] = [
                    { role: 'system', content: systemPrompt },
                    ...nonSystemMessages
                ];

                // Generate welcome message (pass a copy of convoHistory to avoid mutation)
                const welcomeMessage = await generateWelcomeMessage({
                    systemPrompt,
                    convoHistory: [...convoHistory],
                    userModel: thread.model || config.model,
                    provider: thread.provider || 'openai',
                    tools: modeObj?.tools || {},
                    requestId: `page-load-${threadId}`
                });

                const updatedMessages: Message[] = [
                    ...nonSystemMessages,
                    { role: 'assistant', content: welcomeMessage }
                ];

                const currentThreadData = typeof thread.thread === 'string' ? {} : thread.thread;

                await db.update(threadsTable)
                    .set({
                        thread: {
                            ...currentThreadData,
                            messages: updatedMessages
                        },
                        updatedAt: new Date()
                    })
                    .where(eq(threadsTable.id, threadId));

                return updatedMessages;
            }
        } catch (error) {
            console.error('Error generating welcome message on page load:', error);
        }
    }

    return messages;
}
