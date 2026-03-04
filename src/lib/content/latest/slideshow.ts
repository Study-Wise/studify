import type { SlideshowResult } from '@/lib/types';
import { getLatestContent } from './index';

export async function getLatestSlideshow(
    threadId: string,
): Promise<SlideshowResult> {
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
