import type { Tool } from 'ai';

import type { ToolModule } from '@/lib/ai-service';

const tools: Record<string, Tool> = {};

// Dynamically import all tool files
const toolModules = import.meta.glob('./tools/*.ts', { eager: true });

for (const [path, module] of Object.entries(toolModules)) {
    const tool = (module as ToolModule).default;
    if (tool.ready) {
        const toolName = path.replace('./tools/', '').replace('.ts', '');
        tools[toolName] = tool;
    }
}

export default tools;
