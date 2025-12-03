import type { Tool } from 'ai';

interface Category {
    name: string;
    description: string;
    modes: Record<string, Mode>;
}

interface Mode {
    name: string;
    description: string;
    icon?: string;
    prompt?: Promise<any>;
    tools?: Record<string, Tool>;
    show?: true | false;
}    

// Legacy Tool interface for backward compatibility
interface LegacyTool {
    type: 'function';
    ready: boolean;
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
    execute: (params: any) => Promise<any>;
}

interface ReferenceSheetResult {
    content: string | null;
    precedingText: string;
    followingText: string;
}

interface StudyGuideResult {
    content: string | null;
    precedingText: string;
    followingText: string;
}

interface ThreadAccessResult {
    isAuthorized: boolean;
    isPublic: boolean;
    threadOwner: string | null;
}

interface ChatRightSidebarProps {
    hasReferenceSheet: boolean;
    hasStudyGuide: boolean;
    hasInfographic: boolean;
    threadId: string;
    category: string;
    mode: string;
}

type InfographicSpeed = 'FLASH' | 'TURBO' | 'DEFAULT' | 'QUALITY';

interface IdeogramResponse {
    data: Array<{
        url: string;
        prompt: string;
        resolution: string;
        is_image_safe: boolean;
        seed: number;
    }>;
}

interface ModelOption {
    name: string;
}

interface Provider {
    name: string;
    models: Record<string, { name: string }>;
}

type Providers = Record<string, Provider>;

interface SelectorSettings {
    id: string;
    name: string;
    options: ModelOption[] | Record<string, ModelOption>;
    default: string;
}

interface ThreadData {
    title: string;
    isDev: boolean;
    createdAt: Date;
    updatedAt: Date;
    messages: any[];
}

interface UploadOptions {
    metadata?: Record<string, string>;
    contentDisposition?: 'inline' | 'attachment';
    acl?: 'public-read' | 'private';
}

interface SettingItem {
    id: string;
    name: string;
    options: ModelOption[] | Record<string, ModelOption>;
    default: string;
}

export type { Mode, Category, LegacyTool, Tool, ReferenceSheetResult, StudyGuideResult, ThreadAccessResult, ChatRightSidebarProps, InfographicSpeed, IdeogramResponse, ModelOption, Provider, Providers, SelectorSettings, ThreadData, UploadOptions, SettingItem };