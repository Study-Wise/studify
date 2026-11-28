import { tool } from 'ai';
import Exa from 'exa-js';
import { z } from 'zod';

const exa = new Exa(import.meta.env.EXA_SEARCH_API_KEY || process.env.EXA_SEARCH_API_KEY);

const searchTool = tool({
    description: 'Search the web for information',
    inputSchema: z.object({
        query: z.string().describe('The query to search for'),
    }),
    execute: async ({ query }) => {
        try {
            const searchResult = await exa.searchAndContents(
                query,
                {
                    text: true,
                    numResults: 5
                }
            );

            return JSON.stringify(searchResult, null, 2);
        } catch (error) {
            return JSON.stringify({ error: true, message: `Search failed for query "${query}": ${error instanceof Error ? error.message : error}` }, null, 2);
        }
    },
});

export default {
    ...searchTool,
    ready: true,
    label: 'Searching the web',
};
