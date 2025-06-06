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

import config from '../../../lib/config';

type ProviderKey = keyof typeof providers;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { text: userPrompt, token: user_token, settings: userSettings } = await request.json();

    // Generate the response using vercel ai-sdk

    let userProvider = userSettings.provider || config.provider;
    if (!Object.keys(provider_maps).find(provider => provider_maps[provider as ProviderKey].includes(userProvider as ProviderKey)) as unknown as ProviderKey) {
      userProvider = config.provider;
    }
    let provider = Object.keys(provider_maps).find(provider => provider_maps[provider as ProviderKey].includes(userProvider as ProviderKey)) as unknown as ProviderKey;
    
    let userModel = userSettings.model || config.model;
    if (!providers[provider](userModel)) {
      userModel = config.model;
    }
    let model = providers[provider](userModel);


    const { text: generatedText } = await generateText({
      model: model,
      system: config.systemPrompt,
      prompt: userPrompt,
    });

    marked.setOptions({
      breaks: true,
      gfm: true,
    });
    const htmlText = marked.parse(generatedText);

    return new Response(
      JSON.stringify({ generatedText: htmlText }),
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