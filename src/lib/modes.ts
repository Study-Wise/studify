import modeDefinitions from '@/lib/mode-definitions';
import generateModePrompt from '@/lib/prompt-generator';

export interface Mode {
    name: string;
    description: string;
    character?: {
        name: string;
        personality: string;
        interests: string[];
    };
    icon?: string;
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
