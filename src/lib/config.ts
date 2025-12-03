/*
 * Application Configuration
 */

import prompt from './prompts/math/general.js';
import type { InfographicSpeed, ImageSize } from './types';

const config = {
    provider: 'openai',
    model: 'gpt-4.1',
    imageModel: 'gpt-image-1',
    imageSize: '1024x1536' as ImageSize, // portrait
    systemPrompt: prompt,
    maxThreadsPerUser: 5, // Maximum number of threads a user can create
    infographicSpeed: 'DEFAULT' as InfographicSpeed, // Ideogram rendering speed
    defaultCategory: 'math',
    defaultMode: 'general',
};

export default config;