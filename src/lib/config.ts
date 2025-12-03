/*
 * Application Configuration
 */

import prompt from './prompts/math/general.js';
import type { InfographicSpeed, ImageSize } from './types';

const config = {
    provider: 'openai',
    model: 'gpt-4.1',
    imageModel: 'gpt-image-1', // OpenAI image generation model
    imageSize: '1024x1792' as ImageSize, // OpenAI image size (portrait)
    systemPrompt: prompt,
    maxThreadsPerUser: 5, // Maximum number of threads a user can create
    infographicSpeed: 'DEFAULT' as InfographicSpeed, // Ideogram rendering speed
};

export default config;