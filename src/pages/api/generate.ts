import 'dotenv/config';
import type { APIRoute } from 'astro';

import { generateText } from 'ai';

import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { xai } from '@ai-sdk/xai';

import { marked } from 'marked';

const provider_maps = {
  openai: [
    'openai',
    'chatgpt',
    'gpt',
    'copilot',
    'mscopilot',
    'microsoftcopilot',
    'ghcopilot',
    'githubcopilot',
  ],
  anthropic: [
    'anthropic',
    'claude',
  ],
  google: [
    'google',
    'gemini',
  ],
  xai: [
    'xai',
    'x',
    'grok',
  ],
}

const providers = {
  openai: openai,
  anthropic: anthropic,
  google: google,
  xai: xai,
}

import config from '../../lib/config';

type ProviderKey = keyof typeof providers;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { text, understanding, provider, model } = await request.json();

    // Compose the prompt
    const userPrompt = `${config.systemPrompt}\n\n[Understanding Level: ${understanding}]\n\n${text}`;

    // Generate the response using vercel ai-sdk
    const real_provider = Object.keys(provider_maps).find(p => provider_maps[p as ProviderKey].includes(provider as ProviderKey)) as unknown as ProviderKey;
    const { text: generatedText } = await generateText({
      model: providers[real_provider](model),
      system: config.systemPrompt,
      prompt: userPrompt,
    });

    return new Response(
      JSON.stringify({ generatedText: marked.parse(generatedText) }),
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