/**
 * Check For One Message
 *
 * This module checks if a thread has only one message and generates a welcome message if needed.
 */

import { generateWelcomeMessage } from './generateWelcomeMessage';
import categories from './modes';
import { db } from '../db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '../db/schema';

interface CheckForOneMessageParams {
    messages: any[];
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
}: CheckForOneMessageParams): Promise<any[]> {
    // Check if there's only one message (user or AI, not system) and generate welcome message if needed
    const nonSystemMessages = messages.filter(msg => msg.role !== 'system');

    if (nonSystemMessages.length === 1 && threadId && isAuthorized) {
        try {
            // Get the thread data
            const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));

            if (threads.length > 0) {
                const thread = threads[0];
                const modeObj = categories[category || '']?.modes?.[mode || ''];

                // Get system prompt
                const systemPrompt = await (modeObj?.prompt || Promise.resolve(''));

                // Prepare conversation history with system message
                const convoHistory = [
                    { role: 'system', content: systemPrompt },
                    ...nonSystemMessages
                ];

                // Generate welcome message
                const welcomeMessage = await generateWelcomeMessage({
                    systemPrompt,
                    convoHistory,
                    userModel: thread.model || 'gpt-4.1',
                    provider: thread.provider || 'openai',
                    tools: modeObj?.tools || {},
                    requestId: `page-load-${threadId}`
                });

                // Add welcome message to the conversation
                const updatedMessages = [
                    ...nonSystemMessages,
                    { role: 'assistant', content: welcomeMessage }
                ];

                // Update the database with the new message
                await db.update(threadsTable)
                    .set({
                        thread: { messages: updatedMessages },
                        updatedAt: new Date()
                    })
                    .where(eq(threadsTable.id, threadId));

                // Return updated messages
                return updatedMessages;
            }
        } catch (error) {
            console.error('Error generating welcome message on page load:', error);
        }
    }

    // Return original messages if no welcome message was generated
    return messages;
}
