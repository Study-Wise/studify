import type { APIRoute } from 'astro';

import config from '../../../lib/config';
import categories from '../../../lib/modes';
import {
    getValidModelAndProvider,
    generateAIResponse,
    generateTitle,
} from '../../../lib/ai-service';
import { generateWelcomeMessage } from '../../../lib/generateWelcomeMessage';

import { nanoid } from 'nanoid';

import { db } from '../../../db/initialize';
import { eq } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type { Mode } from '../../../lib/types';

import { threadsTable } from '../../../db/schema';
import { isValidEmail } from '../../../lib/validation';
import { clerkClient } from '@clerk/astro/server';
import { getUserRole } from '../../../lib/auth/utils';

type Thread = InferSelectModel<typeof threadsTable>;
type ThreadInsert = InferInsertModel<typeof threadsTable>;

export const POST: APIRoute = async ({ request, locals, ...context }) => {
    const requestId = nanoid();
    const startTime = Date.now();

    console.log(`🚀 [${requestId}] Starting message generation request`);
    console.log(`📊 [${requestId}] Request metadata:`, {
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent'),
        contentType: request.headers.get('content-type'),
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer')
    });

    try {
        console.log(`📥 [${requestId}] Parsing request body`);
        const { text: userPrompt, id: thread_id, model, settings: userSettings, isPublic = false, category, mode } = await request.json();
        
        console.log(`📝 [${requestId}] Request payload:`, {
            userPromptLength: userPrompt?.length || 0,
            userPromptPreview: userPrompt?.substring(0, 100) + (userPrompt?.length > 100 ? '...' : ''),
            threadId: thread_id || 'none',
            model: model || config.model,
            settingsKeys: Object.keys(userSettings || {}),
            isPublic,
            category: category || 'none',
            mode: mode || 'none'
        });
        
        // Get mode object for context-specific prompts
        let modeObj: Mode = {name: '', description: ''};
        if (category && mode) {
            modeObj = categories[category]?.modes?.[mode];
            console.log(`🎯 [${requestId}] Mode object loaded:`, {
                category,
                mode,
                modeName: modeObj.name,
                modeDescription: modeObj.description?.substring(0, 100) + '...',
                hasTools: !!modeObj.tools,
                toolsCount: Object.keys(modeObj.tools || {}).length
            });
        } else {
            console.log(`⚠️ [${requestId}] No category/mode specified, using default mode`);
        }
        
        // TODO: Use category and mode for context-specific prompts
        let current_thread_id: string | undefined = thread_id;
        const auth = locals?.auth;
        if (!auth) {
            console.error(`❌ [${requestId}] Authentication required but not provided`);
            return new Response(
                JSON.stringify({ status: 'error', error: 'Authentication required' }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }
        
        console.log(`🔐 [${requestId}] Authentication found, extracting user info`);
        const { userId } = auth();

        // Check admin status using auth-utils (consistent with rest of app)
        let userRole = getUserRole(auth);
        let isAdmin = userRole === 'admin';

        console.log(`🔐 [${requestId}] Initial admin check:`, {
            userRole: userRole || 'none',
            isAdmin: isAdmin
        });

        // Fetch user email from Clerk
        let user_email: string | null = null;
        if (userId) {
            try {
                const client = clerkClient({ request, locals, ...context });
                const user = await client.users.getUser(userId);
                user_email = user.emailAddresses?.[0]?.emailAddress || null;

                // Fallback: Also check publicMetadata if session claims don't have role
                // This handles cases where session token customization isn't configured yet
                if (!isAdmin && user.publicMetadata?.role === 'admin') {
                    isAdmin = true;
                    console.log(`⚠️ [${requestId}] Admin role found in publicMetadata but not in session claims. Please configure session token customization in Clerk Dashboard.`);
                    console.log(`✅ [${requestId}] Admin status updated via fallback:`, {
                        previousIsAdmin: false,
                        newIsAdmin: true,
                        source: 'publicMetadata'
                    });
                } else if (!isAdmin) {
                    console.log(`ℹ️ [${requestId}] User is not an admin:`, {
                        sessionClaimsRole: userRole || 'none',
                        publicMetadataRole: user.publicMetadata?.role || 'none'
                    });
                }

                // Log metadata for debugging
                console.log(`🔍 [${requestId}] User metadata:`, {
                    sessionClaimsRole: userRole,
                    publicMetadata: user.publicMetadata,
                    publicRole: user.publicMetadata?.role
                });

                console.log(`✅ [${requestId}] Successfully fetched user email from Clerk`);
            } catch (error) {
                console.error(`❌ [${requestId}] Error fetching user from Clerk:`, error);
            }
        }

        console.log(`👤 [${requestId}] User info:`, {
            userId: userId || 'none',
            userEmail: user_email || 'none',
            userRole: userRole || 'none',
            isAdmin: isAdmin
        });

        // Validate email
        console.log(`✅ [${requestId}] Validating user email`);
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
        console.log(`✅ [${requestId}] Email validation passed`);

        // Create a new thread if none provided
        let isNewThread = false;

        if (!current_thread_id) {
            console.log(`🆕 [${requestId}] No thread ID provided, creating new thread`);
            try {

                // Check thread limit for user (skip for admins)
                if (user_email) {
                    // Explicitly skip thread limit check for admin users
                    if (isAdmin) {
                        console.log(`👑 [${requestId}] Admin user detected - skipping thread limit check for:`, user_email);
                    } else {
                        console.log(`🔍 [${requestId}] Checking thread limit for user:`, user_email);
                        const userThreads = await db.select().from(threadsTable).where(eq(threadsTable.email, user_email));
                        console.log(`📊 [${requestId}] User thread count:`, userThreads.length, '/', config.maxThreadsPerUser);

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

                console.log(`🆔 [${requestId}] Generating new thread ID`);
                const newThreadId = nanoid();
                if (!newThreadId) {
                    console.error(`❌ [${requestId}] Failed to generate thread ID`);
                    throw new Error('Failed to generate thread ID');
                }

                const { model: initialModel, provider: initialProvider } = await getValidModelAndProvider(model, requestId);

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
                    isDev: process.env.NODE_ENV === 'development'
                };
                
                console.log(`💾 [${requestId}] Inserting new thread into database:`, {
                    threadId: newThreadId,
                    isPublic,
                    isDev: newThread.isDev
                });
                
                const dbResponse = await db.insert(threadsTable).values(newThread);
                current_thread_id = newThreadId;
                isNewThread = true;
                
                console.log(`✅ [${requestId}] Thread created successfully:`, {
                    threadId: newThreadId,
                    dbResponse: !!dbResponse
                });
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
        } else {
            console.log(`🔄 [${requestId}] Using existing thread ID:`, current_thread_id);
        }

        // --- Load System Prompt and Initialize Conversation History ---
        console.log(`🎯 [${requestId}] Loading system prompt for mode:`, {
            category,
            mode,
            hasModePrompt: !!modeObj.prompt,
            hasConfigPrompt: !!config.systemPrompt
        });
        
        const systemPrompt = await (modeObj.prompt || Promise.resolve(config.systemPrompt));
        console.log(`📝 [${requestId}] System prompt loaded:`, {
            promptLength: systemPrompt.length,
            promptPreview: systemPrompt.substring(0, 200) + '...'
        });
        
        const systemObj = {
            role: 'system',
            content: systemPrompt,
        }
        
        let convoHistory: any[] = [systemObj];
        console.log(`🔄 [${requestId}] Initialized conversation history with system message`);

        // --- Conversation History Fetch from DB ---
        console.log(`📚 [${requestId}] Fetching conversation history for thread:`, current_thread_id);
        let userData: Thread | undefined = undefined;
        if (current_thread_id) {
            try {
                console.log(`🔍 [${requestId}] Querying database for thread data`);
                const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, current_thread_id));
                console.log(`📊 [${requestId}] Database query result:`, {
                    threadCount: threads.length,
                    foundThread: threads.length > 0
                });
                
                if (threads.length > 0) {
                    userData = threads[0];
                    console.log(`📋 [${requestId}] Thread data loaded:`, {
                        threadId: userData.id,
                        title: userData.title || 'untitled',
                        email: userData.email || 'none',
                        isPublic: userData.isPublic,
                        hasThreadData: !!userData.thread,
                        createdAt: userData.createdAt,
                        updatedAt: userData.updatedAt
                    });
                    
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
                        Array.isArray((userData.thread as { messages: any[] }).messages)
                    ) {
                        convoHistory = [systemObj, ...(userData.thread as { messages: any[] }).messages];
                        console.log(`💬 [${requestId}] Conversation history loaded with system message:`, {
                            totalMessageCount: convoHistory.length,
                            systemMessageIncluded: true,
                            userMessagesCount: (userData.thread as { messages: any[] }).messages.length,
                            lastMessageRole: convoHistory[convoHistory.length - 1]?.role || 'none'
                        });
                    } else {
                        console.log(`⚠️ [${requestId}] No valid conversation history found in thread data, keeping system message only`);
                    }
                } else {
                    console.log(`⚠️ [${requestId}] Thread not found in database, using system message only:`, current_thread_id);
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
        } else {
            console.log(`🆕 [${requestId}] No thread ID provided, using system message only`);
        }

        // --- Model/Provider selection ---
        console.log(`🤖 [${requestId}] Selecting AI model and provider`);
        let userModel: string;
        let provider: string;

        // Use existing model/provider from database if thread exists, otherwise use client selection
        if (userData && userData.model && userData.provider) {
            console.log(`🔄 [${requestId}] Validating existing model/provider from database`);

            // Validate the stored model/provider are still valid
            const { model: validatedModel, provider: validatedProvider } = await getValidModelAndProvider(userData.model, requestId);

            // Check if validation changed the model/provider (meaning the stored ones were invalid)
            if (validatedModel !== userData.model || validatedProvider !== userData.provider) {
                console.log(`⚠️ [${requestId}] Stored model/provider invalid, using validated:`, {
                    storedModel: userData.model,
                    storedProvider: userData.provider,
                    validatedModel,
                    validatedProvider
                });
            }

            userModel = validatedModel;
            provider = validatedProvider;

            console.log(`✅ [${requestId}] Using model/provider:`, {
                model: userModel,
                provider: provider
            });
        } else {
            console.log(`🆕 [${requestId}] Determining model/provider from client selection`);
            const requestedModel = model || userSettings.model;
            const { model: validatedModel, provider: validatedProvider } = await getValidModelAndProvider(requestedModel, requestId);

            userModel = validatedModel;
            provider = validatedProvider;

            console.log(`✅ [${requestId}] Final model/provider selection:`, {
                requestedModel: requestedModel || 'none',
                model: userModel,
                provider: provider
            });
        }

        // --- Special handling for first message: Generate AI welcome response ---
        if (convoHistory.length === 1) {
            console.log(`🎯 [${requestId}] First message detected, generating AI welcome response`);

            try {
                // Add user message to conversation history first
                convoHistory.push({ role: 'user', content: userPrompt });

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
                convoHistory.push({ role: 'assistant', content: welcomeMessage });

                // Save the conversation to database
                console.log(`💾 [${requestId}] Saving initial conversation to database`);
                const convoHistoryWithoutSystem = convoHistory.filter(msg => msg.role !== 'system');

                if (isNewThread) {
                    // Thread was already created, just update it
                    console.log(`🔄 [${requestId}] Updating newly created thread with first message`);
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
                } else {
                    // Thread doesn't exist yet, insert it
                    console.log(`🆕 [${requestId}] Inserting new thread with first message`);
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
                        isDev: process.env.NODE_ENV === 'development'
                    } as ThreadInsert);
                }
                console.log(`✅ [${requestId}] Initial conversation saved`);

                // Generate title
                console.log(`🏷️ [${requestId}] Generating conversation title`);
                const convoTitle = await generateTitle({
                    convoHistory,
                    userModel: config.model,
                    provider: config.provider as string
                });
                console.log(`✅ [${requestId}] Title generated: ${convoTitle}`);

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

                const totalDuration = Date.now() - startTime;
                console.log(`🎉 [${requestId}] Request completed successfully:`, {
                    totalDuration: `${totalDuration}ms`,
                    threadId: current_thread_id,
                    finalTitle: convoTitle
                });

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
        try {
            generatedText = await generateAIResponse({
                systemPrompt,
                userPrompt,
                convoHistory,
                userModel,
                provider,
                tools,
                maxSteps: 25,
                requestId
            });
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
        console.log(`➕ [${requestId}] Adding AI response to conversation history`);
        convoHistory.push({ role: 'assistant', content: generatedText });
        console.log(`📊 [${requestId}] Final conversation history:`, {
            totalMessages: convoHistory.length,
            aiResponseLength: generatedText.length
        });

        // --- Generate conversation title ---
        let convoTitle = userData?.title;
        if (!convoTitle) {
            console.log(`🏷️ [${requestId}] Generating conversation title`);
            const titleStartTime = Date.now();
            try {
                convoTitle = await generateTitle({
                    convoHistory,
                    userModel,
                    provider
                });
                const titleEndTime = Date.now();
                const titleDuration = titleEndTime - titleStartTime;
                console.log(`✅ [${requestId}] Title generated successfully:`, {
                    title: convoTitle,
                    duration: `${titleDuration}ms`
                });
            } catch (error) {
                console.error(`❌ [${requestId}] Error generating title:`, error);
                convoTitle = 'Untitled Conversation';
            }
        } else {
            console.log(`🏷️ [${requestId}] Using existing title:`, convoTitle);
        }

        // --- Save updated history back to DB ---
        console.log(`💾 [${requestId}] Saving conversation to database`);
        const saveStartTime = Date.now();
        try {
            if (current_thread_id && userData) {
                console.log(`🔄 [${requestId}] Updating existing thread`);
                await db
                    .update(threadsTable)
                    .set({
                        title: convoTitle,
                        thread: { messages: convoHistory },
                        updatedAt: new Date(),
                        isDev: process.env.NODE_ENV === 'development' ? true : false,
                    })
                    .where(eq(threadsTable.id, current_thread_id));
                console.log(`✅ [${requestId}] Thread updated successfully`);
            } else if (current_thread_id && !userData && !isNewThread) {
                console.log(`🆕 [${requestId}] Inserting new thread with provided ID`);
                if (!current_thread_id) {
                    throw new Error('Thread ID is null or undefined');
                }
                await db.insert(threadsTable).values({
                    id: current_thread_id,
                    title: convoTitle || '',
                    thread: { messages: convoHistory },
                    email: user_email,
                    category: category || config.defaultCategory,
                    mode: mode || config.defaultMode,
                    model: userModel,
                    provider: provider,
                    isPublic: isPublic,
                    isDev: process.env.NODE_ENV === 'development'
                } as ThreadInsert);
                console.log(`✅ [${requestId}] New thread inserted successfully`);
            } else if (isNewThread) {
                console.log(`🔄 [${requestId}] Updating newly created thread`);
                await db
                    .update(threadsTable)
                    .set({
                        title: convoTitle,
                        thread: { messages: convoHistory },
                        updatedAt: new Date(),
                        isDev: process.env.NODE_ENV === 'development' ? true : false,
                    })
                    .where(eq(threadsTable.id, current_thread_id));
                console.log(`✅ [${requestId}] New thread updated successfully`);
            }
            
            const saveEndTime = Date.now();
            const saveDuration = saveEndTime - saveStartTime;
            console.log(`💾 [${requestId}] Database save completed in ${saveDuration}ms`);
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
        console.log(`🔧 [${requestId}] Formatting response`);
        const formatStartTime = Date.now();

        // Convert markdown to HTML
        const { marked } = await import('marked');
        marked.setOptions({ breaks: true, gfm: true });
        const htmlText = await marked.parse(generatedText);

        const formatEndTime = Date.now();
        const formatDuration = formatEndTime - formatStartTime;

        console.log(`✅ [${requestId}] Response formatting completed:`, {
            duration: `${formatDuration}ms`,
            htmlTextLength: htmlText.length
        });

        const totalDuration = Date.now() - startTime;
        console.log(`🎉 [${requestId}] Request completed successfully:`, {
            totalDuration: `${totalDuration}ms`,
            threadId: current_thread_id,
            finalTitle: convoTitle,
            responseSize: JSON.stringify({
                generatedText: htmlText,
                generatedTitle: true,
                id: current_thread_id,
            }).length
        });

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