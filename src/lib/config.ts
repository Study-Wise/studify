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
    maxMessagesPerThread: 10, // Maximum number of messages per thread
    defaultCategory: defaultCategory,
    defaultMode: defaultMode,
};

// Content types that can be generated - used for exclusion lists in prompts
export const contentTypes = [
    'Study Guide',
    'Reference Sheet',
    'Flashcards',
    'Practice Questions',
    'Mind Map',
    'Webpage',
    'Infographic',
    'Additional Resources',
] as const;

// Helper to get exclusion list for a specific content type
export function getExclusionList(currentType: string): string {
    const exclusions = contentTypes.filter(type => type !== currentType);
    return exclusions.map(type => `- ${type}`).join('\n');
}


export default config;