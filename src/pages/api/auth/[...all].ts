import type { APIRoute } from 'astro';
import { auth } from '@/lib/auth';

const handler: APIRoute = async (ctx) => {
    try {
        return await auth.handler(ctx.request);
    } catch (error) {
        console.error("[Auth API Error]", error);
        // Re-throw to let Better Auth handle its own errors
        throw error;
    }
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
export const HEAD = handler;
export const ALL = handler;

export const prerender = false;
