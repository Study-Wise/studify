import 'dotenv/config';
import type { APIRoute } from 'astro';

import config from '../../../lib/config';

import { v4 as uuid } from 'uuid';

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { threadsTable } from '../../../db/schema';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { token: user_token } = await request.json();

    const { dbResponse, token: destroyed_token } = await destroyTokenIfEmptyConvo(user_token);

    return new Response(
      JSON.stringify({ status: 'success', db_response: dbResponse, removed_token: destroyed_token }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in destroyIfEmptyConvo.ts:', error);
    return new Response(
      JSON.stringify({ status: 'error', error: `Invalid request body or server error: ${error}` }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

async function destroyTokenIfEmptyConvo(token: string | undefined) {
  try {
    if (!token) {
      return { dbResponse: null, token: null };
    }

    const db = drizzle();
    const threads = await db.select().from(threadsTable).where(eq(threadsTable.token, Number(token)));
    
    if (threads.length === 0) {
      return { dbResponse: null, token: null };
    }
    
    const userData = threads[0];
    if (!userData.thread || typeof userData.thread !== 'object' || !Array.isArray((userData.thread as any).messages) || (userData.thread as any).messages.length < 1) {
      const dbResponse = await db.delete(threadsTable).where(eq(threadsTable.token, Number(token)));
      return { dbResponse, token };
    }
    
    return { dbResponse: null, token: token };
  } catch (error) {
    console.error('Error in destroyTokenIfEmptyConvo function:', error);
    throw error;
  }
}

export const prerender = false;

export { destroyTokenIfEmptyConvo };