import { GoogleGenAI } from '@google/genai';
import { uploadFile } from './uploadthing';

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
});

// Generate image and return buffer
async function generateImageBuffer(prompt: string) {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: prompt,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) {
            const buffer = Buffer.from(part.inlineData.data, 'base64');
            return buffer;
        }
    }
    return null;
}

// Generate image and upload to UploadThing
async function generateImage(prompt: string, filename?: string) {
    const buffer = await generateImageBuffer(prompt);
    if (buffer) {
        const file = new File([buffer], filename || 'generated-image.png', { type: 'image/png' });
        const uploadResult = await uploadFile(file);
        return { buffer, uploadResult };
    }
    return null;
}

export { generateImageBuffer, generateImage }
