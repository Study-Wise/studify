import OpenAI from 'openai';

import { uploadFile } from '@/lib/uploadthing';
import config from '@/lib/config';

const openai = new OpenAI({
    apiKey: import.meta.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

// Generate image and return buffer (gpt-image models return base64)
async function generateImageBuffer(prompt: string) {
    try {
        // gpt-image models use output_format and always return base64
        const response = await openai.images.generate({
            model: config.imageModel,
            prompt: prompt,
            n: 1,
            size: config.imageSize === 'auto' ? '1024x1024' : config.imageSize,
            output_format: 'png'
        });

        if (response.data && response.data.length > 0 && response.data[0].b64_json) {
            const base64Data = response.data[0].b64_json;
            const buffer = Buffer.from(base64Data, 'base64');
            return buffer;
        }

        throw new Error('OpenAI API returned no images in response');
    } catch (error) {
        let errorMessage = 'OpenAI image generation error';

        if (error instanceof Error) {
            errorMessage = `OpenAI API error: ${error.message}`;
        }
        else if (error && typeof error === 'object') {
            if ('status' in error && error.status === 429) {
                errorMessage = 'OpenAI API rate limit exceeded - Please wait a moment and try again.';
            }
            else if ('status' in error && (error.status === 401 || error.status === 403)) {
                errorMessage = 'OpenAI API authentication failed - Please check your API key.';
            }
        }

        throw new Error(errorMessage, { cause: error });
    }
}

// Generate image and upload to UploadThing
async function generateImage(prompt: string, filename: string = 'infographic.png') {
    const buffer = await generateImageBuffer(prompt);

    if (buffer) {
        // Convert buffer to File for upload
        const file = new File([buffer], filename, { type: 'image/png' });
        const uploadResult = await uploadFile(file);

        return {
            imageUrl: uploadResult.data?.ufsUrl ?? null,
            uploadResult
        };
    }

    return { imageUrl: null, uploadResult: null };
}

export { generateImageBuffer, generateImage }
