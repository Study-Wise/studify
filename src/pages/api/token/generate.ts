import 'dotenv/config';
import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { threadsTable } from '../../../db/schema';
import { v4 as uuid } from 'uuid';
import { isValidEmail } from '../../../lib/validation';

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const { token: thread_token } = await request.json();
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
        const { token, id, dbResponse } = await generateToken(thread_token, user_email);
        return new Response(
            // JSON.stringify({ status: 'success', db_response: dbResponse, generated_token: token, token }),
            JSON.stringify({ status: 'success', db_response: dbResponse, generated_token: token, token, id }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Error in generate.ts:', error);
        return new Response(
            JSON.stringify({ status: 'error', error: `Invalid request body or server error: ${error}` }),
            {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};

async function generateToken(token?: string, email?: string | null) {
    try {
        // if (!token) token = uuid();
        // Set token to a constant truthy value; identifier will be auto-generated id
        token = 'true';
        const obj = {
            token,
            title: '',
            thread: { messages: [] },
            email,
            isDev: process.env.NODE_ENV === 'development'
        };
        const db = drizzle();
        // const dbResponse = await db.insert(threadsTable).values(obj);
        const dbResponse = await db.insert(threadsTable).values(obj).returning({ id: threadsTable.id });
        console.log('New thread created!')

        const insertedId = Array.isArray(dbResponse) && dbResponse.length > 0 ? dbResponse[0].id : undefined;
        return { token, id: insertedId, dbResponse };
    } catch (error) {
        console.error('Error in generateToken:', error);
        throw error;
    }
}

export const prerender = false;
export { generateToken };