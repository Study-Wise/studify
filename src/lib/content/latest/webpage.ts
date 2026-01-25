import { db } from '@/db/initialize';
import { eq } from 'drizzle-orm';
import { threadsTable } from '@/db/schema';

export interface WebpageResult {
    content: string | null;
}

export async function getLatestWebpage(
    threadId: string,
): Promise<WebpageResult> {
    // Get the webpage from the database
    try {
        const threads = await db.select().from(threadsTable).where(eq(threadsTable.id, threadId));
        if (threads.length > 0 && threads[0].generatedWebpage) {
            return {
                content: threads[0].generatedWebpage
            };
        }
    } catch (error) {
        console.error('Error fetching webpage from database:', error);
    }

    // No webpage found
    return {
        content: null
    };
}
