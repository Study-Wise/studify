import { uploadImageByUrl } from './uploadthing';
import config from './config';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Generate image and return URL
async function generateImageUrl(prompt: string) {
    try {
        const response = await openai.images.generate({
            model: config.imageModel,
            prompt: prompt,
            n: 1,
            size: config.imageSize,
            response_format: 'url',
        });

        if (response.data && response.data.length > 0 && response.data[0].url) {
            return response.data[0].url;
        }

        throw new Error('OpenAI API returned no images in response');
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

// Generate image and return buffer
async function generateImageBuffer(prompt: string) {
    const imageUrl = await generateImageUrl(prompt);

    if (imageUrl) {
        // Fetch the image from the URL
        const imageResponse = await fetch(imageUrl);
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return buffer;
    }

    return null;
}

// Generate image and upload to UploadThing
async function generateImage(prompt: string) {
    const imageUrl = await generateImageUrl(prompt);
    if (imageUrl) {
        const uploadResult = await uploadImageByUrl(imageUrl);
        return { imageUrl: uploadResult.data?.ufsUrl ?? imageUrl ?? null, uploadResult };
    }
    return { imageUrl: null, uploadResult: null };
}

export { generateImageUrl, generateImageBuffer, generateImage }
