import type { ImageSize } from '@/lib/models';
import type { CategoryName, ModeName } from '@/lib/modes';

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

const config: Config = {
    provider: 'google',
    tier: 'default',
    model: 'gemini-3.8-flash',
    imageModel: 'gpt-image-1.5',
    imageSize: '1024x1536', // portrait
    welcomeMessagePrompt: 'Based on the user\'s question or homework, ask them what specifically they want to study. Be friendly and encouraging.',
    maxThreadsPerUser: 5,
    maxMessagesPerThread: 10,
    defaultCategory: 'general',
    defaultMode: 'general',
    contentGenerationExcludeTools: ['generate-content', 'get-content-types', 'open-content', 'step-checker', 'hint-ladder', 'grade-explanation'],
};

export default config;
