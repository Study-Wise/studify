import 'dotenv/config';
import type { APIRoute } from 'astro';

import { generateText } from 'ai';

import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { xai } from '@ai-sdk/xai';

import { marked } from 'marked';

import { utapi } from '../../../lib/uploadthing';

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

const providerFunctions = {
  openai: openai,
  anthropic: anthropic,
  google: google,
  xai: xai,
}

import config from '../../../lib/config';
import { providers } from '../../../lib/models';

type ProviderKey = keyof typeof providerFunctions;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { text: userPrompt, token: user_token, settings: userSettings } = await request.json();

    // --- Conversation History Fetch ---
    let convoHistory = [];
    let userData: any = null;
    if (user_token) {
      try {
        const allFiles = await utapi.listFiles();
        const file = allFiles.files.find(f => f.name === `${user_token}.json`);
        const url = file ? `https://r72a1v4gs7.ufs.sh/f/${file.key}` : '';
        if (url) {
          const resp = await fetch(url);
          if (resp.ok) {
            const text = await resp.text();
            userData = JSON.parse(text);
            convoHistory = userData?.thread?.messages || [];
          }
        }
      } catch (e) {
        // If file not found, start new history
        convoHistory = [];
      }
    }

    // --- Append new user message ---
    convoHistory.push({ role: 'user', content: userPrompt });

    // --- Model/Provider selection (existing code) ---
    let userModel = userSettings.model || config.model;
    let userProvider = (Object.keys(providers) as Array<keyof typeof providers>).find( (provider: keyof typeof providers) => (providers[provider].models as Record<string, { name: string }>)[userModel]) || config.provider;

    if (!Object.keys(provider_maps).find(provider => provider_maps[provider as ProviderKey].includes(userProvider))) {
      userProvider = config.provider;
    }
    let provider = Object.keys(provider_maps).find(provider => provider_maps[provider as ProviderKey].includes(userProvider)) as ProviderKey;
    
    if (!providerFunctions[provider](userModel)) {
      userModel = config.model;
    }
    
    let model = providerFunctions[provider](userModel);

    // --- Prepare prompt for AI ---
    // If your AI SDK supports message arrays, use them directly. Otherwise, join as string:
    let aiPrompt = convoHistory.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');

    // --- AI Generation ---
    const { text: generatedText } = await generateText({
      model: model,
      system: config.systemPrompt,
      prompt: aiPrompt,
    });

    // --- Append AI response to history ---
    convoHistory.push({ role: 'assistant', content: generatedText });

    let convoTitle = userData?.title;
    if (!convoTitle) {
      convoTitle = await generateTitle(convoHistory, userModel, provider);
    }

    // --- Save updated history back to UploadThing ---
    const newUserData = {
      token: user_token,
      title: convoTitle,
      thread: { messages: convoHistory }
    };
    const blob = new Blob([JSON.stringify(newUserData, null, 2)], { type: 'application/json' });
    const file = new File([blob], `${user_token}.json`, { type: 'application/json' });
    await utapi.uploadFiles(file); // Overwrites existing file

    // --- Markdown rendering (existing code) ---
    marked.setOptions({ breaks: true, gfm: true });
    const htmlText = marked.parse(generatedText);

    return new Response(
      JSON.stringify({ generatedText: htmlText, generatedTitle: true }),
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

async function generateTitle(convoHistory: any[], userModel: string, provider: ProviderKey) {
  const { text: generatedText } = await generateText({
    model: providerFunctions[provider](userModel),
    system: config.systemPrompt,
    prompt: 'Please generate a title for the following conversation history: \n\n' + convoHistory.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n'),
  });
  return generatedText;
}

export const prerender = false;