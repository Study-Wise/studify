import 'dotenv/config';
import type { APIRoute } from 'astro';

import { v4 as uuid } from 'uuid';

import config from '../../../lib/config';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { token } = await request.json();

    return new Response(
      JSON.stringify({ status: 'success', removed_token: uuid() }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate.ts:', error);
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