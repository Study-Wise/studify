/*
 * Application Configuration
 */

import prompt from './prompt.ts';

const config = {
    provider: 'openai',
    model: 'gpt-4.1',
    systemPrompt: prompt,
    token_length: 32,
    token_expiry: 60 * 60 * 24, // 24 hours in seconds (s in m) * (m in h) * (h in d)
};

export default config;