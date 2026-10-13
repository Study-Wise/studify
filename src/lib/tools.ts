import type { Tool } from 'ai';

export interface ToolModule {
    default: Tool & { ready?: boolean; label?: string };
}

export type ToolRecord = Record<string, Tool>;

// Server-verified request context passed to tool executions via `experimental_context`.
// Tools that touch thread data must use this instead of model-supplied IDs.
export interface ToolContext {
    threadId: string;
    email: string;
}

export const modules: Record<string, Tool> = {};
export const labels: Record<string, string> = {};

const toolModules = import.meta.glob('./tools/*.ts', { eager: true });

for (const [path, module] of Object.entries(toolModules)) {
    const tool = (module as ToolModule).default;
    if (tool.ready) {
        const toolName = path.replace('./tools/', '').replace('.ts', '');
        modules[toolName] = tool;
        if (tool.label) {
            labels[toolName] = tool.label;
        }
    }
}
