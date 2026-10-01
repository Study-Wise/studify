import { tool } from 'ai';
import { z } from 'zod';

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
const getContentTool = tool({
    description: 'Generate or retrieve study materials for a thread. Returns existing content if available; otherwise automatically generates new content based on the conversation history and uploaded files. Use regenerate=true to force regeneration even if content already exists. After successfully generating content, call the \'open-content\' tool to open it in a new tab for the user.',
    inputSchema: z.object({
        type: z.enum(validTypes).describe('The content type to retrieve or generate'),
        threadId: z.string().describe('The thread ID to get/generate content for'),
        regenerate: z.boolean().optional().describe('Force regeneration even if content already exists (default: false)'),
        userPrompt: z.string().optional().describe('Additional instructions from the user for content generation (only used when regenerate=true)'),
    }),
    execute: async ({ type, threadId, regenerate = false, userPrompt }) => {
        let stage = 'initializing';
        try {
            const pascalCase = toPascalCase(type);

            // Derive function names (with special case handling)
            const special = specialCases[type] || {};
            const latestFnName = special.latestFn || `getLatest${pascalCase}`;
            const generateFnName = special.generateFn || `generate${pascalCase}`;

            // Skip checking for existing content if regenerate is true
            if (!regenerate) {
                stage = `loading retrieval module for "${type}"`;
                const latestModule = await import(`../content/latest/${type}.ts`);
                const getLatestFn = latestModule[latestFnName];

                if (typeof getLatestFn !== 'function') {
                    return {
                        status: 'error',
                        message: `Internal error: retrieval function "${latestFnName}" not found in module for type "${type}". This is a bug — the content module may be missing or incorrectly named.`,
                        content: null
                    };
                }

                stage = `retrieving existing "${type}" for thread "${threadId}"`;
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

            stage = `loading generation module for "${type}"`;
            const generateModule = await import(`../content/generate/${type}.ts`);
            const generateFn = generateModule[generateFnName];

            if (typeof generateFn !== 'function') {
                return {
                    status: 'error',
                    message: `Internal error: generation function "${generateFnName}" not found in module for type "${type}". This is a bug — the content module may be missing or incorrectly named.`,
                    content: null
                };
            }

            let generatedContent;

            // Only pass userPrompt when regenerating
            const promptToPass = regenerate ? userPrompt : undefined;

            stage = `generating "${type}" for thread "${threadId}"`;

            // Handle types that require model/provider (always use default for reliability)
            generatedContent = await generateFn(threadId, promptToPass || null);

            if (generatedContent === null || generatedContent === undefined) {
                return {
                    status: 'error',
                    message: `Generation of "${type}" completed but returned empty content for thread "${threadId}". The thread may have no messages, or an upstream AI/API call may have returned nothing.`,
                    content: null
                };
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

            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorCause = error instanceof Error && error.cause ? error.cause : undefined;

            return {
                status: 'error',
                message: `Failed while ${stage}: ${errorMessage}`,
                cause: errorCause,
                content: null
            };
        }
    },
});

export default {
    ...getContentTool,
    ready: true,
    label: 'Generating content',
};
