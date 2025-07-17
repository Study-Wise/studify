import 'dotenv/config';
import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { threadsTable } from '../../../db/schema';
import { v4 as uuid } from 'uuid';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { token: user_token } = await request.json();
    const { token, dbResponse } = await generateToken(user_token);
    return new Response(
      JSON.stringify({ status: 'success', db_response: dbResponse, generated_token: token, token }),
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

async function generateToken(token?: string) {
  try {
    if (!token) token = uuid();
    const obj = {
      token,
      title: '',
      thread: { messages: [] },
      isDev: process.env.NODE_ENV === 'development'
    };
    const db = drizzle();
    const dbResponse = await db.insert(threadsTable).values(obj);
    console.log('New thread created!')

    return { token, dbResponse };
  } catch (error) {
    console.error('Error in generateToken:', error);
    throw error;
  }
}

export const prerender = false;
export { generateToken };