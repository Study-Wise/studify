import 'dotenv/config';
import type { APIRoute } from 'astro';

import { generateText } from 'ai';

import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { xai } from '@ai-sdk/xai';

import { marked } from 'marked';
import jsdom from 'jsdom';

import config from '../../../lib/config';
import { providers } from '../../../lib/models';

import { generateToken } from '../token/generate';
// import { destroyToken } from '../token/destroy';

import { drizzle } from 'drizzle-orm/vercel-postgres';
import { eq } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { threadsTable } from '../../../db/schema';
import extract from '../../../lib/extractPartsofMessage';

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
};

type ProviderKey = keyof typeof providerFunctions;
type Thread = InferSelectModel<typeof threadsTable>;
type ThreadInsert = InferInsertModel<typeof threadsTable>;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { text: userPrompt, token: orig_token, settings: userSettings } = await request.json();
    let user_token = orig_token;

    if (!user_token) {
      try {
        const { token } = await generateToken();
        user_token = token;
      } catch (error) {
        console.error('Error generating token:', error);
        return new Response(
          JSON.stringify({ error: `Failed to generate token: ${error}` }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    const db = drizzle();

    // --- Conversation History Fetch from DB ---
    let convoHistory: any[] = [];
    let userData: Thread | undefined = undefined;
    if (user_token) {
      try {
        const threads = await db.select().from(threadsTable).where(eq(threadsTable.token, user_token));
        if (threads.length > 0) {
          userData = threads[0];
          if (userData.thread && typeof userData.thread === 'object' && Array.isArray((userData.thread as any).messages)) {
            convoHistory = (userData.thread as any).messages;
          }
        }
      } catch (error) {
        console.error('Error fetching conversation history:', error);
        return new Response(
          JSON.stringify({ error: `Failed to fetch conversation history: ${error}` }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // --- Append new user message ---
    convoHistory.push({ role: 'user', content: userPrompt });

    // --- Model/Provider selection (existing code) ---
    let userModel = userSettings.model || config.model;
    let userProvider = (Object.keys(providers) as Array<keyof typeof providers>).find(
      (provider: keyof typeof providers) => (providers[provider].models as Record<string, { name: string }>)[userModel]
    ) || config.provider;

    if (!Object.keys(provider_maps).find(provider => provider_maps[provider as ProviderKey].includes(userProvider))) {
      userProvider = config.provider;
    }
    let provider = Object.keys(provider_maps).find(provider => provider_maps[provider as ProviderKey].includes(userProvider)) as ProviderKey;

    if (!providerFunctions[provider](userModel)) {
      userModel = config.model;
    }

    let model = providerFunctions[provider](userModel);

    // --- Prepare prompt for AI ---
    let aiPrompt = convoHistory.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');

    // --- AI Generation ---
    let generatedText: string;
    try {
      const result = await generateText({
        model: model,
        system: config.systemPrompt,
        prompt: aiPrompt,
      });
      generatedText = result.text;
    } catch (error) {
      console.error('Error generating AI response:', error);
      return new Response(
        JSON.stringify({ error: `Failed to generate AI response: ${error}` }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // --- Append AI response to history ---
    convoHistory.push({ role: 'assistant', content: generatedText });

    let convoTitle = userData?.title;
    if (!convoTitle) {
      try {
        convoTitle = await generateTitle(convoHistory, userModel, provider);
      } catch (error) {
        console.error('Error generating title:', error);
        convoTitle = 'Untitled Conversation';
      }
    }

    // --- Save updated history back to DB ---
    try {
      if (user_token && userData) {
        // Update existing thread
        await db.update(threadsTable)
          .set({
            title: convoTitle,
            thread: { messages: convoHistory },
            updatedAt: new Date(),
          })
          .where(eq(threadsTable.token, user_token));
      } else if (user_token) {
        // Insert new thread
        await db.insert(threadsTable).values({
          token: user_token,
          title: convoTitle || '',
          thread: { messages: convoHistory },
        } as ThreadInsert);
      }
    } catch (error) {
      console.error('Error saving conversation to database:', error);
      return new Response(
        JSON.stringify({ error: `Failed to save conversation: ${error}` }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { obj, generatedText: htmlText } = await extract(generatedText);

    return new Response(
      JSON.stringify({ ...obj, generatedText: htmlText, generatedTitle: true, token: user_token }),
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
  try {
    const { text: generatedText } = await generateText({
      model: providerFunctions[provider](userModel),
      system: config.systemPrompt,
      prompt: 'Please generate a title for the following conversation history: \n\n' + convoHistory.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n'),
    });
    return generatedText;
  } catch (error) {
    console.error('Error in generateTitle:', error);
    throw error;
  }
}

export const prerender = false;