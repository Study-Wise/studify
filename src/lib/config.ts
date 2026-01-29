/*
 * Application Configuration
 */

import { generateTutorPrompt } from './promptGenerator';

import type { Config } from './types';

const defaultCategory = 'general';
const defaultMode = 'general';

const prompt = generateTutorPrompt(defaultCategory, defaultMode);

const config: Config = {
    provider: 'openai',
    model: 'gpt-4.1',
    imageModel: 'gpt-image-1',
    imageSize: '1024x1536', // portrait
    systemPrompt: prompt,
    welcomeMessagePrompt: 'Based on the user\'s question or homework, ask them what specifically they want to study. Be friendly and encouraging.',
    maxThreadsPerUser: 5, // Maximum number of threads a user can create
    defaultCategory: defaultCategory,
    defaultMode: defaultMode,
};

export default config;