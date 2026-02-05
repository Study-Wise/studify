import { tool } from 'ai';
import { z } from 'zod';
import { db } from '@/db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '@/db/schema';
import config from '../config';

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
    description: "Get specific content (study guide, reference sheet, flashcards, etc.) for a thread. If the content doesn't exist, it will be generated automatically.",
    inputSchema: z.object({
        type: z.enum(validTypes).describe('The content type to retrieve or generate'),
        threadId: z.string().describe('The thread ID to get/generate content for'),
        userEmail: z.string().optional().describe('The user email for authorization (optional)'),
    }),
    execute: async ({ type, threadId, userEmail }) => {
        try {
            const pascalCase = toPascalCase(type);

            // Derive function names (with special case handling)
            const special = specialCases[type] || {};
            const latestFnName = special.latestFn || `getLatest${pascalCase}`;
            const generateFnName = special.generateFn || `generate${pascalCase}`;

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

            // Content doesn't exist, generate it
            console.log(`📝 Generating ${type} for thread ${threadId}`);

            // Dynamically import the content generation function
            const generateModule = await import(`../content/generate/${type}.ts`);
            const generateFn = generateModule[generateFnName];

            let generatedContent;

            // Handle types that require model/provider
            if (requiresModelProvider.includes(type)) {
                const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));

                if (threads.length === 0) {
                    return { status: 'error', message: 'Thread not found', content: null };
                }

                const thread = threads[0];
                generatedContent = await generateFn(
                    threadId,
                    userEmail || null,
                    thread.model || config.model,
                    thread.provider || config.provider
                );
            } else {
                generatedContent = await generateFn(threadId, userEmail || null);
            }

            // Each generate function saves to DB on its own
            console.log(`✅ ${type} generated for thread ${threadId}`);

            return {
                status: 'success',
                message: `Generated new ${type}`,
                content: generatedContent,
                generated: true
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
