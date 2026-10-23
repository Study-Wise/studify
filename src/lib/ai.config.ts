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
    streamHtmlInterval: number;
    defaultCategory: CategoryName;
    defaultMode: ModeName;
    contentGenerationExcludeTools: string[];
}

export default {
    provider: 'google',
    tier: 'default',
    model: 'gemini-3.8-flash',
    imageModel: 'gpt-image-1.5',
    imageSize: '1024x1536', // portrait
    welcomeMessagePrompt: 'Based on the user\'s question or homework, ask them what specifically they want to study. Be friendly and encouraging.',
    maxThreadsPerUser: 5,
    maxMessagesPerThread: 10,
    streamHtmlInterval: 500,
    defaultCategory: 'general',
    defaultMode: 'general',
    contentGenerationExcludeTools: ['generate-content', 'get-content-types', 'open-content', 'step-checker', 'hint-ladder', 'grade-explanation'],
} satisfies Config;
