import { nanoid } from 'nanoid';
import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import { generateText } from '@/lib/ai-service';
import config from '@/lib/ai.config';
import categories from '@/lib/modes';
import type { Message } from '@/lib/threads';
import { modules } from '@/lib/tools';

import { eq } from 'drizzle-orm';

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
                const systemPrompt = await (categories[category || '']?.modes?.[mode || '']?.prompt || Promise.resolve(''));

                const convoHistory: Message[] = [
                    { role: 'system', content: systemPrompt },
                    ...nonSystemMessages
                ];

                // Generate welcome message (pass a copy of convoHistory to avoid mutation)
                const welcomeMessage = (await generateText(systemPrompt, config.welcomeMessagePrompt, convoHistory, threads[0].model || config.model, threads[0].provider || 'openai', Object.fromEntries(Object.entries(modules).filter(([key]) => !categories[category || '']?.modes?.[mode || '']?.excludedTools?.includes(key))), undefined, 25, `page-load-${threadId}`)).text;

                const updatedMessages: Message[] = [
                    ...nonSystemMessages,
                    { id: nanoid(), role: 'assistant', content: welcomeMessage }
                ];

                await db.update(threadsTable)
                    .set({
                        thread: {
                            ...(typeof threads[0].thread === 'string' ? {} : threads[0].thread),
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
