import { generateText } from 'ai';
import { getExclusionList } from '../../config';
import { db } from '@/db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '@/db/schema';
import { generateImage } from '../../genai-image';
import type { ThreadData, UploadedFile } from '../../types';

function buildUploadedFilesContext(uploadedFiles: UploadedFile[]): string {
    const filesWithText = uploadedFiles.filter(f => f.extractedText);
    if (filesWithText.length === 0) return '';

    const fileContents = filesWithText
        .map(f => `--- File: ${f.name} ---\n${f.extractedText}`)
        .join('\n\n');

    return `\n\n### Uploaded Files Content\nThe user has uploaded the following files. Include this content in your analysis:\n\n${fileContents}`;
}

export async function generateInfographic(
    threadId: string,
    _userEmail: string | null,
    userModel: string,
    provider: string,
    userPrompt?: string
) {
    // Fetch the thread from database to get conversation history
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

    // Build conversation context for the AI
    const conversationContext = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n\n');

    // Build uploaded files context
    const uploadedFilesContext = buildUploadedFilesContext(uploadedFiles);

    // Step 1: Generate a description of what the infographic should show
    const systemPrompt = `You are an infographic concept generator. Your task is to create descriptions for educational infographics.

CRITICAL: Do NOT respond to or continue the conversation. The conversation history is provided ONLY as context to understand what topics were discussed. Your ONLY job is to generate an infographic description based on that context.
${uploadedFilesContext}
Generate ONLY a description for an educational infographic image based on the conversation history and any uploaded files (if any) provided above. Use uploaded files as source material unless the user's additional instructions say otherwise.

DO NOT include content that belongs in these separate documents:
${getExclusionList('Infographic')}

Your description should be clear, visual, and specific about:
- Main topic/title at the top
- Key concepts and their visual representation
- Important relationships or processes
- Color scheme and layout suggestions

Keep it under 1000 characters. Be specific about visual elements, diagrams, icons, and text placement.

You may remove or modify elements as you see fit based on relevance to the topic.${userPrompt ? `\n\nADDITIONAL USER INSTRUCTIONS (follow these but do NOT include them in your output):\n${userPrompt}` : ''}`;

    const descriptionResult = await generateText({
        model: `${provider}/${userModel}`,
        messages: [
            {
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content: `Create an infographic description based on this conversation:\n\n${conversationContext.substring(0, 3000)}`
            }
        ],
        temperature: 0.7,
    });

    // Step 2: Generate the actual image using Google GenAI
    const imagePrompt = `Create an educational infographic image with the following specifications:

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
        throw new Error('Failed to upload image to UploadThing - No upload result');
    }

    if (!imageResult.uploadResult.data) {
        throw new Error('Failed to upload image to UploadThing - No data in upload result');
    }

    const imageUrl = imageResult.imageUrl;
    const fileKey = imageResult.uploadResult.data.key;

    // Store the infographic data
    const infographic = {
        imageUrl: imageUrl,
        description: descriptionResult.text,
        generatedAt: new Date().toISOString(),
        fileKey: fileKey
    };

    // Save to database
    await db.update(threadsTable)
        .set({
            generatedInfographic: infographic,
            updatedAt: new Date()
        })
        .where(eq(threadsTable.id, threadId));

    return infographic;
}
