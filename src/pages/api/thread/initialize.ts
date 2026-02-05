import type { APIRoute } from 'astro';

import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

import config from '@/lib/config';
import { getValidModelAndProvider } from '@/lib/ai-service';

import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';

import { isUserAdmin } from '@/lib/auth/admin';

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const { category, mode, model } = await request.json();

        // Check authentication
        const user = locals.user;
        if (!user) {
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

        // Check thread limit for user (skip for admins)
        if (!isAdmin) {
            const userThreads = await db.select().from(threadsTable).where(eq(threadsTable.email, user_email));

            if (userThreads.length >= config.maxThreadsPerUser) {
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

        // Generate new thread ID
        const newThreadId = nanoid();

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
            isPublic: false,
            isDev: process.env.NODE_ENV === 'development'
        };

        await db.insert(threadsTable).values(newThread);

        return new Response(
            JSON.stringify({
                status: 'success',
                id: newThreadId,
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Error creating thread:', error);
        return new Response(
            JSON.stringify({ status: 'error', error: `Failed to create thread: ${error}` }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};

export const prerender = false;
