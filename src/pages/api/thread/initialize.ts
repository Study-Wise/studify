import { nanoid } from 'nanoid';
import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import config from '@/lib/ai.config';
import { getValidModelAndProvider } from '@/lib/models';
import { isUserAdmin } from '@/lib/auth/admin';

import { eq } from 'drizzle-orm';

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const { category, mode, provider, tier, isPublic } = await request.json();

        if (!locals.user) {
            return new Response(
                JSON.stringify({ status: 'error', error: 'Authentication required' }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        if (!(await isUserAdmin(locals.user.email))) {
            if (
                (await db.select().from(threadsTable).where(eq(threadsTable.email, locals.user.email))).length
                >= config.maxThreadsPerUser
            ) {
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

        const newThreadId = nanoid();

        const { model: initialModel, provider: initialProvider } = await getValidModelAndProvider(provider, tier);

        await db.insert(threadsTable).values({
            id: newThreadId,
            title: '',
            thread: { messages: [] },
            email: locals.user.email,
            category: category || config.defaultCategory,
            mode: mode || config.defaultMode,
            model: initialModel,
            provider: initialProvider,
            isPublic: isPublic === true,
            isDev: (import.meta.env.NODE_ENV || process.env.NODE_ENV) === 'development'
        });

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
