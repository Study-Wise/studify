import { generateText } from 'ai';
import { db } from '../../../db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '../../../db/schema';
import { getMessages } from '../../threads';
import { generateImage } from '../../genai-image';

export async function generateInfographic(
    threadId: string,
    userEmail: string | null,
    userModel: string,
    provider: string
) {
    // Get conversation history
    const messages = await getMessages(threadId, userEmail);

    if (messages.length === 0) {
        throw new Error('No messages found in thread');
    }

    // Build conversation context for the AI
    const conversationContext = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n\n');

    // Step 1: Generate a description of what the infographic should show
    const systemPrompt = `You are an expert at analyzing educational conversations and creating infographic concepts. Based on the conversation history provided, create a detailed description for an educational infographic image.

Your description should be clear, visual, and specific about:
- Main topic/title at the top
- Key concepts and their visual representation
- Important relationships or processes
- Color scheme and layout suggestions

Keep it under 1000 characters. Be specific about visual elements, diagrams, icons, and text placement.`;

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

    const imageResult = await generateImage(imagePrompt);

    if (!imageResult) {
        throw new Error('Failed to generate image - No result from Ideogram API');
    }

    if (!imageResult.imageUrl) {
        throw new Error('Failed to generate image - No image URL returned from Ideogram API');
    }

    if (!imageResult.uploadResult) {
        throw new Error('Failed to upload image to UploadThing - No upload result');
    }

    if (!imageResult.uploadResult.data) {
        throw new Error('Failed to upload image to UploadThing - No data in upload result');
    }

    const imageUrl = imageResult.uploadResult.data.url;
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
