import type { Tool } from 'ai';
import type { CategoryName, ModeName } from './modes';
import type { User, Session } from "better-auth";

interface Category {
    name: string;
    description: string;
    modes: Record<CategoryName, Mode>;
}

interface Mode {
    name: ModeName;
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

interface FlashcardResult {
    content: string | null;
}

interface PracticeQuestionsResult {
    content: string | null;
}

interface ThreadAccessResult {
    isAuthorized: boolean;
    isPublic: boolean;
    threadOwner: string | null;
}

interface GenerateWelcomeMessageParams {
    systemPrompt: string;
    convoHistory: Message[];
    userModel: string;
    provider: string;
    tools: Record<string, any>;
    requestId: string;
}

interface ChatLeftSidebarProps {
    isPublic: boolean;
    isAuthorized: boolean;
    threadId: string;
    uploadedFiles: UploadedFile[];
    email: string;
}

interface ChatRightSidebarProps {
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

// OpenAI image generation supported sizes
type ImageSize = '1024x1024' | '1024x1536' | '1536x1024' | 'auto';

interface ModelOption {
    name: string;
    selectableInUI?: boolean;
}

interface Provider {
    name: string;
    models: Record<string, ModelOption>;
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
    messages: Message[];
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

interface SidebarSectionProps {
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

interface AIGenerationOptions {
    systemPrompt: string;
    userPrompt: string;
    convoHistory: Message[];
    userModel: string;
    provider: string;
    tools?: Record<string, any>;
    maxSteps?: number;
    requestId?: string;
}

interface TitleGenerationOptions {
    convoHistory: Message[];
    userModel: string;
    provider: string;
}

interface UploadedFile {
    key: string;
    name: string;
    url: string;
    size: number;
    type: string;
    uploadedAt?: string;
    extractedText?: string | null;
}

type NeonUser = User;
type NeonSession = Session;

// Message type for AI conversations
interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

// Check for one message params
interface CheckForOneMessageParams {
    messages: Message[];
    threadId: string;
    category: string;
    mode: string;
    isAuthorized: boolean;
}

// Resource type for additional resources
interface Resource {
    url: string;
    title: string;
    snippet: string;
    source: string;
}

export type {
    Mode,
    Category,
    ModeName,
    CategoryName,
    Tool,
    ReferenceSheetResult,
    StudyGuideResult,
    MindMapResult,
    FlashcardResult,
    PracticeQuestionsResult,
    ThreadAccessResult,
    GenerateWelcomeMessageParams,
    ChatLeftSidebarProps,
    ChatRightSidebarProps,
    ImageSize,
    ModelOption,
    Provider,
    Providers,
    SelectorSettings,
    ThreadData,
    UploadOptions,
    SettingItem,
    SidebarSectionProps,
    AIGenerationOptions,
    TitleGenerationOptions,
    UploadedFile,
    User as BetterAuthUser, 
    Session as BetterAuthSession,
    NeonUser,
    NeonSession,
    Message,
    CheckForOneMessageParams,
    Resource
};