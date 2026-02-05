import { tool } from 'ai';
import { z } from 'zod';

const validTypes = [
    'study-guide',
    'reference-sheet',
    'infographic',
    'webpage',
    'mind-map',
    'resources',
    'flashcards',
    'practice-questions'
] as const;

/**
 * Tool for opening content in a new browser tab.
 * Returns a special response that the client handles to open the URL.
 */
const openContentTool = tool({
    description: "Open study content (study guide, reference sheet, flashcards, etc.) in a new browser tab. Use this when the user asks to view, open, or see their generated content.",
    inputSchema: z.object({
        type: z.enum(validTypes).describe('The content type to open'),
        threadId: z.string().describe('The thread ID'),
        category: z.string().describe('The category (e.g., math, science)'),
        mode: z.string().describe('The mode (e.g., algebra, physics)'),
    }),
    execute: async ({ type, threadId, category, mode }) => {
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
