import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import { generateText } from '@/lib/ai-service';
import config from '@/lib/ai.config';
import { buildContentSystemPrompt } from '@/lib/content';
import { generateImage } from '@/lib/genai-image';
import { parseThreadData } from '@/lib/threads';
import { VendorError } from '@/lib/user-errors';
import { saveContent } from '@/lib/content/latest';
import { buildUploadedFilesContext } from '@/lib/content/uploaded-files-context';

import { eq } from 'drizzle-orm';

export async function generateInfographic(
    threadId: string,
    userPrompt?: string,
    userModel?: string,
    provider?: string,
) {
    userModel ??= config.model;
    provider ??= config.provider;

    const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));

    if (threads.length === 0) throw new Error('Thread not found');

    const threadData = parseThreadData(threads[0].thread);
    const messages = threadData?.messages ?? [];

    const uploadedFiles = threads[0].uploadedFiles ?? [];

    if (messages.length === 0) throw new Error('No messages found in thread');

    const uploadedFilesContext = buildUploadedFilesContext(uploadedFiles);

    // Step 1: Generate a description of what the infographic should show
    const systemPrompt =
`${buildContentSystemPrompt('Infographic', uploadedFilesContext)}

Your description should be clear, visual, and specific about:
- Main topic/title at the top
- Key concepts and their visual representation
- Important relationships or processes
- Color scheme and layout suggestions

Keep it under 1000 characters. Be specific about visual elements, diagrams, icons, and text placement.

You may remove or modify elements as you see fit based on relevance to the topic.${userPrompt ? `\n\nADDITIONAL USER INSTRUCTIONS (follow these but do NOT include them in your output):\n${userPrompt}` : ''}`;

    const descriptionResult = await generateText(
        systemPrompt,
        'Now generate the infographic description based on the above conversation. Output ONLY the visual description for the infographic. Do not include any explanations, commentary, or conversation - just the infographic description.',
        messages,
        userModel,
        provider,
        {},
        config.contentGenerationExcludeTools,
    );

    // Step 2: Generate the actual image using Google GenAI
    const imagePrompt =
`Create an educational infographic image with the following specifications:

${descriptionResult.text}

Style: Clean, modern, professional educational infographic. Use a white background with colorful accents. Include clear typography, simple icons, and visual hierarchy. Make it suitable for students and educators.`;

    const imageResult = await generateImage(imagePrompt, `${threadId}-infographic.png`);

    if (!imageResult) {
        throw new Error('Failed to generate image - No result from image generation API');
    }

    if (!imageResult.imageUrl) {
        throw new Error('Failed to generate image - No image URL returned from image generation API');
    }

    if (!imageResult.uploadResult) {
        throw new VendorError('UploadThing', 'Failed to upload image - No upload result');
    }

    if (!imageResult.uploadResult.data) {
        throw new VendorError('UploadThing', 'Failed to upload image - No data in upload result');
    }

    const infographic = {
        imageUrl: imageResult.imageUrl,
        description: descriptionResult.text,
        generatedAt: new Date().toISOString(),
        fileKey: imageResult.uploadResult.data.key
    };

    await saveContent(threadId, 'infographic', infographic);

    return infographic;
}
