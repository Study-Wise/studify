import 'dotenv/config';
import type { APIRoute } from 'astro';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { xai } from '@ai-sdk/xai';

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
    const { text, understanding } = await request.json();

    // Compose the prompt
    const userPrompt = `${config.systemPrompt}\n\n[Understanding Level: ${understanding}]\n\n${text}`;

    // Generate the response using vercel ai-sdk

    const provider = Object.keys(provider_maps).find(provider => provider_maps[provider as ProviderKey].includes(config.provider as ProviderKey)) as unknown as ProviderKey;
    const { text: generatedText } = await generateText({
      model: providers[provider](config.model),
      system: config.systemPrompt,
      prompt: userPrompt,
    });

    return new Response(
      JSON.stringify({ generatedText }),
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