import { nanoid } from 'nanoid';
import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import {
    streamText,
    extractToolData,
    generateTitle,
} from '@/lib/ai-service';
import config from '@/lib/ai.config';
import { generateWelcomeMessage } from '@/lib/generate-welcome-message';
import { getValidModelAndProvider, providers } from '@/lib/models';
import categories from '@/lib/modes';
import generateModePrompt from '@/lib/prompt-generator';
import { parseThreadData, type Message } from '@/lib/threads';
import { modules } from '@/lib/tools';
import type { ToolContext } from '@/lib/tools';
import { VendorError, getUserErrorMessage } from '@/lib/user-errors';
import isValidEmail from '@/lib/validation';
import { isUserAdmin } from '@/lib/auth/admin';

import { and, eq, type InferSelectModel } from 'drizzle-orm';

import type { APIRoute } from 'astro';

type Thread = InferSelectModel<typeof threadsTable>;

const MATH_CLOSERS: Record<string, string> = { '$$': '$$', '$': '$', '\\(': '\\)', '\\[': '\\]' };

export const POST: APIRoute = async ({ request, locals }) => {
    const requestId = nanoid();
    const startTime = Date.now();

    try {
        const { text: userPrompt, id: thread_id, provider, tier, isPublic = false, category, mode } = await request.json();

        const modeObj = categories[category || config.defaultCategory]?.modes?.[mode || config.defaultMode];

        let current_thread_id: string | undefined = thread_id;

        if (!locals.user) {
            console.error(`❌ [${requestId}] Authentication required but not provided`);
            return new Response(
                JSON.stringify({ status: 'error', error: 'Authentication required' }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        const isAdmin = await isUserAdmin(locals.user.email);

        if (!isValidEmail(locals.user.email)) {
            console.error(`❌ [${requestId}] Invalid email format:`, locals.user.email);
            return new Response(
                JSON.stringify({ status: 'error', error: 'Invalid email' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        if (!current_thread_id) {
            try {

                if (locals.user.email) {
                    if (!isAdmin) {
                        if ((await db.select().from(threadsTable).where(eq(threadsTable.email, locals.user.email))).length >= config.maxThreadsPerUser) {
                            console.error(`❌ [${requestId}] Thread limit exceeded for user:`, locals.user.email);
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

                const resolved = await getValidModelAndProvider(provider, tier);

                await db.insert(threadsTable).values({
                    id: newThreadId,
                    title: '',
                    thread: { messages: [] },
                    email: locals.user.email,
                    category: category || config.defaultCategory,
                    mode: mode || config.defaultMode,
                    model: resolved.model,
                    provider: resolved.provider,
                    isPublic: isPublic,
                    isDev: (import.meta.env.NODE_ENV || process.env.NODE_ENV) === 'development'
                });
                current_thread_id = newThreadId;
            } catch (error) {
                console.error(`❌ [${requestId}] Error generating thread:`, error);
                return new Response(
                    JSON.stringify({ error: getUserErrorMessage(error, 'start a new chat', requestId) }),
                    {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' },
                    }
                );
            }
        }

        let systemPrompt = await (modeObj.prompt || generateModePrompt(categories[config.defaultCategory].modes[config.defaultMode], config.defaultCategory)) + `
<thread-context>
threadId: ${current_thread_id}
category: ${category || config.defaultCategory}
mode: ${mode || config.defaultMode}
</thread-context>

Use the above thread context when calling tools that require category or mode parameters. Content tools always operate on this thread automatically.

IMPORTANT: When the user asks you to search, look up information, or use a tool, you MUST actually call the appropriate tool. Do NOT pretend or hallucinate that you used a tool—instead make the actual tool call and use the real results. If a tool call is available and relevant to the user's request, use it.
`;

        let convoHistory: Message[] = [{ role: 'system', content: systemPrompt }];

        let userData: Thread | undefined = undefined;
        if (current_thread_id) {
            try {
                const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, current_thread_id));

                if (threads.length > 0) {
                    userData = threads[0];

                    if (userData.email && userData.email !== locals.user.email) {
                        console.error(`❌ [${requestId}] Unauthorized access attempt:`, {
                            threadOwner: userData.email,
                            requestingUser: locals.user.email
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
                        Array.isArray(userData.thread.messages)
                    ) {
                        convoHistory = [{ role: 'system', content: systemPrompt }, ...parseThreadData(userData.thread).messages];
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
                    JSON.stringify({ error: getUserErrorMessage(error, 'load this chat', requestId) }),
                    {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' },
                    }
                );
            }
        }

        if (userData) {
            const uploadedFiles = userData.uploadedFiles || [];
            if (uploadedFiles.length > 0) {
                const fileList = uploadedFiles
                    .map(f => {
                        const header = `--- File: ${f.name} (${f.type}, ${f.size} bytes) ---`;
                        return f.extractedText ? `${header}\n${f.extractedText}` : header;
                    })
                    .join('\n\n');
                systemPrompt += `\n\n### Uploaded Files\nThe user has uploaded the following files to this conversation. Use this content to inform your responses:\n\n${fileList}`;

                convoHistory[0] = { role: 'system', content: systemPrompt };
            }
        }

        if (!isAdmin) {
            if (convoHistory.filter(msg => msg.role === 'user').length + 1 > config.maxMessagesPerThread) {
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

        let userModel: string;
        let selectedProvider: string;

        if (userData && userData.model && userData.provider) {
            // Use stored model and provider directly (already resolved at thread creation)
            userModel = userData.model;
            selectedProvider = userData.provider;
        }
        else {
            const { model: resolvedModel, provider: resolvedProvider } = await getValidModelAndProvider(provider, tier);

            userModel = resolvedModel;
            selectedProvider = resolvedProvider;
        }

        // Server-verified context for tools: thread ownership was checked above, so tools must use this rather than any thread ID chosen by the model
        const toolContext: ToolContext = { threadId: current_thread_id!, email: locals.user.email };

        // --- Special handling for first message: Generate AI welcome response ---
        if (convoHistory.length === 1) {
            const firstMessageState = { created: !thread_id, saved: false };
            try {
                convoHistory.push({ id: nanoid(), role: 'user', content: userPrompt });

                const tools = Object.fromEntries(Object.entries(modules).filter(([key]) => !modeObj.excludedTools?.includes(key)));
                const welcomeMessage = await generateWelcomeMessage({
                    systemPrompt,
                    convoHistory,
                    userModel,
                    provider: selectedProvider,
                    tools,
                    requestId,
                    toolContext
                });

                convoHistory.push({ id: nanoid(), role: 'assistant', content: welcomeMessage });

                const convoHistoryWithoutSystem = convoHistory.filter(msg => msg.role !== 'system');

                if (firstMessageState.created || userData) {
                    await db.update(threadsTable)
                        .set({
                            thread: { messages: convoHistoryWithoutSystem },
                            category: category || config.defaultCategory,
                            mode: mode || config.defaultMode,
                            model: userModel,
                            provider: selectedProvider,
                            updatedAt: new Date()
                        })
                        .where(eq(threadsTable.id, current_thread_id!));
                }
                else {
                    await db.insert(threadsTable).values({
                        id: current_thread_id,
                        title: '',
                        thread: { messages: convoHistoryWithoutSystem },
                        email: locals.user.email,
                        category: category || config.defaultCategory,
                        mode: mode || config.defaultMode,
                        model: userModel,
                        provider: provider,
                        isPublic: isPublic,
                        isDev: (import.meta.env.NODE_ENV || process.env.NODE_ENV) === 'development'
                    }).onConflictDoUpdate({
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
                firstMessageState.saved = true;

                await db.update(threadsTable)
                    .set({
                        title: await generateTitle({
                            convoHistory,
                            userModel: config.model,
                            provider: config.provider
                        }),
                        updatedAt: new Date()
                    })
                    .where(eq(threadsTable.id, current_thread_id!));

                const { marked } = await import('marked');
                marked.setOptions({ breaks: true, gfm: true });

                return new Response(
                    JSON.stringify({
                        generatedText: await marked.parse(welcomeMessage),
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

                // The thread was created for this message, so remove it rather than leave an empty, untitled chat behind when the first reply fails
                if (firstMessageState.created && !firstMessageState.saved) {
                    try {
                        await db.delete(threadsTable)
                            .where(and(eq(threadsTable.id, current_thread_id!), eq(threadsTable.email, locals.user.email)));
                    } catch (deleteError) {
                        console.error(`❌ [${requestId}] Failed to remove empty thread:`, deleteError);
                    }
                }
                throw error;
            }
        }

        // Add the user message to the history that gets saved. streamText works on a filtered copy, so a user message it appends never reaches this array
        convoHistory.push({ id: nanoid(), role: 'user', content: userPrompt });

        const tools = Object.fromEntries(Object.entries(modules).filter(([key]) => !modeObj.excludedTools?.includes(key)));
        let streamResult: Awaited<ReturnType<typeof streamText>>;
        try {
            streamResult = await streamText(
                systemPrompt,
                userPrompt,
                convoHistory,
                userModel,
                selectedProvider,
                tools,
                undefined,
                25,
                requestId,
                toolContext
            );
        } catch (error) {
            console.error(`❌ [${requestId}] Failed to start AI stream:`, error);
            const vendorError = new VendorError(providers[selectedProvider]?.name ?? selectedProvider, 'Failed to start AI stream', { cause: error });
            return new Response(
                JSON.stringify({ error: getUserErrorMessage(vendorError, 'get a response', requestId) }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const encoder = new TextEncoder();
        function sendEvent(data: object) {
            return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
        }
        const isDev = (import.meta.env.NODE_ENV || process.env.NODE_ENV) === 'development';

        return new Response(new ReadableStream({
            async start(controller) {
                try {
                    let streamedText = '';
                    const htmlThrottle: { lastAt: number; html: string | undefined } = { lastAt: 0, html: undefined };
                    const { marked } = await import('marked');
                    marked.setOptions({ breaks: true, gfm: true });

                    for await (const part of streamResult.fullStream) {
                        const streamPart = part;
                        if (streamPart.type === 'text-delta') {
                            streamedText += streamPart.text || '';
                            if (Date.now() - htmlThrottle.lastAt >= config.streamHtmlInterval) {
                                htmlThrottle.lastAt = Date.now();
                                // Leave out a formula that is still being written, so half a formula never shows
                                let open: RegExpMatchArray | undefined;
                                for (const match of streamedText.matchAll(/\$\$|\$|\\[()[\]]/g)) {
                                    if (!open && MATH_CLOSERS[match[0]]) open = match;
                                    else if (open && match[0] === MATH_CLOSERS[open[0]]) open = undefined;
                                }
                                htmlThrottle.html = await marked.parse(open ? streamedText.slice(0, open.index) : streamedText);
                            }
                            controller.enqueue(sendEvent({ type: 'text', text: streamPart.text || '', html: htmlThrottle.html }));
                            htmlThrottle.html = undefined;
                        }
                        else if (streamPart.type === 'tool-call') {
                            controller.enqueue(sendEvent({ type: 'tool-call', toolCallId: streamPart.toolCallId || '', toolName: streamPart.toolName || '' }));
                        }
                        else if (streamPart.type === 'tool-result') {
                            try {
                                const parsed = typeof streamPart.output === 'string' ? JSON.parse(streamPart.output) : streamPart.output;
                                controller.enqueue(sendEvent({
                                    type: 'tool-result',
                                    toolCallId: streamPart.toolCallId || '',
                                    toolName: streamPart.toolName || '',
                                    status: typeof parsed === 'object' && parsed !== null && 'status' in parsed && parsed.status === 'error' ? 'error' : 'success'
                                }));
                            } catch {
                                // JSON parse error ignored, status stays as success
                                controller.enqueue(sendEvent({ type: 'tool-result', toolCallId: streamPart.toolCallId || '', toolName: streamPart.toolName || '', status: 'success' }));
                            }
                        }
                        else if (streamPart.type === 'error') {
                            throw new VendorError(providers[selectedProvider]?.name ?? selectedProvider, 'AI stream failed', { cause: streamPart.error });
                        }
                    }

                    const [fullText, steps] = await Promise.all([streamResult.text, streamResult.steps]);
                    const { clientToolCalls, toolCallLog } = extractToolData(steps);

                    const assistantMessage: Message = { id: nanoid(), role: 'assistant', content: fullText };
                    if (toolCallLog.length > 0) assistantMessage.toolCallLog = toolCallLog;
                    convoHistory.push(assistantMessage);
                    const convoHistoryWithoutSystem = convoHistory.filter(msg => msg.role !== 'system');
                    if (current_thread_id && userData) {
                        // Leave the title out: the user may have renamed the chat while this response streamed
                        await db.update(threadsTable)
                            .set({ thread: { messages: convoHistoryWithoutSystem }, updatedAt: new Date(), isDev })
                            .where(eq(threadsTable.id, current_thread_id!));
                    }
                    else if (current_thread_id) {
                        await db.insert(threadsTable).values({
                            id: current_thread_id,
                            title: userData?.title ?? 'Untitled Conversation',
                            thread: { messages: convoHistoryWithoutSystem },
                            email: locals.user.email,
                            category: category || config.defaultCategory,
                            mode: mode || config.defaultMode,
                            model: userModel,
                            provider: selectedProvider,
                            isPublic: isPublic,
                            isDev,
                        }).onConflictDoUpdate({
                            target: threadsTable.id,
                            set: { thread: { messages: convoHistoryWithoutSystem }, updatedAt: new Date(), isDev },
                        });
                    }

                    controller.enqueue(sendEvent({
                        type: 'done',
                        id: current_thread_id,
                        generatedText: await marked.parse(fullText),
                        toolCallLog: toolCallLog.length > 0 ? toolCallLog : undefined,
                        clientToolCalls: clientToolCalls.length > 0 ? clientToolCalls : undefined,
                    }));
                    controller.close();

                    if (!userData?.title) {
                        try {
                            const title = await generateTitle({ convoHistory, userModel, provider: selectedProvider });
                            await db.update(threadsTable)
                                .set({ title, updatedAt: new Date() })
                                // Skip if the chat was renamed while the title was generated
                                .where(and(eq(threadsTable.id, current_thread_id!), eq(threadsTable.title, userData?.title ?? 'Untitled Conversation')));
                        } catch (error) {
                            console.error(`❌ [${requestId}] Title generation failed:`, error);
                        }
                    }
                } catch (error) {
                    console.error(`❌ [${requestId}] Stream error:`, error);
                    controller.enqueue(sendEvent({ type: 'error', error: getUserErrorMessage(error, 'get a response', requestId) }));
                    controller.close();
                }
            }
        }), {
            status: 200,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
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
            JSON.stringify({ error: getUserErrorMessage(error, 'send your message', requestId) }),
            {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};

export const prerender = false;
