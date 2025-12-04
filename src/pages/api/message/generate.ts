import 'dotenv/config';
import type { APIRoute } from 'astro';

import { generateText, type LanguageModelV1 } from 'ai';

import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { xai } from '@ai-sdk/xai';
import { vercel } from '@ai-sdk/vercel';

import config from '../../../lib/config';
import { providers } from '../../../lib/models';
import categories from '../../../lib/modes';

import { nanoid } from 'nanoid';

import { db } from '../../../db/initialize';
import { eq } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type { Mode } from '../../../lib/types';

import { threadsTable } from '../../../db/schema';
import { isValidEmail } from '../../../lib/validation';
import { clerkClient } from '@clerk/astro/server';

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
    vercel: [
        'vercel',
        'v0',
    ],
};

const providerFunctions = {
    openai: openai,
    anthropic: anthropic,
    google: google,
    xai: xai,
    vercel: vercel,
};

type ProviderKey = keyof typeof providerFunctions;
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

        // Fetch user from Clerk to get email properly
        let user_email: string | null = null;
        if (userId) {
            try {
                const client = clerkClient({ request, locals, ...context });
                const user = await client.users.getUser(userId);
                user_email = user.emailAddresses?.[0]?.emailAddress || null;
                console.log(`✅ [${requestId}] Successfully fetched user email from Clerk`);
            } catch (error) {
                console.error(`❌ [${requestId}] Error fetching user from Clerk:`, error);
            }
        }

        console.log(`👤 [${requestId}] User info:`, {
            userId: userId || 'none',
            userEmail: user_email || 'none'
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

        // Helper function to validate and get proper model-provider pair
        const getValidModelAndProvider = (requestedModel: string | null): { model: string, provider: ProviderKey } => {
            let modelToUse = requestedModel || config.model;

            // Find which provider has this model
            let providerName =
                (Object.keys(providers) as Array<keyof typeof providers>).find(
                    (provider: keyof typeof providers) => (providers[provider].models as Record<string, { name: string }>)[modelToUse]
                ) || config.provider;

            // Validate provider exists in provider_maps
            if (
                !Object.keys(provider_maps).find((provider) => provider_maps[provider as ProviderKey].includes(providerName))
            ) {
                console.log(`⚠️ [${requestId}] Provider ${providerName} not found in provider_maps, falling back to config`);
                providerName = config.provider;
                modelToUse = config.model;
            }

            const finalProvider = Object.keys(provider_maps).find((provider) => provider_maps[provider as ProviderKey].includes(providerName)) as ProviderKey;

            // Validate the model works with the provider function
            try {
                if (!finalProvider || !providerFunctions[finalProvider]) {
                    console.log(`⚠️ [${requestId}] Invalid provider ${finalProvider}, using config defaults`);
                    return { model: config.model, provider: config.provider as ProviderKey };
                }

                // Try to initialize the model to ensure it's valid
                providerFunctions[finalProvider](modelToUse);

                console.log(`✅ [${requestId}] Validated model-provider pair:`, { model: modelToUse, provider: finalProvider });
                return { model: modelToUse, provider: finalProvider };
            } catch (error) {
                console.log(`⚠️ [${requestId}] Model ${modelToUse} not valid for provider ${finalProvider}, using config defaults`, error);
                return { model: config.model, provider: config.provider as ProviderKey };
            }
        };

        // Create a new thread if none provided
        let isNewThread = false;

        if (!current_thread_id) {
            console.log(`🆕 [${requestId}] No thread ID provided, creating new thread`);
            try {

                // Check thread limit for user
                if (user_email) {
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

                console.log(`🆔 [${requestId}] Generating new thread ID`);
                const newThreadId = nanoid();
                if (!newThreadId) {
                    console.error(`❌ [${requestId}] Failed to generate thread ID`);
                    throw new Error('Failed to generate thread ID');
                }

                const { model: initialModel, provider: initialProvider } = getValidModelAndProvider(model);

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
        let provider: ProviderKey;

        // Use existing model/provider from database if thread exists, otherwise use client selection
        if (userData && userData.model && userData.provider) {
            console.log(`🔄 [${requestId}] Validating existing model/provider from database`);

            // Validate the stored model/provider are still valid
            const { model: validatedModel, provider: validatedProvider } = getValidModelAndProvider(userData.model);

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
            const { model: validatedModel, provider: validatedProvider } = getValidModelAndProvider(requestedModel);

            userModel = validatedModel;
            provider = validatedProvider;

            console.log(`✅ [${requestId}] Final model/provider selection:`, {
                requestedModel: requestedModel || 'none',
                model: userModel,
                provider: provider
            });
        }

        // --- Append new user message ---
        console.log(`➕ [${requestId}] Adding user message to conversation history`);
        convoHistory.push({ role: 'user', content: userPrompt });
        console.log(`📊 [${requestId}] Updated conversation history:`, {
            totalMessages: convoHistory.length,
            userMessageLength: userPrompt.length
        });

        // --- Special handling for first message: Generate study materials directly ---
        if (convoHistory.length === 2) {
            console.log(`🎯 [${requestId}] First message detected, generating study materials directly`);

            try {
                // Save the conversation to database first
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
                const convoTitle = await generateTitle(convoHistory, config.model, config.provider as ProviderKey);
                console.log(`✅ [${requestId}] Title generated: ${convoTitle}`);

                // Update thread with title
                await db.update(threadsTable)
                    .set({
                        title: convoTitle,
                        updatedAt: new Date()
                    })
                    .where(eq(threadsTable.id, current_thread_id!));

                const totalDuration = Date.now() - startTime;
                console.log(`🎉 [${requestId}] Request completed successfully:`, {
                    totalDuration: `${totalDuration}ms`,
                    threadId: current_thread_id,
                    finalTitle: convoTitle
                });

                return new Response(
                    JSON.stringify({
                        generatedText: '', // Empty for first message
                        generatedTitle: true,
                        id: current_thread_id,
                    }),
                    {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    }
                );
            } catch (error) {
                console.error(`❌ [${requestId}] Error generating study materials:`, error);
                throw error;
            }
        }

        // --- Initialize AI Model ---
        let aiModel = providerFunctions[provider](userModel) as LanguageModelV1;

        const tools = modeObj.tools || {};
        
        console.log(`🛠️ [${requestId}] AI generation setup:`, {
            toolsCount: Object.keys(tools).length,
            toolsList: Object.keys(tools),
            systemPromptLength: systemPrompt.length,
            systemPromptPreview: systemPrompt.substring(0, 200) + '...',
            conversationHistoryLength: convoHistory.length,
            systemMessageIncluded: convoHistory[0]?.role === 'system'
        });
        
        // --- AI Generation ---
        console.log(`🧠 [${requestId}] Starting AI text generation with pre-built conversation history`);
        const aiStartTime = Date.now();
        let generatedText: string;
        try {
            console.log(`📤 [${requestId}] Sending to AI model:`, {
                model: userModel,
                provider: provider,
                messageCount: convoHistory.length,
                firstMessageRole: convoHistory[0]?.role,
                lastMessageRole: convoHistory[convoHistory.length - 1]?.role,
                toolsEnabled: Object.keys(tools).length > 0,
                maxSteps: 25
            });
            
            const result = await generateText({
                model: aiModel,
                messages: convoHistory,
                tools: tools,
                maxSteps: 25,
            });
            generatedText = result.text;
            
            const aiEndTime = Date.now();
            const aiDuration = aiEndTime - aiStartTime;
            
            console.log(`✅ [${requestId}] AI generation completed:`, {
                duration: `${aiDuration}ms`,
                generatedTextLength: generatedText.length,
                generatedTextPreview: generatedText.substring(0, 200) + (generatedText.length > 200 ? '...' : ''),
                hasUsage: !!result.usage,
                usageTokens: result.usage ? {
                    promptTokens: result.usage.promptTokens,
                    completionTokens: result.usage.completionTokens,
                    totalTokens: result.usage.totalTokens
                } : 'none'
            });
        } catch (error) {
            const aiEndTime = Date.now();
            const aiDuration = aiEndTime - aiStartTime;
            console.error(`❌ [${requestId}] AI generation failed after ${aiDuration}ms:`, error);
            console.error(`❌ [${requestId}] AI error details:`, {
                errorName: error instanceof Error ? error.name : 'Unknown',
                errorMessage: error instanceof Error ? error.message : String(error),
                errorStack: error instanceof Error ? error.stack : 'No stack trace'
            });
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
                convoTitle = await generateTitle(convoHistory, userModel, provider);
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

async function generateTitle(convoHistory: any[], userModel: string, provider: ProviderKey) {
    const titleRequestId = nanoid();
    console.log(`🏷️ [${titleRequestId}] Starting title generation:`, {
        conversationLength: convoHistory.length,
        model: userModel,
        provider: provider
    });
    
    try {
        const titleStartTime = Date.now();
        const { text: generatedText } = await generateText({
            model: providerFunctions[provider](userModel) as LanguageModelV1,
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that generates concise, descriptive titles for conversations.',
                },
                ...convoHistory,
                {
                    role: 'user',
                    content: 'Please generate a concise title for this conversation.',
                },
            ],
        });
        
        const titleEndTime = Date.now();
        const titleDuration = titleEndTime - titleStartTime;
        
        console.log(`✅ [${titleRequestId}] Title generation completed:`, {
            duration: `${titleDuration}ms`,
            generatedTitle: generatedText,
            titleLength: generatedText.length
        });
        
        return generatedText;
    } catch (error) {
        console.error(`❌ [${titleRequestId}] Error in generateTitle:`, error);
        console.error(`❌ [${titleRequestId}] Title generation error details:`, {
            errorName: error instanceof Error ? error.name : 'Unknown',
            errorMessage: error instanceof Error ? error.message : String(error),
            conversationLength: convoHistory.length,
            model: userModel,
            provider: provider
        });
        throw error;
    }
}

export const prerender = false;