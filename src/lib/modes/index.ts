import type { AvatarOptions } from '@/lib/avatar';
import generateModePrompt from '@/lib/prompt-generator';
import modeDefinitions from '@/lib/modes/definitions';

export interface Mode {
    name: string;
    description: string;
    character?: {
        name: string;
        personality: string;
        interests: string[];
        colors: {
            background: string;
            foreground: string;
        };
        appearance: Omit<AvatarOptions, 'background' | 'foreground'>;
        pfp?: string;
    };
    icon?: string;
    hook?: string;
    examplePrompts?: string[];
    prompt?: Promise<string>;
    excludedTools?: string[];
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

// Generate prompts programmatically for each mode
for (const topicKey of Object.keys(modeDefinitions)) {
    for (const modeKey of Object.keys(modeDefinitions[topicKey].modes)) {
        if (!modeDefinitions[topicKey].modes[modeKey].prompt) modeDefinitions[topicKey].modes[modeKey].prompt = Promise.resolve(generateModePrompt(modeDefinitions[topicKey].modes[modeKey], topicKey));

        modeDefinitions[topicKey].modes[modeKey].show ??= true;

        modeDefinitions[topicKey].modes[modeKey].examplePrompts ??= [
            `Explain the basics of ${modeDefinitions[topicKey].modes[modeKey].name}`,
            `Quiz me on ${modeDefinitions[topicKey].modes[modeKey].name}`,
            `What are common mistakes students make in ${modeDefinitions[topicKey].modes[modeKey].name}?`,
            `Give me a practice problem on ${modeDefinitions[topicKey].modes[modeKey].name}`,
            `Where would I use ${modeDefinitions[topicKey].modes[modeKey].name} in real life?`,
            `Help me understand a tricky idea in ${modeDefinitions[topicKey].modes[modeKey].name}`,
            `Summarize the key ideas of ${modeDefinitions[topicKey].modes[modeKey].name}`,
        ];

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
