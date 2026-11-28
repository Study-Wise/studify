import { tool } from 'ai';
import { z } from 'zod';
import { getToolContext } from '@/lib/tools';

const validTypes: [string, ...string[]] = [
    'study-guide',
    'reference-sheet',
    'infographic',
    'webpage',
    'mind-map',
    'additional-resources',
    'flashcards',
    'practice-questions'
];

const specialCases: Record<string, { latestFn?: string; generateFn?: string }> = {
    'additional-resources': {
        latestFn: 'getLatestResources',
        generateFn: 'generateResources',
    },
};

const getContentTool = tool({
    description: 'Generate or retrieve study materials for the current thread. Returns existing content if available; otherwise automatically generates new content based on the conversation history and uploaded files. Use regenerate=true to force regeneration even if content already exists. After successfully generating content, call the \'open-content\' tool to open it in a new tab for the user.',
    inputSchema: z.object({
        type: z.enum(validTypes).describe('The content type to retrieve or generate'),
        regenerate: z.boolean().optional().describe('Force regeneration even if content already exists (default: false)'),
        userPrompt: z.string().optional().describe('Additional instructions from the user for content generation (only used when regenerate=true)'),
    }),
    execute: async ({ type, regenerate = false, userPrompt }, options) => {
        let stage = 'initializing';

        const toolContext = getToolContext(options);
        if (!toolContext) {
            return {
                status: 'error',
                message: 'Content generation is only available inside a chat thread.',
                content: null
            };
        }
        const { threadId } = toolContext;

        try {
            const camel = type.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            const pascalCase = camel.charAt(0).toUpperCase() + camel.slice(1);

            const special = specialCases[type] || {};
            const latestFnName = special.latestFn || `getLatest${pascalCase}`;
            const generateFnName = special.generateFn || `generate${pascalCase}`;

            if (!regenerate) {
                stage = `loading retrieval module for "${type}"`;
                const getLatestFn = (await import(`../content/latest/${type}.ts`))[latestFnName];

                if (typeof getLatestFn !== 'function') {
                    return {
                        status: 'error',
                        message: `Internal error: retrieval function "${latestFnName}" not found in module for type "${type}". This is a bug — the content module may be missing or incorrectly named.`,
                        content: null
                    };
                }

                stage = `retrieving existing "${type}" for thread "${threadId}"`;
                const existingContent = await getLatestFn(threadId, { email: toolContext.email });

                if (
                    typeof existingContent === 'object' &&
                    existingContent !== null
                        ? 'content' in existingContent ? existingContent.content !== null : 'imageUrl' in existingContent
                        : existingContent !== null
                ) {
                    return {
                        status: 'success',
                        message: `Retrieved existing ${type}`,
                        content: typeof existingContent === 'object' && 'content' in existingContent
                            ? existingContent.content
                            : existingContent,
                        generated: false
                    };
                }
            }

            stage = `loading generation module for "${type}"`;
            const generateFn = (await import(`../content/generate/${type}.ts`))[generateFnName];

            if (typeof generateFn !== 'function') {
                return {
                    status: 'error',
                    message: `Internal error: generation function "${generateFnName}" not found in module for type "${type}". This is a bug — the content module may be missing or incorrectly named.`,
                    content: null
                };
            }

            let generatedContent;

            const promptToPass = regenerate ? userPrompt : undefined;

            stage = `generating "${type}" for thread "${threadId}"`;

            generatedContent = await generateFn(threadId, promptToPass || null);

            if (generatedContent === null || generatedContent === undefined) {
                return {
                    status: 'error',
                    message: `Generation of "${type}" completed but returned empty content for thread "${threadId}". The thread may have no messages, or an upstream AI/API call may have returned nothing.`,
                    content: null
                };
            }

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
                message: `Failed while ${stage}: ${error instanceof Error ? error.message : error}`,
                cause: error instanceof Error && error.cause ? error.cause : undefined,
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
