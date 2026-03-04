import type { Tool } from 'ai';
import type { CategoryName, ModeName } from '@/lib/modes';

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
    prompt?: Promise<string>;
    tools?: ToolRecord;
    show?: true | false;
    desmos?: boolean;
}

export interface ToolModule {
    default: Tool & { ready?: boolean; clientSide?: boolean };
}

export type ToolRecord = Record<string, Tool & { clientSide?: boolean }>;

export interface ReferenceSheetResult {
    content: string | null;
}

export interface StudyGuideResult {
    content: string | null;
}

export interface MindMapResult {
    content: string | null;
}

// Structured flashcard type for generateObject output
export interface Flashcard {
    front: string;
    back: string;
}

// Flashcard data stored in database - includes both text summary and structured questions
export interface FlashcardData {
    text: string;
    questions: Flashcard[];
}

export interface InfographicData {
    imageUrl: string;
    description: string;
    generatedAt: string;
    fileKey: string;
}

export interface SlideshowData {
    content: string;
    html: string;
}

export interface ThreadContent {
    [key: string]: string | InfographicData | FlashcardData | SlideshowData | undefined;
    'study-guide'?: string;
    'reference-sheet'?: string;
    'infographic'?: InfographicData;
    'webpage'?: string;
    'mind-map'?: string;
    'additional-resources'?: string;
    'flashcards'?: FlashcardData | string;
    'practice-questions'?: string;
    'slideshow'?: SlideshowData;
    'summary'?: string;
}

export interface MarkedToken {
    type: string;
    [key: string]: string | number | boolean | undefined | object | unknown;
}

export interface FlashcardResult {
    content: FlashcardData | string | null;
}

export interface PracticeQuestionsResult {
    content: string | null;
}

export interface SummaryResult {
    content: string | null;
}

export interface SlideshowResult {
    content: string | null;
    html: string | null;
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
    tools: ToolRecord;
    requestId: string;
}

export interface ChatLeftSidebarProps {
    isPublic: boolean;
    isAuthorized: boolean;
    threadId: string;
    uploadedFiles: UploadedFile[];
    email: string;
    category: string;
    mode: string;
}

export interface ChatRightSidebarProps {
    threadId: string;
    category: string;
    mode: string;
    isAuthorized: boolean;
    isPublic: boolean;
}

export interface ThreadContentStatus {
    hasReferenceSheet: boolean;
    hasStudyGuide: boolean;
    hasInfographic: boolean;
    hasWebpage: boolean;
    hasMindMap: boolean;
    hasAdditionalResources: boolean;
    hasFlashcard: boolean;
    hasPracticeQuestions: boolean;
    hasSlideshow: boolean;
    hasSummary: boolean;
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
    title?: string;
    isDev?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
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
    tools?: ToolRecord;
    excludeTools?: string[];
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
    maxMessagesPerThread: number;
    defaultCategory: CategoryName;
    defaultMode: ModeName;
}

// Better Auth type extensions for custom fields
// Extend Better Auth's User type with our custom role field
import type { User as BetterAuthUser } from "better-auth";

export interface ExtendedUser extends BetterAuthUser {
    role?: UserRole;
}

// Client-side tool call that needs to be executed in the browser
export interface ClientToolCall {
    toolName: string;
    toolCallId: string;
    args: Record<string, string | number | boolean | undefined>;
}

// AI generation result with potential client-side tool calls
export interface AIGenerationResult {
    text: string;
    clientToolCalls: ClientToolCall[];
}

export interface AuthUtils {
    showError: (message: string) => void;
    hideError: () => void;
    getRedirectUrl: () => void;
    callbackURL: string;
}
