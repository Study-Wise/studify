import { GoogleGenAI } from '@google/genai';
import { uploadFile } from './uploadthing';

const ai = new GoogleGenAI({});

// Generate image and return buffer
async function generateImageBuffer(prompt: string) {
    const response = await ai.models.generateContent({
        model: 'Gemini 3 Pro Image Preview (Nano Banana Pro Preview)',
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
