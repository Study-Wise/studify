import type { User } from 'better-auth';
import { checkThreadAccess } from '@/lib/auth/check-thread-access';
import { getLatestContent } from '@/lib/content/latest/';

export interface SlideshowData {
    content: string;
    html: string;
}

export async function getLatestSlideshow(threadId: string, user: User | null): Promise<{ content: string | null; html: string | null } | null> {
    if (!await checkThreadAccess(threadId, user)) return null;

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
