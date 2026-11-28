import { getLatestContent } from '@/lib/content/latest/';

export interface SlideshowData {
    content: string;
    html: string;
}

export async function getLatestSlideshow(threadId: string): Promise<{ content: string | null; html: string | null }> {
    const content = await getLatestContent(threadId, 'slideshow');

    if (typeof content === 'object' && content !== null && 'content' in content && typeof content.content === 'string') {
        if (content.content) {
            return {
                content: content.content,
                html: 'html' in content && typeof content.html === 'string' ? content.html : null
            };
        }
    }

    return {
        content: null,
        html: null
    };
}
