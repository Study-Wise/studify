import 'dotenv/config';
import type { APIRoute } from 'astro';

import { utapi } from '../../../lib/uploadthing';

import { v4 as uuid } from 'uuid';

import config from '../../../lib/config';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { token } = await request.json();

    const upload_response = await utapi.deleteFiles(`${token}.json`);

    return new Response(
      JSON.stringify({ status: 'success', upload_response: upload_response, removed_token: token }),
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