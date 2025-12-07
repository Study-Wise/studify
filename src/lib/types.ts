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

interface ReferenceSheetResult {
    content: string | null;
}

interface StudyGuideResult {
    content: string | null;
}

interface MindMapResult {
    content: string | null;
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
    hasWebpage: boolean;
    hasMindMap: boolean;
    threadId: string;
    category: string;
    mode: string;
}

type InfographicSpeed = 'FLASH' | 'TURBO' | 'DEFAULT' | 'QUALITY';
type ImageSize = '1024x1024' | '1024x1536' | '1536x1024';

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

export type {
    Mode,
    Category,
    Tool,
    ReferenceSheetResult,
    StudyGuideResult,
    MindMapResult,
    ThreadAccessResult,
    ChatRightSidebarProps,
    ImageSize,
    InfographicSpeed,
    IdeogramResponse,
    ModelOption,
    Provider,
    Providers,
    SelectorSettings,
    ThreadData,
    UploadOptions,
    SettingItem
};