import 'dotenv/config';
import type { APIRoute } from 'astro';

import { generateText } from 'ai';

import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { xai } from '@ai-sdk/xai';

import config from '../../../lib/config';
import { providers } from '../../../lib/models';

import { clerkClient } from '@clerk/astro/server';
import { nanoid } from 'nanoid';

import { drizzle } from 'drizzle-orm/vercel-postgres';
import { eq } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

import { threadsTable } from '../../../db/schema';
import extract from '../../../lib/extractPartsofMessage';
import { isValidEmail } from '../../../lib/validation';

const provider_maps = {
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
};

const providerFunctions = {
    openai: openai,
    anthropic: anthropic,
    google: google,
    xai: xai,
};

type ProviderKey = keyof typeof providerFunctions;
type Thread = InferSelectModel<typeof threadsTable>;
type ThreadInsert = InferInsertModel<typeof threadsTable>;

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const { text: userPrompt, id: thread_id, model: reqModel, settings: userSettings, isPublic = false } = await request.json();
        // TODO: Add UI toggle for making threads public
        let current_thread_id: string | undefined = thread_id;
        const auth = (locals as any)?.auth;
        const { userId, sessionClaims } = auth ? auth() : ({} as any);
        const user_email = userId ? ((sessionClaims?.email as string) || null) : null;

        // Validate email
        if (!isValidEmail(user_email)) {
            return new Response(
                JSON.stringify({ status: 'error', error: 'Invalid email' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Create a new thread if none provided
        let isNewThread = false;
        if (!current_thread_id) {
            try {
                const db = drizzle();
                
                // Check thread limit for user
                // TODO: Add user-friendly error message display in frontend
                
                const newThreadId = nanoid();
                if (!newThreadId) {
                    throw new Error('Failed to generate thread ID');
                }
                const newThread = {
                    id: newThreadId,
                    title: '',
                    thread: { messages: [] },
                    email: user_email,
                    isPublic: isPublic,
                    isDev: process.env.NODE_ENV === 'development'
                };
                const dbResponse = await db.insert(threadsTable).values(newThread);
                current_thread_id = newThreadId;
                isNewThread = true;
                if (dbResponse) {
                    console.log('Thread generated successfully:', dbResponse);
                }
            } catch (error) {
                console.error('Error generating thread:', error);
                return new Response(
                    JSON.stringify({ error: `Failed to generate thread: ${error}` }),
                    {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' },
                    }
                );
            }
        }

        const db = drizzle();

        // --- Conversation History Fetch from DB ---
        let convoHistory: any[] = [];
        let userData: Thread | undefined = undefined;
        if (current_thread_id) {
            try {
                const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, current_thread_id));
                if (threads.length > 0) {
                    userData = threads[0];
                    
                    // Check thread ownership
                    if (userData.email && userData.email !== user_email) {
                        return new Response(
                            JSON.stringify({ error: 'Unauthorized access to thread' }),
                            {
                                status: 403,
                                headers: { 'Content-Type': 'application/json' },
                            }
                        );
                    }
                    
                    if (
                        userData.thread && typeof userData.thread === 'object' && Array.isArray((userData.thread as any).messages)
                    ) {
                        convoHistory = (userData.thread as any).messages;
                    }
                }
            } catch (error) {
                console.error('Error fetching conversation history:', error);
                return new Response(
                    JSON.stringify({ error: `Failed to fetch conversation history: ${error}` }),
                    {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' },
                    }
                );
            }
        }

        // --- Append new user message ---
        convoHistory.push({ role: 'user', content: userPrompt });

        // --- Model/Provider selection (existing code) ---
        let userModel = reqModel || userSettings.model || config.model;
        let userProvider =
            (Object.keys(providers) as Array<keyof typeof providers>).find(
                (provider: keyof typeof providers) => (providers[provider].models as Record<string, { name: string }>)[userModel]
            ) || config.provider;

        if (
            !Object.keys(provider_maps).find((provider) => provider_maps[provider as ProviderKey].includes(userProvider))
        ) {
            userProvider = config.provider;
        }
        let provider = Object.keys(provider_maps).find((provider) => provider_maps[provider as ProviderKey].includes(userProvider)) as ProviderKey;

        if (!providerFunctions[provider](userModel)) {
            userModel = config.model;
        }

        let model = providerFunctions[provider](userModel);

        // --- Prepare prompt for AI ---
        let aiPrompt = convoHistory
            .map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
            .join('\n');

        // --- AI Generation ---
        let generatedText: string;
        try {
            const result = await generateText({
                model: model,
                system: config.systemPrompt,
                messages: [
                    {
                        role: 'system',
                        content: config.systemPrompt,
                    },
                    ...convoHistory,
                ],
            });
            generatedText = result.text;
        } catch (error) {
            console.error('Error generating AI response:', error);
            return new Response(
                JSON.stringify({ error: `Failed to generate AI response: ${error}` }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // --- Append AI response to history ---
        convoHistory.push({ role: 'assistant', content: generatedText });

        let convoTitle = userData?.title;
        if (!convoTitle) {
            try {
                convoTitle = await generateTitle(convoHistory, userModel, provider);
            } catch (error) {
                console.error('Error generating title:', error);
                convoTitle = 'Untitled Conversation';
            }
        }

        // --- Save updated history back to DB ---
        try {
            if (current_thread_id && userData) {
                // Update existing thread
                await db
                    .update(threadsTable)
                    .set({
                        title: convoTitle,
                        thread: { messages: convoHistory },
                        updatedAt: new Date(),
                        isDev: process.env.NODE_ENV === 'development' ? true : false,
                    })
                    .where(eq(threadsTable.id, current_thread_id));
            } else if (current_thread_id && !userData && !isNewThread) {
                // Insert new thread with the provided ID (this should rarely happen)
                if (!current_thread_id) {
                    throw new Error('Thread ID is null or undefined');
                }
                await db.insert(threadsTable).values({
                    id: current_thread_id,
                    title: convoTitle || '',
                    thread: { messages: convoHistory },
                    email: user_email,
                    isPublic: isPublic,
                    isDev: process.env.NODE_ENV === 'development'
                } as ThreadInsert);
            } else if (isNewThread) {
                // Update the newly created thread with the conversation data
                await db
                    .update(threadsTable)
                    .set({
                        title: convoTitle,
                        thread: { messages: convoHistory },
                        updatedAt: new Date(),
                        isDev: process.env.NODE_ENV === 'development' ? true : false,
                    })
                    .where(eq(threadsTable.id, current_thread_id));
            }
        } catch (error) {
            console.error('Error saving conversation to database:', error);
            return new Response(
                JSON.stringify({ error: `Failed to save conversation: ${error}` }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        const { obj, generatedText: htmlText } = await extract(generatedText);

        return new Response(
            JSON.stringify({
                ...obj,
                generatedText: htmlText,
                generatedTitle: true,
                id: current_thread_id,
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Error in generate.ts:', error);
        return new Response(
            JSON.stringify({ error: `Invalid request body or server error: ${error}` }),
            {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};

async function generateTitle(convoHistory: any[], userModel: string, provider: ProviderKey) {
    try {
        const { text: generatedText } = await generateText({
            model: providerFunctions[provider](userModel),
            system: config.systemPrompt,
            prompt:
                'Please generate a title for the following conversation history: \n\n' +
                convoHistory
                    .map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
                    .join('\n'),
        });
        return generatedText;
    } catch (error) {
        console.error('Error in generateTitle:', error);
        throw error;
    }
}

export const prerender = false;