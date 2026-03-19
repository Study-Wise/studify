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
    
    if (content && typeof content === 'object') {
        const slideshow = content as { content?: string; html?: string };
        if (slideshow.content) {
            return {
                content: slideshow.content,
                html: slideshow.html ?? null
            };
        }
    }

    return {
        content: null,
        html: null
    };
}
