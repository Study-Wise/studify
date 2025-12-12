import { tool } from 'ai';
import { z } from 'zod';

const searchTool = tool({
    description: "Get specific content based on it's type",
    inputSchema: z.object({
        type: z.string().describe('The content type to retrieve'),  
    }),
    execute: async ({ type }) => {
        const fileRes = import(`../content/latest/${type}.ts`);
        if (!fileRes) {
            // throw new Error(`Content type "${type}" not found.`);
            return {response: 'error', message: `Content type "${type}" not found.`, [type]: null};
        }
        return {response: 'success', [type]: fileRes};
    },
});

export default {
    ...searchTool,
    ready: true,
};
