import type { SlideshowResult } from '@/lib/types';
import { db } from '@/db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '@/db/schema';

export async function getLatestSlideshow(
    threadId: string,
): Promise<SlideshowResult> {
    // Get the slideshow from the database
    try {
        const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));
        if (threads.length > 0 && threads[0].generatedSlideshow) {
            const slideshow = threads[0].generatedSlideshow as { content?: string };
            if (slideshow.content) {
                return {
                    content: slideshow.content
                };
            }
        }
    } catch (error) {
        console.error('Error fetching slideshow from database:', error);
    }

    // No slideshow found
    return {
        content: null
    };
}
