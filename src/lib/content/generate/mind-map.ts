import type { GatewayProviderOptions } from '@ai-sdk/gateway';
import { generateText, stepCountIs } from 'ai';
import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import config from '@/lib/ai.config';
import { buildContentSystemPrompt } from '@/lib/content';
import { parseThreadData, type Message } from '@/lib/threads';
import { modules } from '@/lib/tools';
import { saveContent } from '@/lib/content/latest';
import { buildUploadedFilesContext } from '@/lib/content/uploaded-files-context';

import { eq } from 'drizzle-orm';

export async function generateMindMap(threadId: string, userPrompt?: string) {
    const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));

    if (threads.length === 0) throw new Error('Thread not found');

    const threadData = parseThreadData(threads[0].thread);
    const messages = threadData?.messages ?? [];

    const uploadedFiles = threads[0].uploadedFiles ?? [];

    if (messages.length === 0) throw new Error('No messages found in thread');

    const uploadedFilesContext = buildUploadedFilesContext(uploadedFiles);

    const mindMapPrompt =
`${buildContentSystemPrompt('Mind Map', uploadedFilesContext)}

Create a comprehensive visual representation of the concepts, relationships, and key ideas discussed.

Output the content as a complete, interactive HTML mind map with embedded CSS and JavaScript. The mind map should be visually engaging, interactive, and clearly show relationships between concepts.

IMPORTANT: Output the raw HTML directly — do NOT wrap it in a markdown code block (no \`\`\`html or \`\`\`).

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

Layout rules (these are strict; check every one before you finish):
- No two nodes may overlap. Size each node from its label first (measure the text, e.g. with getBBox or measureText), then position nodes using those real sizes plus a gap of at least 24px. After the layout, run a collision pass that pushes apart any nodes whose boxes still intersect, and repeat until none do.
- Every label must fit inside its node. Wrap long labels onto multiple lines (at most about 18 characters per line) and grow the node to fit the wrapped text with padding. Prefer rounded rectangles or pills sized to the text over fixed-size circles. Never let text spill outside its shape.
- The whole map must fit inside the visible canvas. On load, compute the bounding box of all nodes (including labels) and set the zoom and pan so that box is centered with at least 40px padding on every side. Nothing, including the top row, may be cut off at the canvas edge.
- The "Reset View" control (and any "Fit" control) must re-run that same fit-to-view calculation, not just reset the zoom to 1 and the pan to 0. Re-fit when the window is resized and after nodes expand or collapse.

Visual design:
- Use a cohesive color palette (consider using different hues for different concept categories)
- Apply gradients and shadows for depth
- Show importance or hierarchy with node size, border weight, and font weight, but keep the layout rules above
- Include icons or symbols where appropriate
- Text must have a contrast ratio of at least 4.5:1 against its node fill. Use dark text (e.g. #1a1a1a) on light or pastel fills (mint, yellow, light blue, and so on) and white text only on dark, saturated fills. Never put white text on a light fill.
- Add subtle animations for engagement

Math formatting: If mathematical formulas are present, use MathJax or KaTeX (include the CDN) with \\(...\\) for inline math and \\[...\\] for display math.

Output a complete HTML document (including <!DOCTYPE html>, <html>, <head>, and <body> tags) with all necessary CSS and JavaScript embedded. Make it visually stunning and educational!

You may remove or modify sections as you see fit based on relevance to the topic.${userPrompt ? `\n\nADDITIONAL USER INSTRUCTIONS (follow these but do NOT include them in your output):\n${userPrompt}` : ''}`;

    const conversationMessages = messages.filter(msg => msg.role !== 'system' && msg.content !== '');
    const messagesForAI: Message[] = [
        {
            role: 'system',
            content: mindMapPrompt
        },
        ...conversationMessages,
        {
            role: 'user',
            content: 'Now generate the interactive HTML mind map based on the above conversation. Output ONLY the complete HTML document starting with <!DOCTYPE html>. Do not include any explanations, commentary, or conversation - just the HTML content.'
        }
    ];

    // Generate the mind map with Claude Haiku via the AI Gateway, falling back to GPT-5.3 Codex
    const result = await generateText({
        model: 'anthropic/claude-haiku-4.5',
        messages: messagesForAI,
        tools: Object.fromEntries(
            Object.entries(modules).filter(([key]) => !config.contentGenerationExcludeTools.includes(key))
        ),
        stopWhen: stepCountIs(5),
        temperature: 0.7,
        providerOptions: {
            gateway: {
                models: ['openai/gpt-5.3-codex'],
            } satisfies GatewayProviderOptions
        }
    });

    if (!result.text || result.text.length === 0) throw new Error('Generated mind map is empty');

    await saveContent(threadId, 'mind-map', result.text);

    return result.text;
}
