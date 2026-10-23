import { getLatestContent } from '@/lib/content/latest/';

export interface SlideshowData {
    content: string;
    html: string;
}

export interface SlideshowResult {
    content: string | null;
    html: string | null;
}

export async function getLatestSlideshow(threadId: string): Promise<SlideshowResult> {
    const content = await getLatestContent(threadId, 'slideshow');

    if (typeof content === 'object' && content !== null && 'content' in content && typeof content.content === 'string') {
        if (content.content) {
            return {
                content: content.content,
                html
            };
        }
    }

    return {
        content: null,
        html: null
    };
}
