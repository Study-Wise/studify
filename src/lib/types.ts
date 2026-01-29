import type { Tool } from 'ai';
import type { CategoryName, ModeName } from './modes';

// User roles
export type UserRole = "user" | "premium" | "moderator" | "admin";

export interface Category {
    name: string;
    description: string;
    modes: Record<CategoryName, Mode>;
}

export interface Mode {
    name: ModeName;
    description: string;
    icon?: string;
    prompt?: Promise<any>;
    tools?: Record<string, Tool>;
    show?: true | false;
}

export interface ReferenceSheetResult {
    content: string | null;
}

export interface StudyGuideResult {
    content: string | null;
}

export interface MindMapResult {
    content: string | null;
}

export interface FlashcardResult {
    content: string | null;
}

export interface PracticeQuestionsResult {
    content: string | null;
}

export interface ThreadAccessResult {
    isAuthorized: boolean;
    isPublic: boolean;
    threadOwner: string | null;
}

export interface GenerateWelcomeMessageParams {
    systemPrompt: string;
    convoHistory: Message[];
    userModel: string;
    provider: string;
    tools: Record<string, any>;
    requestId: string;
}

export interface ChatLeftSidebarProps {
    isPublic: boolean;
    isAuthorized: boolean;
    threadId: string;
    uploadedFiles: UploadedFile[];
    email: string;
}

export interface ChatRightSidebarProps {
    hasReferenceSheet: boolean;
    hasStudyGuide: boolean;
    hasInfographic: boolean;
    hasWebpage: boolean;
    hasMindMap: boolean;
    hasAdditionalResources: boolean;
    hasFlashcard: boolean;
    hasPracticeQuestions: boolean;
    threadId: string;
    category: string;
    mode: string;
    isAuthorized: boolean;
}

// OpenAI gpt-image models supported sizes
export type ImageSize = '1024x1024' | '1024x1536' | '1536x1024' | 'auto';

export interface ModelOption {
    name: string;
    selectableInUI?: boolean;
}

export interface Provider {
    name: string;
    models: Record<string, ModelOption>;
}

export type Providers = Record<string, Provider>;

export interface SelectorSettings {
    id: string;
    name: string;
    options: ModelOption[] | Record<string, ModelOption>;
    default: string;
}

export interface ThreadData {
    title: string;
    isDev: boolean;
    createdAt: Date;
    updatedAt: Date;
    messages: Message[];
}

export interface UploadOptions {
    metadata?: Record<string, string>;
    contentDisposition?: 'inline' | 'attachment';
    acl?: 'public-read' | 'private';
}

export interface SettingItem {
    id: string;
    name: string;
    options: ModelOption[] | Record<string, ModelOption>;
    default: string;
}

export interface SidebarSectionProps {
    title: string;
    icon: string;
    hasContent: boolean;
    threadId: string;
    viewUrl?: string;
    viewButtonText?: string;
    emptyMessage?: string;
    id: string;
    generateVerb?: string; // e.g., "Generate", "Find", "Create" (default: "Generate")
    regenerateVerb?: string; // e.g., "Regenerate", "Find New", "Recreate" (default: "Regenerate")
    isAuthorized?: boolean;
}

export interface AIGenerationOptions {
    systemPrompt: string;
    userPrompt: string;
    convoHistory: Message[];
    userModel: string;
    provider: string;
    tools?: Record<string, any>;
    maxSteps?: number;
    requestId?: string;
}

export interface TitleGenerationOptions {
    convoHistory: Message[];
    userModel: string;
    provider: string;
}

export interface UploadedFile {
    key: string;
    name: string;
    url: string;
    size: number;
    type: string;
    uploadedAt?: string;
    extractedText?: string | null;
}

// Message type for AI conversations
export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

// Check for one message params
export interface CheckForOneMessageParams {
    messages: Message[];
    threadId: string;
    category: string;
    mode: string;
    isAuthorized: boolean;
}

// Resource type for additional resources
export interface Resource {
    url: string;
    title: string;
    snippet: string;
    source: string;
}

// Application configuration
export interface Config {
    provider: string;
    model: string;
    imageModel: string;
    imageSize: ImageSize;
    systemPrompt: string;
    welcomeMessagePrompt: string;
    maxThreadsPerUser: number;
    defaultCategory: CategoryName;
    defaultMode: ModeName;
}

// Better Auth type extensions for custom fields
// Extend Better Auth's User type with our custom role field
import type { User as BetterAuthUser } from "better-auth";

export interface ExtendedUser extends BetterAuthUser {
    role?: UserRole;
}
