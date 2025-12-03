import { uploadImageByUrl, uploadImageFromBase64 } from './uploadthing';
import config from './config';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Generate image and return base64
async function generateImageBase64(prompt: string) {
    try {
        const response = await openai.images.generate({
            model: config.imageModel,
            prompt: prompt,
            n: 1,
            size: config.imageSize,
        });

        if (response.data && response.data.length > 0 && response.data[0].b64_json) {
            return response.data[0].b64_json;
        }

        throw new Error(`OpenAI API returned no base64 image data`);
    } catch (error: any) {
        let errorMessage = 'OpenAI image generation error';

        if (error.status === 429) {
            errorMessage = 'OpenAI API rate limit exceeded - Please wait a moment and try again.';
        } else if (error.status === 401 || error.status === 403) {
            errorMessage = 'OpenAI API authentication failed - Please check your API key.';
        } else if (error.message) {
            errorMessage = `OpenAI API error: ${error.message}`;
        }

        throw new Error(errorMessage);
    }
}

// Generate image and return URL (deprecated, kept for backwards compatibility)
async function generateImageUrl(prompt: string) {
    const base64 = await generateImageBase64(prompt);
    // For now, we'll need to upload and return the URL
    const uploadResult = await uploadImageFromBase64(base64, 'generated-image.png');
    return uploadResult.data?.url || null;
}

// Generate image and return buffer
async function generateImageBuffer(prompt: string) {
    const base64 = await generateImageBase64(prompt);
    if (base64) {
        const buffer = Buffer.from(base64, 'base64');
        return buffer;
    }
    return null;
}

// Generate image and upload to UploadThing
async function generateImage(prompt: string) {
    const base64 = await generateImageBase64(prompt);
    if (base64) {
        const uploadResult = await uploadImageFromBase64(base64, 'infographic.png');
        const imageUrl = uploadResult.data?.url || null;
        return { imageUrl, uploadResult };
    }
    return { imageUrl: null, uploadResult: null };
}

export { generateImageUrl, generateImageBuffer, generateImage, generateImageBase64 }
