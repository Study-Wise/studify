import type { Tool } from 'ai';

export interface ToolModule {
    default: Tool & { ready?: boolean; label?: string };
}

export interface ToolContext {
    threadId: string;
    email: string;
}

export function getToolContext<T>(options: { experimental_context?: T }): ToolContext | null {
    if (
        options.experimental_context && typeof options.experimental_context === 'object' &&
        'threadId' in options.experimental_context && typeof options.experimental_context.threadId === 'string' && options.experimental_context.threadId &&
        'email' in options.experimental_context && typeof options.experimental_context.email === 'string' && options.experimental_context.email
    ) return { threadId: options.experimental_context.threadId, email: options.experimental_context.email };
    return null;
}

export const modules: Record<string, Tool> = {};
export const labels: Record<string, string> = {};

for (const [path, module] of Object.entries(import.meta.glob<ToolModule>('./tools/*.ts', { eager: true }))) {
    if (module.default.ready) {
        const toolName = path.replace('./tools/', '').replace('.ts', '');
        modules[toolName] = module.default;
        if (module.default.label) labels[toolName] = module.default.label;
    }
}
