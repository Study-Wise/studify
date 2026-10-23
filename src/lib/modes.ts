import config from '@/lib/ai.config';
import margoPagePrompt from '@/lib/margo-page-prompt';
import studyModeDefinitions from '@/lib/mode-definitions';
import generateModePrompt from '@/lib/prompt-generator';
import { modules } from '@/lib/tools';
import type { ToolRecord } from '@/lib/tools';

export interface Mode {
    modeName: string;
    description: string;
    characterName?: string;
    personality?: string;
    interests?: string;
    icon?: string;
    prompt?: Promise<string>;
    tools?: ToolRecord;
    show?: boolean;
    desmos?: boolean;
    sidebarSections?: {
        shareSettings?: boolean;
        uploadedFiles?: boolean;
        studyMaterials?: boolean;
    };
}

export interface Category {
    name: string;
    description: string;
    modes: Record<string, Mode>;
}

const modeDefinitions: Record<string, Category> = {
    ...studyModeDefinitions,
    support: {
        name: 'Support',
        description: 'Get help with Studify itself: how the app works, issues, and feedback',
        modes: {
            margo: {
                show: false,
                modeName: 'Margo Page',
                description: 'Chat with Margo Page from the Studify support team about the app, issues, and feedback',
                icon: '🎧',
                prompt: Promise.resolve(margoPagePrompt),
                sidebarSections: { studyMaterials: false },
                tools: Object.fromEntries(Object.entries(modules).filter(([key]) => !config.contentGenerationExcludeTools.includes(key))),
            },
        },
    },
}

// Generate prompts programmatically for each mode
for (const topicKey of Object.keys(modeDefinitions)) {
    for (const modeKey of Object.keys(modeDefinitions[topicKey].modes)) {
        if (!modeDefinitions[topicKey].modes[modeKey].prompt) modeDefinitions[topicKey].modes[modeKey].prompt = Promise.resolve(generateModePrompt(modeDefinitions[topicKey].modes[modeKey], topicKey));

        if (!modeDefinitions[topicKey].modes[modeKey].tools) modeDefinitions[topicKey].modes[modeKey].tools = modules;

        modeDefinitions[topicKey].modes[modeKey].sidebarSections = {
            shareSettings: true,
            uploadedFiles: true,
            studyMaterials: true,
            ...modeDefinitions[topicKey].modes[modeKey].sidebarSections
        };
    }
}

export type CategoryName = keyof typeof modeDefinitions;

export type ModeName = {
    [K in keyof typeof modeDefinitions]: keyof typeof modeDefinitions[K]['modes']
}[keyof typeof modeDefinitions];

export default modeDefinitions;
