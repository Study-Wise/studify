// Application Configuration

import type { CategoryName, ModeName } from '@/lib/modes';
import type { ImageSize } from '@/lib/models';

export interface Config {
    provider: string;
    tier: string;
    model: string;
    imageModel: string;
    imageSize: ImageSize;
    welcomeMessagePrompt: string;
    maxThreadsPerUser: number;
    maxMessagesPerThread: number;
    defaultCategory: CategoryName;
    defaultMode: ModeName;
    contentGenerationExcludeTools: string[];
}

const defaultCategory = 'general';
const defaultMode = 'general';

const config: Config = {
    provider: 'openai',
    tier: 'default',
    model: 'gpt-5.1',
    imageModel: 'gpt-image-1.5',
    imageSize: '1024x1536', // portrait
    welcomeMessagePrompt: 'Based on the user\'s question or homework, ask them what specifically they want to study. Be friendly and encouraging.',
    maxThreadsPerUser: 5, // Maximum number of threads a user can create
    maxMessagesPerThread: 10, // Maximum number of messages per thread
    defaultCategory: defaultCategory,
    defaultMode: defaultMode,
    contentGenerationExcludeTools: ['generate-content', 'get-content-types', 'open-content'],
};

export default config;
