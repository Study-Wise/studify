import { generateImage as generateGatewayImage } from 'ai';
import config from '@/lib/ai.config';
import { uploadFile } from '@/lib/uploadthing';
import { VendorError } from '@/lib/user-errors';

async function generateImageBuffer(prompt: string) {
    try {
        const { image } = await generateGatewayImage({
            model: config.imageModel,
            prompt,
            size: config.imageSize,
        });

        return Buffer.from(image.uint8Array);
    } catch (error) {
        const errorMessage = error instanceof Error ? `AI Gateway image error: ${error.message}` : 'AI Gateway image generation error';
        const status = error instanceof Error && 'statusCode' in error ? error.statusCode : null;

        if (status === 402) throw new VendorError('Vercel AI Gateway', errorMessage, { cause: error }, 'our Vercel AI Gateway account has run out of credits');
        if (status === 429) throw new VendorError('Vercel AI Gateway', errorMessage, { cause: error }, 'the AI Gateway is getting too many requests right now');
        if (status === 401) throw new VendorError('Vercel AI Gateway', errorMessage, { cause: error }, 'our AI Gateway API key isn\'t valid');
        if (status === 403) throw new VendorError('Vercel AI Gateway', errorMessage, { cause: error }, 'the AI Gateway denied access to its image service');

        throw new VendorError('Vercel AI Gateway', errorMessage, { cause: error });
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
