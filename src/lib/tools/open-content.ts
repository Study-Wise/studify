import { tool } from 'ai';
import { z } from 'zod';

import { getToolContext } from '@/lib/ai-service';
import { getContentTypesList } from '@/lib/content/get-types';
import { getLatestContent } from '@/lib/content/latest';

const contentTypes = getContentTypesList();

// Tool for opening content in a new browser tab.
// Checks if content exists before signaling the client to open the URL.
const openContentTool = tool({
    description: 'Open existing study content (study guide, reference sheet, flashcards, etc.) in a new browser tab. Only opens content that has already been generated — does not generate anything. If no content exists, returns an error. Use after \'generate-content\' has successfully generated content, or when the user asks to open/view their existing content.',
    inputSchema: z.object({
        type: z.enum(contentTypes as [string, ...string[]]).describe('The content type to open'),
        category: z.string().describe('The category (e.g., math, science)'),
        mode: z.string().describe('The mode (e.g., algebra, physics)'),
    }),
    execute: async ({ type, category, mode }, options) => {
        // Always use the server-verified thread, never a model-supplied ID
        const toolContext = getToolContext(options);
        if (!toolContext) {
            return JSON.stringify({
                error: true,
                message: 'Opening content is only available inside a chat thread.'
            });
        }
        const { threadId } = toolContext;

        // Check if content exists before trying to open
        const content = await getLatestContent(threadId, type);

        if (!content) {
            return JSON.stringify({
                error: true,
                message: `No ${type.replace(/-/g, ' ')} has been generated yet for this thread. Please use the 'generate-content' tool to generate it first.`
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
    label: 'Opening content',
};
