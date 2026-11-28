import { experimental_generateImage as generateGatewayImage } from 'ai';
import { db } from '@/db/initialize';
import { threadsTable } from '@/db/schema';
import { generateText } from '@/lib/ai-service';
import config from '@/lib/ai.config';
import { buildContentSystemPrompt } from '@/lib/content';
import { parseThreadData } from '@/lib/threads';
import { uploadFile } from '@/lib/uploadthing';
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

    const messages = parseThreadData(threads[0].thread)?.messages ?? [];

    if (messages.length === 0) throw new Error('No messages found in thread');

    const systemPrompt =
`${buildContentSystemPrompt('Infographic', buildUploadedFilesContext(threads[0].uploadedFiles ?? []))}

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

    const imagePrompt =
`Create an educational infographic image with the following specifications:

${descriptionResult.text}

Style: Clean, modern, professional educational infographic. Use a white background with colorful accents. Include clear typography, simple icons, and visual hierarchy. Make it suitable for students and educators.`;

    let image;

    try {
        image = (await generateGatewayImage({ model: config.imageModel, prompt: imagePrompt, size: config.imageSize })).image;
    } catch (error) {
        const errorMessage = error instanceof Error ? `AI Gateway image error: ${error.message}` : 'AI Gateway image generation error';
        const status = error instanceof Error && 'statusCode' in error ? error.statusCode : null;

        if (status === 402) throw new VendorError('Vercel AI Gateway', errorMessage, { cause: error }, 'our Vercel AI Gateway account has run out of credits');
        if (status === 429) throw new VendorError('Vercel AI Gateway', errorMessage, { cause: error }, 'the AI Gateway is getting too many requests right now');
        if (status === 401) throw new VendorError('Vercel AI Gateway', errorMessage, { cause: error }, 'our AI Gateway API key isn\'t valid');
        if (status === 403) throw new VendorError('Vercel AI Gateway', errorMessage, { cause: error }, 'the AI Gateway denied access to its image service');

        throw new VendorError('Vercel AI Gateway', errorMessage, { cause: error });
    }

    const uploadResult = await uploadFile(new File([Buffer.from(image.uint8Array)], `${threadId}-infographic.png`, { type: 'image/png' }));

    if (!uploadResult.data) throw new VendorError('UploadThing', 'Failed to upload image - No data in upload result');

    const infographic = {
        imageUrl: uploadResult.data.ufsUrl,
        description: descriptionResult.text,
        generatedAt: new Date().toISOString(),
        fileKey: uploadResult.data.key
    };

    await saveContent(threadId, 'infographic', infographic);

    return infographic;
}
