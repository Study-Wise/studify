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

    const { dbResponse, token: destroyed_token } = await destroyToken(user_token);

    return new Response(
      JSON.stringify({ status: 'success', db_response: dbResponse, removed_token: destroyed_token }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in destroy.ts:', error);
    return new Response(
      JSON.stringify({ status: 'error', error: `Invalid request body or server error: ${error}` }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

async function destroyToken(token: string | undefined) {
  try {
    if (!token) {
      return { dbResponse: null, token: null };
    }

    const db = drizzle();
    const dbResponse = await db.delete(threadsTable).where(eq(threadsTable.token, Number(token)));
    console.log('Thread deleted!')

    return { dbResponse, token };
  } catch (error) {
    console.error('Error in destroyToken function:', error);
    throw error;
  }
}

export const prerender = false;

export { destroyToken };