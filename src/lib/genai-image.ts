import { uploadImageByUrl } from './uploadthing';

const IDEOGRAM_API_KEY = process.env.IDEOGRAM_API_KEY || '';
const IDEOGRAM_API_URL = 'https://api.ideogram.ai/v1/ideogram-v3/generate';

interface IdeogramResponse {
    data: Array<{
        url: string;
        prompt: string;
        resolution: string;
        is_image_safe: boolean;
        seed: number;
    }>;
}

// Generate image and return URL
async function generateImageUrl(prompt: string) {
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('aspect_ratio', '1x1');
    formData.append('rendering_speed', 'DEFAULT');

    const response = await fetch(IDEOGRAM_API_URL, {
        method: 'POST',
        headers: {
            'Api-Key': IDEOGRAM_API_KEY,
        },
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Ideogram API error: ${response.statusText}`);
    }

    const data: IdeogramResponse = await response.json();

    if (data.data && data.data.length > 0) {
        return data.data[0].url;
    }

    return null;
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
        return { imageUrl, uploadResult };
    }
    return null;
}

export { generateImageUrl, generateImageBuffer, generateImage }
