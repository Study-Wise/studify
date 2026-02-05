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
 * Client-side tool for opening content in a new browser tab.
 * This tool has no `execute` function because it runs on the client.
 * The AI will call this tool, and the client handles the actual window.open().
 */
const openContentTool = tool({
    description: "Open study content (study guide, reference sheet, flashcards, etc.) in a new browser tab. Use this when the user asks to view, open, or see their generated content.",
    inputSchema: z.object({
        type: z.enum(validTypes).describe('The content type to open'),
        threadId: z.string().describe('The thread ID'),
        category: z.string().describe('The category (e.g., math, science)'),
        mode: z.string().describe('The mode (e.g., algebra, physics)'),
    }),
    // No execute function - this is a client-side tool
});

export default {
    ...openContentTool,
    ready: true,
    clientSide: true, // Flag to identify client-side tools
};
