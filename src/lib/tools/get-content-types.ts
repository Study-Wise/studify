import { tool } from 'ai';
import { z } from 'zod';

const searchTool = tool({
    description: 'Get a list of content generation types supported by the system',
    inputSchema: z.object({}),
    execute: async ({  }) => {
        const files = import.meta.glob('../content/latest/**.ts', { eager: true });
        const contentTypes = Object.keys(files).map((filePath) => {
            const match = filePath.match(/\/content\/latest\/(.*)\.ts$/);
            return match ? match[1] : null;
        }).filter((type) => type !== null);

        return JSON.stringify(contentTypes, null, 2);
    },
});

export default {
    ...searchTool,
    ready: true,
};
