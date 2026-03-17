import type { APIRoute } from 'astro';

import { nanoid } from 'nanoid';

import { eq, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';

import config from '@/lib/config';
import categories from '@/lib/modes';
import type { Mode } from '@/lib/modes';
import {
    getValidModelAndProvider,
    generateAIResponse,
    generateTitle,
} from '@/lib/ai-service';
import { generateWelcomeMessage } from '@/lib/generate-welcome-message';
import type { ThreadData, Message, UploadedFile } from '@/lib/threads';
import { isValidEmail } from '@/lib/validation';
import { isUserAdmin } from '@/lib/auth/admin';

type Thread = InferSelectModel<typeof threadsTable>;
type ThreadInsert = InferInsertModel<typeof threadsTable>;

export const POST: APIRoute = async ({ request, locals }) => {
    const requestId = nanoid();
    const startTime = Date.now();

    try {
        const { text: userPrompt, id: thread_id, model, settings: userSettings, isPublic = false, category, mode } = await request.json();

        // Get mode object for context-specific prompts
        let modeObj: Mode = {name: '', description: ''};
        if (category && mode) {
            modeObj = categories[category]?.modes?.[mode];
        }
        else {
            console.warn(`⚠️ [${requestId}] No category/mode specified, using default mode`);
        }

        let current_thread_id: string | undefined = thread_id;

        // Check authentication
        const user = locals.user;
        if (!user) {
            console.error(`❌ [${requestId}] Authentication required but not provided`);
            return new Response(
                JSON.stringify({ status: 'error', error: 'Authentication required' }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        const user_email = user.email;
        const isAdmin = await isUserAdmin(user_email);

        // Validate email
        if (!isValidEmail(user_email)) {
            console.error(`❌ [${requestId}] Invalid email format:`, user_email);
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

                // Check thread limit for user (skip for admins)
                if (user_email) {
                    // Explicitly skip thread limit check for admin users
                    if (!isAdmin) {
                        const userThreads = await db.select().from(threadsTable).where(eq(threadsTable.email, user_email));

                        if (userThreads.length >= config.maxThreadsPerUser) {
                            console.error(`❌ [${requestId}] Thread limit exceeded for user:`, user_email);
                            return new Response(
                                JSON.stringify({
                                    status: 'error',
                                    error: `You have reached the maximum limit of ${config.maxThreadsPerUser} threads. Please delete some threads before creating new ones.`
                                }),
                                {
                                    status: 400,
                                    headers: { 'Content-Type': 'application/json' },
                                }
                            );
                        }
                    }
                }

                const newThreadId = nanoid();
                if (!newThreadId) {
                    console.error(`❌ [${requestId}] Failed to generate thread ID`);
                    throw new Error('Failed to generate thread ID');
                }

                const { model: initialModel, provider: initialProvider } = await getValidModelAndProvider(model);

                const newThread = {
                    id: newThreadId,
                    title: '',
                    thread: { messages: [] },
                    email: user_email,
                    category: category || config.defaultCategory,
                    mode: mode || config.defaultMode,
                    model: initialModel,
                    provider: initialProvider,
                    isPublic: isPublic,
                    isDev: (import.meta.env.NODE_ENV || process.env.NODE_ENV) === 'development'
                };

                await db.insert(threadsTable).values(newThread);
                current_thread_id = newThreadId;
                isNewThread = true;
            } catch (error) {
                console.error(`❌ [${requestId}] Error generating thread:`, error);
                return new Response(
                    JSON.stringify({ error: `Failed to generate thread: ${error}` }),
                    {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' },
                    }
                );
            }
        }

        // --- Load System Prompt and Initialize Conversation History ---
        const baseSystemPrompt = await (modeObj.prompt || Promise.resolve(config.systemPrompt));

        // Add thread context to the system prompt so AI can use tools that need threadId
        const threadContext = `
<thread-context>
threadId: ${current_thread_id}
category: ${category || config.defaultCategory}
mode: ${mode || config.defaultMode}
</thread-context>

Use the above thread context when calling tools that require threadId, category, or mode parameters.
`;

        let systemPrompt = baseSystemPrompt + threadContext;

        const systemObj: Message = {
            role: 'system',
            content: systemPrompt,
        }

        let convoHistory: Message[] = [systemObj];

        // --- Conversation History Fetch from DB ---
        let userData: Thread | undefined = undefined;
        if (current_thread_id) {
            try {
                const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, current_thread_id));

                if (threads.length > 0) {
                    userData = threads[0];

                    // Check thread ownership
                    if (userData.email && userData.email !== user_email) {
                        console.error(`❌ [${requestId}] Unauthorized access attempt:`, {
                            threadOwner: userData.email,
                            requestingUser: user_email
                        });
                        return new Response(
                            JSON.stringify({ error: 'Unauthorized access to thread' }),
                            {
                                status: 403,
                                headers: { 'Content-Type': 'application/json' },
                            }
                        );
                    }

                    if (
                        userData.thread &&
                        typeof userData.thread === 'object' &&
                        'messages' in userData.thread &&
                        Array.isArray((userData.thread as ThreadData).messages)
                    ) {
                        convoHistory = [systemObj, ...(userData.thread as ThreadData).messages];
                    }
                    else {
                        console.warn(`⚠️ [${requestId}] No valid conversation history found in thread data, keeping system message only`);
                    }
                }
                else {
                    console.warn(`⚠️ [${requestId}] Thread not found in database, using system message only:`, current_thread_id);
                }
            } catch (error) {
                console.error(`❌ [${requestId}] Error fetching conversation history:`, error);
                return new Response(
                    JSON.stringify({ error: `Failed to fetch conversation history: ${error}` }),
                    {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' },
                    }
                );
            }
        }

        // --- Build uploaded files context from thread data ---
        if (userData) {
            const uploadedFiles = (userData.uploadedFiles as UploadedFile[]) || [];
            if (uploadedFiles.length > 0) {
                const fileList = uploadedFiles
                    .map(f => {
                        const header = `--- File: ${f.name} (${f.type}, ${f.size} bytes) ---`;
                        return f.extractedText ? `${header}\n${f.extractedText}` : header;
                    })
                    .join('\n\n');
                systemPrompt += `\n\n### Uploaded Files\nThe user has uploaded the following files to this conversation. Use this content to inform your responses:\n\n${fileList}`;

                // Update the system message in convoHistory
                convoHistory[0] = { role: 'system', content: systemPrompt };
            }
        }

        // --- Check message limit per thread (skip for admins) ---
        if (!isAdmin) {
            // Count current user messages only
            const currentUserMessageCount = convoHistory.filter(msg => msg.role === 'user').length;
            // Adding one more user message
            const newUserMessageCount = currentUserMessageCount + 1;

            if (newUserMessageCount > config.maxMessagesPerThread) {
                console.error(`❌ [${requestId}] User message limit exceeded for thread:`, current_thread_id);
                return new Response(
                    JSON.stringify({
                        status: 'error',
                        error: `This thread has reached the maximum limit of ${config.maxMessagesPerThread} user messages. Please start a new conversation.`
                    }),
                    {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' },
                    }
                );
            }
        }

        // --- Model/Provider selection ---
        let userModel: string;
        let provider: string;

        // Use existing model/provider from database if thread exists, otherwise use client selection
        if (userData && userData.model && userData.provider) {
            // Validate the stored model/provider are still valid
            const { model: validatedModel, provider: validatedProvider } = await getValidModelAndProvider(userData.model);

            // Check if validation changed the model/provider (meaning the stored ones were invalid)
            if (validatedModel !== userData.model || validatedProvider !== userData.provider) {
                console.warn(`⚠️ [${requestId}] Stored model/provider invalid, using validated:`, {
                    storedModel: userData.model,
                    storedProvider: userData.provider,
                    validatedModel,
                    validatedProvider
                });
            }

            userModel = validatedModel;
            provider = validatedProvider;
        }
        else {
            const requestedModel = model || userSettings.model;
            const { model: validatedModel, provider: validatedProvider } = await getValidModelAndProvider(requestedModel);

            userModel = validatedModel;
            provider = validatedProvider;
        }

        // --- Special handling for first message: Generate AI welcome response ---
        if (convoHistory.length === 1) {
            try {
                // Add user message to conversation history first
                convoHistory.push({ role: 'user', content: userPrompt } as Message);

                // Generate AI welcome message
                const tools = modeObj.tools || {};
                const welcomeMessage = await generateWelcomeMessage({
                    systemPrompt,
                    convoHistory,
                    userModel,
                    provider,
                    tools,
                    requestId
                });

                // Add AI welcome response to conversation history
                convoHistory.push({ role: 'assistant', content: welcomeMessage } as Message);

                // Save the conversation to database
                const convoHistoryWithoutSystem = convoHistory.filter(msg => msg.role !== 'system');

                if (isNewThread || userData) {
                    // Thread already exists, update it
                    await db.update(threadsTable)
                        .set({
                            thread: { messages: convoHistoryWithoutSystem },
                            category: category || config.defaultCategory,
                            mode: mode || config.defaultMode,
                            model: userModel,
                            provider: provider,
                            updatedAt: new Date()
                        })
                        .where(eq(threadsTable.id, current_thread_id!));
                }
                else {
                    // Thread doesn't exist yet, insert it with ON CONFLICT handling
                    await db.insert(threadsTable).values({
                        id: current_thread_id,
                        title: '',
                        thread: { messages: convoHistoryWithoutSystem },
                        email: user_email,
                        category: category || config.defaultCategory,
                        mode: mode || config.defaultMode,
                        model: userModel,
                        provider: provider,
                        isPublic: isPublic,
                        isDev: (import.meta.env.NODE_ENV || process.env.NODE_ENV) === 'development'
                    } as ThreadInsert).onConflictDoUpdate({
                        target: threadsTable.id,
                        set: {
                            thread: { messages: convoHistoryWithoutSystem },
                            category: category || config.defaultCategory,
                            mode: mode || config.defaultMode,
                            model: userModel,
                            provider: provider,
                            updatedAt: new Date()
                        }
                    });
                }

                // Generate title
                const convoTitle = await generateTitle({
                    convoHistory,
                    userModel: config.model,
                    provider: config.provider as string
                });

                // Update thread with title
                await db.update(threadsTable)
                    .set({
                        title: convoTitle,
                        updatedAt: new Date()
                    })
                    .where(eq(threadsTable.id, current_thread_id!));

                // Convert welcome message to HTML
                const { marked } = await import('marked');
                marked.setOptions({ breaks: true, gfm: true });
                const htmlText = await marked.parse(welcomeMessage);

                return new Response(
                    JSON.stringify({
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
                console.error(`❌ [${requestId}] Error handling first message:`, error);
                throw error;
            }
        }

        // --- AI Generation ---
        const tools = modeObj.tools || {};
        let generatedText: string;
        let clientToolCalls: { toolName: string; toolCallId: string; args: Record<string, string | number | boolean | undefined> }[] = [];
        try {
            const aiResult = await generateAIResponse({
                systemPrompt,
                userPrompt,
                convoHistory,
                userModel,
                provider,
                tools,
                maxSteps: 25,
                requestId
            });
            generatedText = aiResult.text;
            clientToolCalls = aiResult.clientToolCalls;
        } catch (error) {
            return new Response(
                JSON.stringify({ error: `Failed to generate AI response: ${error}` }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // --- Append AI response to history ---
        convoHistory.push({ role: 'assistant', content: generatedText } as Message);

        // --- Generate conversation title ---
        let convoTitle = userData?.title;
        if (!convoTitle) {
            try {
                convoTitle = await generateTitle({
                    convoHistory,
                    userModel,
                    provider
                });
            } catch (error) {
                console.error(`❌ [${requestId}] Error generating title:`, error);
                convoTitle = 'Untitled Conversation';
            }
        }

        // --- Save updated history back to DB ---
        // Filter out system message before saving to database
        const convoHistoryWithoutSystem = convoHistory.filter(msg => msg.role !== 'system');
        try {
            if (current_thread_id && userData) {
                await db
                    .update(threadsTable)
                    .set({
                        title: convoTitle,
                        thread: { messages: convoHistoryWithoutSystem },
                        updatedAt: new Date(),
                        isDev: (import.meta.env.NODE_ENV || process.env.NODE_ENV) === 'development' ? true : false,
                    })
                    .where(eq(threadsTable.id, current_thread_id));
            }
            else if (current_thread_id && !userData && !isNewThread) {
                if (!current_thread_id) {
                    throw new Error('Thread ID is null or undefined');
                }
                await db.insert(threadsTable).values({
                    id: current_thread_id,
                    title: convoTitle || '',
                    thread: { messages: convoHistoryWithoutSystem },
                    email: user_email,
                    category: category || config.defaultCategory,
                    mode: mode || config.defaultMode,
                    model: userModel,
                    provider: provider,
                    isPublic: isPublic,
                    isDev: (import.meta.env.NODE_ENV || process.env.NODE_ENV) === 'development'
                } as ThreadInsert);
            }
            else if (isNewThread) {
                await db
                    .update(threadsTable)
                    .set({
                        title: convoTitle,
                        thread: { messages: convoHistoryWithoutSystem },
                        updatedAt: new Date(),
                        isDev: (import.meta.env.NODE_ENV || process.env.NODE_ENV) === 'development' ? true : false,
                    })
                    .where(eq(threadsTable.id, current_thread_id));
            }
        } catch (error) {
            console.error(`❌ [${requestId}] Error saving conversation to database:`, error);
            return new Response(
                JSON.stringify({ error: `Failed to save conversation: ${error}` }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // --- Format response ---
        // Convert markdown to HTML
        const { marked } = await import('marked');
        marked.setOptions({ breaks: true, gfm: true });
        const htmlText = await marked.parse(generatedText);

        return new Response(
            JSON.stringify({
                generatedText: htmlText,
                generatedTitle: true,
                id: current_thread_id,
                clientToolCalls: clientToolCalls.length > 0 ? clientToolCalls : undefined,
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        const totalDuration = Date.now() - startTime;
        console.error(`💥 [${requestId}] Fatal error in generate.ts after ${totalDuration}ms:`, error);
        console.error(`💥 [${requestId}] Error details:`, {
            errorName: error instanceof Error ? error.name : 'Unknown',
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : 'No stack trace',
            errorType: typeof error
        });
        return new Response(
            JSON.stringify({ error: `Invalid request body or server error: ${error}` }),
            {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};

export const prerender = false;
