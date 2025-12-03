import { uploadImageByUrl } from './uploadthing';
import config from './config';
import type { IdeogramResponse } from './types';

const IDEOGRAM_API_KEY = process.env.IDEOGRAM_API_KEY || '';
const IDEOGRAM_API_URL = 'https://api.ideogram.ai/v1/ideogram-v3/generate';

// Generate image and return URL
async function generateImageUrl(prompt: string) {
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('aspect_ratio', '1x1');
    formData.append('rendering_speed', config.infographicSpeed);

    const response = await fetch(IDEOGRAM_API_URL, {
        method: 'POST',
        headers: {
            'Api-Key': IDEOGRAM_API_KEY,
        },
        body: formData,
    });

    if (!response.ok) {
        let errorMessage = `Ideogram API error (${response.status} ${response.statusText})`;

        // Handle specific error codes
        if (response.status === 524) {
            errorMessage = 'Ideogram API timeout - The image generation took too long. Please try again.';
        } else if (response.status === 429) {
            errorMessage = 'Ideogram API rate limit exceeded - Please wait a moment and try again.';
        } else if (response.status === 401 || response.status === 403) {
            errorMessage = 'Ideogram API authentication failed - Please check your API key.';
        } else {
            try {
                const errorText = await response.text();
                if (errorText) {
                    // Check if response is HTML (error page)
                    if (errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<html')) {
                        // Don't include the full HTML, just the status
                        errorMessage = `Ideogram API error (${response.status}): Server returned an error page`;
                    } else {
                        // Try to parse as JSON
                        try {
                            const errorData = JSON.parse(errorText);
                            if (errorData.error || errorData.message) {
                                errorMessage += `: ${errorData.error || errorData.message}`;
                            }
                        } catch {
                            // Use the raw text if it's not too long
                            if (errorText.length < 200) {
                                errorMessage += `: ${errorText}`;
                            }
                        }
                    }
                }
            } catch {
                // Couldn't read response body
            }
        }

        throw new Error(errorMessage);
    }

    const data: IdeogramResponse = await response.json();

    if (data.data && data.data.length > 0) {
        return data.data[0].url;
    }

    throw new Error('Ideogram API returned no images in response');
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
    return { imageUrl: null, uploadResult: null };
}

export { generateImageUrl, generateImageBuffer, generateImage }
