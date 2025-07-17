<<<<<<< Updated upstream
import 'dotenv/config';
import type { APIRoute } from 'astro';

import { drizzle } from 'drizzle-orm/vercel-postgres';
import { threadsTable } from '../../../db/schema';

import { v4 as uuid } from 'uuid';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { token: user_token } = await request.json();

    const {token, dbResponse} = await generateToken(user_token);
  
    return new Response(
      JSON.stringify({ status: 'success', db_response: dbResponse, generated_token: token, token: token }),
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
      token: token,
      title: '',
      thread: {
        messages: []
      },
      isDev: process.env.NODE_ENV === 'development' ? true : false
    }

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

=======
import 'dotenv/config';
import type { APIRoute } from 'astro';

import config from '../../../lib/config';

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { threadsTable } from '../../../db/schema';

import { randomInt } from 'crypto';
const MAX_TOKEN = 281_474_976_710_655; // 2^48 - 1

export const POST: APIRoute = async ({ request }) => {
  try {
    const { token: user_token } = await request.json();

    const {token, dbResponse} = await generateToken(user_token);
  
    return new Response(
      JSON.stringify({ status: 'success', db_response: dbResponse, generated_token: token, token: token }),
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

async function generateToken(token?: number) {
  try {
    if (!token) token = randomInt(0, MAX_TOKEN);

    const obj = {
      token: token,
      title: '',
      thread: {
        messages: []
      },
      isDev: process.env.NODE_ENV === 'development' ? true : false
    }

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

>>>>>>> Stashed changes
export { generateToken };