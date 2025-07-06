import 'dotenv/config';
import type { APIRoute } from 'astro';

import { utapi } from '../../../lib/uploadthing';

import { v4 as uuid } from 'uuid';

import config from '../../../lib/config';

export const POST: APIRoute = async ({ request }) => {
  try {
    var { token } = await request.json();

    if (!token) token = uuid();

    const obj = {
      token: token,
      title: '',
      thread: {
        messages: []
      }
    }

    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const file = new File([blob], `${token}.json`, { type: 'application/json' });

    const all_files = await utapi.listFiles();
    const existing_file = all_files.files.find(file => file.name === `${token}.json`);
    var upload_response = {}
    if (existing_file) {
      upload_response = existing_file;
    } else {
      upload_response = await utapi.uploadFiles(file);
    }

    return new Response(
      JSON.stringify({ status: 'success', upload_response: upload_response, generated_token: token }),
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

export const prerender = false;