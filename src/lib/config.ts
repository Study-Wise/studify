/*
 * Application Configuration
 */

import { generateTutorPrompt } from './promptGenerator';
import type { ImageSize, CategoryName, ModeName } from './types';

const defaultCategory = 'general';
const defaultMode = 'general';

const prompt = generateTutorPrompt(defaultCategory, defaultMode);

const config: {
    provider: string;
    model: string;
    imageModel: string;
    imageSize: ImageSize;
    systemPrompt: string;
    welcomeMessagePrompt: string;
    maxThreadsPerUser: number;
    defaultCategory: CategoryName;
    defaultMode: ModeName;
} = {
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