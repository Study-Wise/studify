import { generateText } from 'ai';
import type { GatewayProviderOptions } from '@ai-sdk/gateway';
import { buildContentSystemPrompt } from '../../content';
import { db } from '@/db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '@/db/schema';
import type { ThreadData, UploadedFile } from '../../types';

function buildUploadedFilesContext(uploadedFiles: UploadedFile[]): string {
    const filesWithText = uploadedFiles.filter(f => f.extractedText);
    if (filesWithText.length === 0) return '';

    const fileContents = filesWithText
        .map(f => `--- File: ${f.name} ---\n${f.extractedText}`)
        .join('\n\n');

    return `\n\n### Uploaded Files Content\nThe user has uploaded the following files. Include this content in your analysis:\n\n${fileContents}`;
}

export async function generateMindMap(threadId: string, _userEmail: string | null, userPrompt?: string) {
    // Fetch the thread from database
    const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));

    if (threads.length === 0) {
        throw new Error('Thread not found');
    }

    const thread = threads[0];

    // Get conversation history directly from thread data
    const threadData = thread.thread as ThreadData;
    const messages = threadData?.messages ?? [];

    // Get uploaded files
    const uploadedFiles = (thread.uploadedFiles as UploadedFile[]) ?? [];

    if (messages.length === 0) {
        throw new Error('No messages found in thread');
    }

    // Build uploaded files context
    const uploadedFilesContext = buildUploadedFilesContext(uploadedFiles);

    // Create a mind map specific prompt
    const mindMapPrompt = `${buildContentSystemPrompt('Mind Map', uploadedFilesContext)}

Create a comprehensive visual representation of the concepts, relationships, and key ideas discussed.

Output the content as a complete, interactive HTML mind map with embedded CSS and JavaScript. The mind map should be visually engaging, interactive, and clearly show relationships between concepts.

Requirements:
1. Create a hierarchical mind map structure with the main topic at the center
2. Branch out to major concepts, then to sub-concepts and details
3. Use color coding to distinguish between different concept categories
4. Make nodes interactive (clickable to expand/collapse, hover for details)
5. Include clear visual connections showing relationships between concepts
6. Use modern CSS for styling (gradients, shadows, smooth animations)
7. Make it responsive and mobile-friendly
8. Include zoom and pan capabilities for large mind maps
9. Add a legend explaining the color coding and symbols used
10. Use proper semantic HTML structure

Structure to include:
- Central topic/theme from the conversation
- Main concepts as primary branches (3-7 major concepts)
- Sub-concepts and supporting details as secondary branches
- Key formulas, definitions, or examples as leaf nodes
- Cross-references showing relationships between different branches
- Visual indicators for important concepts (stars, highlights, etc.)

Technical implementation:
- Use SVG or Canvas for the mind map visualization
- Include smooth transitions and animations
- Add interactive features: click to expand/collapse, drag to pan, scroll to zoom
- Use a tree or radial layout algorithm for optimal node positioning
- Include tooltips with additional details on hover
- Make it printable with a clean layout

Visual design:
- Use a cohesive color palette (consider using different hues for different concept categories)
- Apply gradients and shadows for depth
- Use different node sizes to show importance or hierarchy
- Include icons or symbols where appropriate
- Ensure good contrast for readability
- Add subtle animations for engagement

Math formatting: If mathematical formulas are present, use MathJax or KaTeX (include the CDN) with \\(...\\) for inline math and \\[...\\] for display math.

Output a complete HTML document (including <!DOCTYPE html>, <html>, <head>, and <body> tags) with all necessary CSS and JavaScript embedded. Make it visually stunning and educational!

You may remove or modify sections as you see fit based on relevance to the topic.${userPrompt ? `\n\nADDITIONAL USER INSTRUCTIONS (follow these but do NOT include them in your output):\n${userPrompt}` : ''}`;

    // Build messages array with system prompt first, then conversation history
    const conversationMessages = messages.filter(msg => msg.role !== 'system');
    const messagesForAI = [
        {
            role: 'system' as const,
            content: mindMapPrompt
        },
        ...conversationMessages
    ];

    // Generate the mind map using Vercel's v0 model (optimized for HTML generation)
    // with automatic fallback to Claude Sonnet 4.5 via AI Gateway
    const result = await generateText({
        model: 'vercel/v0-1.5-md',
        messages: messagesForAI,
        temperature: 0.7,
        providerOptions: {
            gateway: {
                models: ['anthropic/claude-sonnet-4.5']
            } satisfies GatewayProviderOptions
        }
    });

    if (!result.text || result.text.length === 0) {
        throw new Error('Generated mind map is empty');
    }

    // Save to database
    await db.update(threadsTable)
        .set({ generatedMindMap: result.text, updatedAt: new Date() })
        .where(eq(threadsTable.id, threadId));

    return result.text;
}
