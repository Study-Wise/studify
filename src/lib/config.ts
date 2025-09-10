/*
 * Application Configuration
 */

import prompt from './prompts/math/math.ts';

const config = {
    provider: 'openai',
    model: 'gpt-4.1',
    systemPrompt: prompt,
    maxThreadsPerUser: 5, // Maximum number of threads a user can create
};

export default config;