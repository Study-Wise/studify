/*
 * Application Configuration
 * -----------------------
 * Contains global configuration settings for the application.
 */


import prompt from './prompt.ts';

const config = {
  provider: 'openai',
  model: 'gpt-4.1',
  systemPrompt: prompt,
};

export default config;