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
        const errorMessage = error instanceof Error ? `OpenAI API error: ${error.message}` : 'OpenAI image generation error';

        throw new VendorError('OpenAI', errorMessage, { cause: error, reason: getImageFailureReason(error) });
    }
}

// User-safe explanation of why the OpenAI image request failed, or undefined when the cause is unknown
function getImageFailureReason<T>(error: T): string | undefined {
    if (error instanceof OpenAI.APIConnectionError) return 'we couldn\'t reach OpenAI';
    if (!(error instanceof OpenAI.APIError)) return undefined;

    if (error.code === 'insufficient_quota' || error.code === 'billing_hard_limit_reached' || error.code === 'credit_balance_exhausted') {
        return 'our OpenAI account has run out of credits';
    }
    if (error.code === 'content_policy_violation' || error.code === 'moderation_blocked') {
        return 'OpenAI\'s safety system blocked the image';
    }
    if (error.status === 429) return 'OpenAI is getting too many requests right now';
    if (error.status === 401) return 'our OpenAI API key isn\'t valid';
    if (error.status === 403) return 'OpenAI denied access to its image service';
    if (error.status === 404) return `OpenAI couldn't find the ${config.imageModel} image model`;
    if (error.status !== undefined && error.status >= 500) return 'OpenAI\'s image service is having problems';

    return undefined;
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
