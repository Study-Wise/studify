import type { Tool } from 'ai';

import type { ToolModule } from '@/lib/ai-service';

export const modules: Record<string, Tool> = {};
export const labels: Record<string, string> = {};

// Dynamically import all tool files
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
