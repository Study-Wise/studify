import { tool } from 'ai';
import { z } from 'zod';
import config from '@/lib/config';

// Convert kebab-case to camelCase
const toCamelCase = (str: string) => str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

// Convert kebab-case to PascalCase
const toPascalCase = (str: string) => {
    const camel = toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
};

const validTypes = [
    'study-guide',
    'reference-sheet',
    'infographic',
    'webpage',
    'mind-map',
    'additional-resources',
    'flashcards',
    'practice-questions'
] as const;

// Special cases that don't follow the standard naming convention
const specialCases: Record<string, { latestFn?: string; generateFn?: string }> = {
    'additional-resources': {
        latestFn: 'getLatestResources',
        generateFn: 'generateResources',
    },
};

// Types that require model/provider for generation
const requiresModelProvider = ['infographic'];

const getContentTool = tool({
    description: "Generate or retrieve study materials for a thread. Returns existing content if available; otherwise automatically generates new content based on the conversation history and uploaded files. Use regenerate=true to force regeneration even if content already exists. After successfully generating content, call the 'open-content' tool to open it in a new tab for the user.",
    inputSchema: z.object({
        type: z.enum(validTypes).describe('The content type to retrieve or generate'),
        threadId: z.string().describe('The thread ID to get/generate content for'),
        userEmail: z.string().optional().describe('The user email for authorization (optional)'),
        regenerate: z.boolean().optional().describe('Force regeneration even if content already exists (default: false)'),
        userPrompt: z.string().optional().describe('Additional instructions from the user for content generation (only used when regenerate=true)'),
    }),
    execute: async ({ type, threadId, userEmail, regenerate = false, userPrompt }) => {
        try {
            const pascalCase = toPascalCase(type);

            // Derive function names (with special case handling)
            const special = specialCases[type] || {};
            const latestFnName = special.latestFn || `getLatest${pascalCase}`;
            const generateFnName = special.generateFn || `generate${pascalCase}`;

            // Skip checking for existing content if regenerate is true
            if (!regenerate) {
                // Dynamically import the latest content retrieval function
                const latestModule = await import(`../content/latest/${type}.ts`);
                const getLatestFn = latestModule[latestFnName];

                // First, try to get existing content
                const existingContent = await getLatestFn(threadId);

                // Check if content exists (handle different return types)
                const hasContent = typeof existingContent === 'object' && existingContent !== null
                    ? 'content' in existingContent ? existingContent.content !== null : 'imageUrl' in existingContent
                    : existingContent !== null;

                if (hasContent) {
                    const content = typeof existingContent === 'object' && 'content' in existingContent
                        ? existingContent.content
                        : existingContent;

                    return {
                        status: 'success',
                        message: `Retrieved existing ${type}`,
                        content,
                        generated: false
                    };
                }
            }

            // Content doesn't exist or regenerate requested, generate it
            // Dynamically import the content generation function
            const generateModule = await import(`../content/generate/${type}.ts`);
            const generateFn = generateModule[generateFnName];

            let generatedContent;

            // Only pass userPrompt when regenerating
            const promptToPass = regenerate ? userPrompt : undefined;

            // Handle types that require model/provider (always use default for reliability)
            if (requiresModelProvider.includes(type)) {
                generatedContent = await generateFn(
                    threadId,
                    userEmail || null,
                    config.model,
                    config.provider,
                    promptToPass
                );
            }
            else {
                generatedContent = await generateFn(threadId, userEmail || null, promptToPass);
            }

            // Each generate function saves to DB on its own
            return {
                status: 'success',
                message: regenerate ? `Regenerated ${type}` : `Generated new ${type}`,
                content: generatedContent,
                generated: true,
                regenerated: regenerate
            };

        } catch (error) {
            console.error(`❌ Error getting/generating ${type}:`, error);
            return {
                status: 'error',
                message: error instanceof Error ? error.message : `Failed to get/generate ${type}`,
                content: null
            };
        }
    },
});

export default {
    ...getContentTool,
    ready: true,
};
