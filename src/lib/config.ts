/*
 * Application Configuration
 */

import prompt from './prompts/math/general.js';
import type { ImageSize } from './types';

const config = {
    provider: 'openai',
    model: 'gpt-4.1',
    imageModel: 'gpt-image-1', // OpenAI image generation model
    imageSize: '1024x1536' as ImageSize, // OpenAI image size (portrait)
    systemPrompt: prompt,
    maxThreadsPerUser: 5, // Maximum number of threads a user can create
};

export default config;