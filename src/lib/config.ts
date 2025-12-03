/*
 * Application Configuration
 */

import prompt from './prompts/math/general.js';

const config = {
    provider: 'openai',
    model: 'gpt-4.1',
    systemPrompt: prompt,
    maxThreadsPerUser: 5, // Maximum number of threads a user can create
    infographicSpeed: 'TURBO' as 'FLASH' | 'TURBO' | 'DEFAULT' | 'QUALITY', // Ideogram rendering speed
};

export default config;