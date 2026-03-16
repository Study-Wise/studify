import { tool } from 'ai';
import { z } from 'zod';
import { getContentTypesList } from '@/lib/content/get-types';
import { getLatestContent } from '@/lib/content/latest';

const contentTypes = getContentTypesList();

// Tool for opening content in a new browser tab.
// Checks if content exists before signaling the client to open the URL.
const openContentTool = tool({
    description: "Open study content (study guide, reference sheet, flashcards, etc.) in a new browser tab. Use this tool in two scenarios: 1) When the user explicitly asks you to open or show their generated content, 2) After successfully using 'get-content' tool to retrieve or generate content - you should call this tool to open it for the user. Note: Users can also access generated content via the sidebar panel on the right side of the chat, or directly from the content pages which have their own generate/regenerate buttons.",
    inputSchema: z.object({
        type: z.enum(contentTypes as [string, ...string[]]).describe('The content type to open'),
        threadId: z.string().describe('The thread ID'),
        category: z.string().describe('The category (e.g., math, science)'),
        mode: z.string().describe('The mode (e.g., algebra, physics)'),
    }),
    execute: async ({ type, threadId, category, mode }) => {
        // Check if content exists before trying to open
        const content = await getLatestContent(threadId, type);

        if (!content) {
            return JSON.stringify({
                error: true,
                message: `No ${type.replace(/-/g, ' ')} has been generated yet for this thread. Please use the 'get-content' tool to generate it first.`
            });
        }

        const url = `/${category}/${mode}/${type}/${threadId}`;

        // Return a special response that signals the client to open this URL
        return JSON.stringify({
            action: 'open-content',
            url,
            type,
            threadId,
            category,
            mode,
            message: `Opening ${type.replace(/-/g, ' ')} in a new tab...`
        });
    },
});

export default {
    ...openContentTool,
    ready: true,
};
