import OpenAI from 'openai';
import config from '@/lib/ai.config';
import { uploadFile } from '@/lib/uploadthing';
import { VendorError } from '@/lib/user-errors';

const openai = new OpenAI({
    apiKey: import.meta.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

async function generateImageBuffer(prompt: string) {
    try {
        // gpt-image models use output_format and always return base64
        const response = await openai.images.generate({
            model: config.imageModel,
            prompt: prompt,
            n: 1,
            size: config.imageSize,
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

        if (error instanceof Error) errorMessage = `OpenAI API error: ${error.message}`;

        if (error instanceof OpenAI.APIError) {
            if (error.code === 'insufficient_quota' || error.code === 'credit_balance_exhausted') throw new VendorError('OpenAI', errorMessage, { cause: error }, 'our OpenAI account has run out of credits');
            if (error.status === 429) throw new VendorError('OpenAI', errorMessage, { cause: error }, 'OpenAI is getting too many requests right now');
            if (error.status === 401) throw new VendorError('OpenAI', errorMessage, { cause: error }, 'our OpenAI API key isn\'t valid');
            if (error.status === 403) throw new VendorError('OpenAI', errorMessage, { cause: error }, 'OpenAI denied access to its image service');
        }

        throw new VendorError('OpenAI', errorMessage, { cause: error });
    }
}

async function generateImage(prompt: string, filename: string = 'infographic.png') {
    const buffer = await generateImageBuffer(prompt);

    if (buffer) {
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
